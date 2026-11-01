// MLBB Broadcast Overlay Suite — shared WebSocket server
// Preserves the existing countdown protocol and adds generic per-overlay channels.
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const STATE_FILE = path.join(__dirname, 'state.json');
const MATCH_ARCHIVE_FILE = path.join(__dirname, 'match-archive.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const createTeam = () => ({ name: '', logo: '' });
const createMatch = () => ({
    bo: 3,
    time: '',
    a: createTeam(),
    b: createTeam(),
    sa: 0,
    sb: 0
});

let matchArchive = { version: 1, games: [] };
try {
    const savedArchive = JSON.parse(fs.readFileSync(MATCH_ARCHIVE_FILE, 'utf8'));
    if (savedArchive && Array.isArray(savedArchive.games)) matchArchive = savedArchive;
} catch (_) {
    // A separate archive file is created when the first game is finished.
}

let state = {
    countdown: {
        mode: 'window',
        playing: false,
        timer: { running: false, left: 3599000, endsAt: 0 },
        matches: [createMatch(), createMatch(), createMatch()],
        casters: [],
        playlist: []
    },
    // Generic state storage for draft, scoreboard, caster, and future overlays.
    overlays: {},
    overlayRevisions: {}
};

try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state = { ...state, ...saved };
} catch (_) {
    // First run: keep the default state.
}

if (!state.overlays || typeof state.overlays !== 'object') state.overlays = {};
if (!state.overlayRevisions || typeof state.overlayRevisions !== 'object') state.overlayRevisions = {};

const app = express();
const server = http.createServer(app);

// Match archive payloads can include compressed player portraits and team logos.
app.use(express.json({ limit: '50mb' }));

app.post('/upload', express.raw({ type: '*/*', limit: '300mb' }), (req, res) => {
    if (!req.body || !req.body.length) {
        return res.status(400).json({ error: 'empty' });
    }

    const isPlayerPhoto = String(req.query.kind || '') === 'player-photo';
    if (isPlayerPhoto) {
        const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        const body = req.body;
        const contentType = String(req.headers['content-type'] || '').toLowerCase();
        if (body.length > 15 * 1024 * 1024) {
            return res.status(413).json({ error: 'Player PNG exceeds the 15 MB limit.' });
        }
        if (!contentType.startsWith('image/png') || body.length < 33 || !body.subarray(0, 8).equals(pngSignature)) {
            return res.status(415).json({ error: 'Player photo upload accepts PNG files only.' });
        }

        // PNG IHDR color type 4/6 carries alpha; indexed PNG may carry transparency via tRNS.
        let offset = 8;
        let hasAlpha = false;
        let validPngChunks = false;
        while (offset + 12 <= body.length) {
            const chunkLength = body.readUInt32BE(offset);
            const chunkType = body.toString('ascii', offset + 4, offset + 8);
            const chunkEnd = offset + 12 + chunkLength;
            if (chunkEnd > body.length) break;
            if (chunkType === 'IHDR') {
                const colorType = body[offset + 17];
                hasAlpha = colorType === 4 || colorType === 6;
                validPngChunks = true;
            } else if (chunkType === 'tRNS') {
                hasAlpha = true;
            } else if (chunkType === 'IEND') {
                break;
            }
            offset = chunkEnd;
        }
        if (!validPngChunks || !hasAlpha) {
            return res.status(415).json({ error: 'Player PNG must support transparency (alpha channel). Remove the background first.' });
        }

        const filename = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), body);
        return res.json({ url: `/uploads/${filename}`, mimeType: 'image/png', format: 'png' });
    }

    // Preserve the existing generic upload behavior for logos and other overlay assets.
    const ext = path.extname(String(req.query.name || ''))
        .toLowerCase()
        .replace(/[^.a-z0-9]/g, '');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.body);
    const response = { url: `/uploads/${filename}` };
    if (ext === '.png') {
        response.mimeType = 'image/png';
        response.format = 'png';
    }
    res.json(response);
});

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });
const OPEN = 1;

const LEGACY_COUNTDOWN_KEYS = [
    'mode',
    'playing',
    'matches',
    'casters',
    'playlist',
    'activeMatch',
    'ad'
];


function saveState() {
    fs.writeFile(STATE_FILE, JSON.stringify(state), error => {
        if (error) console.error('[State] Failed to save state:', error.message);
    });
}

function sendJson(ws, message) {
    if (ws.readyState === OPEN) ws.send(JSON.stringify(message));
}

function legacySnapshot() {
    return JSON.stringify({ type: 'state', state, now: Date.now() });
}

function broadcastLegacyState() {
    const message = legacySnapshot();
    wss.clients.forEach(client => {
        if (client.readyState === OPEN) client.send(message);
    });
    saveState();
}

function isValidChannel(channel) {
    return typeof channel === 'string' && /^[a-z0-9_-]{1,64}$/i.test(channel);
}

function saveMatchArchive() {
    const tempFile = `${MATCH_ARCHIVE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(matchArchive, null, 2), 'utf8');
    fs.renameSync(tempFile, MATCH_ARCHIVE_FILE);
}

// Read persisted overlay snapshots (used to restore the active Match Management session).
app.get('/api/overlays/:channel', (req, res) => {
    const channel = req.params.channel;
    if (!isValidChannel(channel)) return res.status(400).json({ error: 'invalid_channel' });
    res.json(Object.prototype.hasOwnProperty.call(state.overlays, channel)
        ? state.overlays[channel]
        : null);
});

// Read all archived games, or filter them by match ID.
app.get('/api/match-archive', (req, res) => {
    const matchId = String(req.query.matchId || '');
    const games = matchId
        ? matchArchive.games.filter(game => game && game.matchId === matchId)
        : matchArchive.games;
    res.json({ version: matchArchive.version, games });
});

// Save one completed game. A match/game pair is unique to prevent duplicate Finish Game clicks.
app.post('/api/match-archive/game', (req, res) => {
    const record = req.body;
    if (!record || typeof record !== 'object' ||
        typeof record.matchId !== 'string' || !record.matchId.trim() ||
        !Number.isInteger(Number(record.gameNumber)) || Number(record.gameNumber) < 1 ||
        !record.heroes || !record.teams) {
        return res.status(400).json({ error: 'invalid_game_record' });
    }

    const duplicate = matchArchive.games.find(game =>
        game.matchId === record.matchId &&
        Number(game.gameNumber) === Number(record.gameNumber)
    );
    if (duplicate) {
        return res.status(409).json({ error: 'game_already_archived', recordId: duplicate.recordId });
    }

    const savedRecord = {
        ...record,
        gameNumber: Number(record.gameNumber),
        archivedAt: Date.now()
    };
    matchArchive.games.push(savedRecord);

    try {
        saveMatchArchive();
    } catch (error) {
        matchArchive.games.pop();
        console.error('[Match Archive] Save failed:', error);
        return res.status(500).json({ error: 'archive_save_failed' });
    }

    res.status(201).json({ ok: true, record: savedRecord });
});

function publishOverlayState(channel, payload, sender) {
    state.overlays[channel] = payload;
    state.overlayRevisions[channel] = (Number(state.overlayRevisions[channel]) || 0) + 1;

    const message = {
        type: 'overlay:state',
        channel,
        payload,
        revision: state.overlayRevisions[channel],
        now: Date.now()
    };

    // Only clients subscribed to this overlay receive its updates.
    wss.clients.forEach(client => {
        if (client.readyState === OPEN &&
            client.overlayChannels &&
            client.overlayChannels.has(channel)) {
            sendJson(client, message);
        }
    });

    saveState();
}

wss.on('connection', ws => {
    ws.overlayChannels = new Set();

    // Legacy clients (currently countdown) still receive the original state envelope.
    sendJson(ws, { type: 'state', state, now: Date.now() });

    ws.on('message', raw => {
        let message;
        try {
            message = JSON.parse(raw.toString());
        } catch (_) {
            return;
        }

        // Generic overlay protocol.
        if (message.type === 'overlay:subscribe') {
            const channel = message.channel;
            if (!isValidChannel(channel)) return;

            ws.overlayChannels.add(channel);
            sendJson(ws, {
                type: 'overlay:state',
                channel,
                payload: Object.prototype.hasOwnProperty.call(state.overlays, channel)
                    ? state.overlays[channel]
                    : null,
                revision: Number(state.overlayRevisions[channel]) || 0,
                now: Date.now()
            });
            return;
        }

        if (message.type === 'overlay:unsubscribe') {
            if (isValidChannel(message.channel)) ws.overlayChannels.delete(message.channel);
            return;
        }

        if (message.type === 'overlay:publish') {
            const channel = message.channel;
            if (!isValidChannel(channel) || !Object.prototype.hasOwnProperty.call(message, 'payload')) {
                return;
            }
            publishOverlayState(channel, message.payload, ws);
            return;
        }

        // Existing countdown protocol — kept compatible with the current countdown HTML.
        const pageState = state[message.page];
        if (!pageState) return;

        if (message.type === 'patch' &&
            message.page === 'countdown' &&
            LEGACY_COUNTDOWN_KEYS.includes(message.key)) {
            pageState[message.key] = message.value;
        } else if (message.type === 'timer' && message.page === 'countdown') {
            const timer = pageState.timer;
            if (!timer) return;

            const now = Date.now();
            if (message.action === 'start') {
                timer.left = Math.max(0, Number(message.ms) || 0);
                timer.endsAt = now + timer.left;
                timer.running = true;

            } else if (message.action === 'stop') {
                timer.left = Math.max(0, timer.endsAt - now);
                timer.running = false;

            } else if (message.action === 'set') {
                timer.left = Math.max(0, Number(message.ms) || 0);
                timer.endsAt = now + timer.left;
                timer.running = false;

            } else {
                return;
            }
        } else {
            return;
        }

        broadcastLegacyState();
    });

    ws.on('close', () => {
        ws.overlayChannels.clear();
    });
});

server.listen(PORT, () => {
    console.log(`MLBB Broadcast Overlay Suite ready at http://localhost:${PORT}`);
});
