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

app.post('/upload', express.raw({ type: '*/*', limit: '300mb' }), (req, res) => {
    if (!req.body || !req.body.length) {
        return res.status(400).json({ error: 'empty' });
    }

    const ext = path.extname(String(req.query.name || ''))
        .toLowerCase()
        .replace(/[^.a-z0-9]/g, '');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.body);
    res.json({ url: `/uploads/${filename}` });
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
