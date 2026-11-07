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


// Permanent Team Manager database. Kept in a dot-directory and explicitly blocked
// from static hosting below; player PNGs themselves remain in /uploads.
const Database = require('better-sqlite3');
const crypto = require('crypto');
const TEAM_DB_DIR = path.join(__dirname, '.private-data');
const TEAM_DB_FILE = path.join(TEAM_DB_DIR, 'team-library.sqlite');
const TEAM_PLAYER_UPLOAD_DIR = path.join(UPLOADS_DIR, 'team-manager', 'players');
fs.mkdirSync(TEAM_DB_DIR, { recursive: true });
fs.mkdirSync(TEAM_PLAYER_UPLOAD_DIR, { recursive: true });

const teamDb = new Database(TEAM_DB_FILE);
teamDb.pragma('journal_mode = WAL');
teamDb.pragma('foreign_keys = ON');
teamDb.exec(`
    CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL DEFAULT '',
        coach_name TEXT NOT NULL DEFAULT '',
        logo_url TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        active_roster_version_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        default_role TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS player_photos (
        player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        pose_key TEXT NOT NULL CHECK (pose_key IN ('pose1', 'pose2')),
        image_url TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'image/png',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (player_id, pose_key)
    );
    CREATE TABLE IF NOT EXISTS roster_versions (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id),
        version_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        UNIQUE(team_id, version_number)
    );
    CREATE TABLE IF NOT EXISTS roster_members (
        roster_version_id TEXT NOT NULL REFERENCES roster_versions(id) ON DELETE CASCADE,
        slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
        player_id TEXT NOT NULL REFERENCES players(id),
        role TEXT NOT NULL,
        player_name_snapshot TEXT,
        photo1_snapshot TEXT,
        photo2_snapshot TEXT,
        PRIMARY KEY (roster_version_id, slot_number),
        UNIQUE(roster_version_id, player_id)
    );
    CREATE TABLE IF NOT EXISTS team_presets (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id),
        name TEXT NOT NULL,
        roster_version_id TEXT NOT NULL REFERENCES roster_versions(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(team_id, name)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rosters_team ON roster_versions(team_id, version_number DESC);
    CREATE INDEX IF NOT EXISTS idx_roster_members_player ON roster_members(player_id);
    CREATE INDEX IF NOT EXISTS idx_presets_team ON team_presets(team_id);
`);

// Safe, additive schema migration. Existing Team Manager databases are preserved.
const ensureTeamColumn = (table, column, definition) => {
    const columns = teamDb.pragma(`table_info(${table})`);
    if (!columns.some(item => item.name === column)) {
        teamDb.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
};
ensureTeamColumn('roster_members', 'player_name_snapshot', 'TEXT');
ensureTeamColumn('roster_members', 'photo1_snapshot', 'TEXT');
ensureTeamColumn('roster_members', 'photo2_snapshot', 'TEXT');


// V1.3 migration: a player may be removed from the global library while historical
// roster snapshots retain their copied name, role, and image URLs. The nullable
// player_id therefore uses ON DELETE SET NULL instead of blocking deletion.
{
    const playerIdColumn = teamDb.pragma('table_info(roster_members)').find(column => column.name === 'player_id');
    if (playerIdColumn && playerIdColumn.notnull) {
        teamDb.pragma('foreign_keys = OFF');
        try {
            teamDb.exec('BEGIN IMMEDIATE');
            teamDb.exec(`
                CREATE TABLE roster_members_v3 (
                    roster_version_id TEXT NOT NULL REFERENCES roster_versions(id) ON DELETE CASCADE,
                    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
                    player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
                    role TEXT NOT NULL,
                    player_name_snapshot TEXT,
                    photo1_snapshot TEXT,
                    photo2_snapshot TEXT,
                    PRIMARY KEY (roster_version_id, slot_number),
                    UNIQUE(roster_version_id, player_id)
                );
                INSERT INTO roster_members_v3
                    (roster_version_id, slot_number, player_id, role,
                     player_name_snapshot, photo1_snapshot, photo2_snapshot)
                SELECT roster_version_id, slot_number, player_id, role,
                       player_name_snapshot, photo1_snapshot, photo2_snapshot
                FROM roster_members;
                DROP TABLE roster_members;
                ALTER TABLE roster_members_v3 RENAME TO roster_members;
                CREATE INDEX IF NOT EXISTS idx_roster_members_player ON roster_members(player_id);
            `);
            teamDb.exec('COMMIT');
        } catch (migrationError) {
            try { teamDb.exec('ROLLBACK'); } catch (_) { }
            throw migrationError;
        } finally {
            teamDb.pragma('foreign_keys = ON');
        }
    }
}

const TEAM_ROLES = new Set(['Jungler', 'Roam', 'EXP', 'Gold', 'Mid']);
const nowIso = () => new Date().toISOString();
const newId = prefix => `${prefix}-${crypto.randomUUID()}`;
const cleanText = (value, max = 120) => String(value ?? '').trim().slice(0, max);
const auditTeamChange = (entityType, entityId, action, details = {}) => {
    teamDb.prepare(`INSERT INTO audit_logs (entity_type, entity_id, action, details_json, created_at)
        VALUES (?, ?, ?, ?, ?)`).run(entityType, entityId, action, JSON.stringify(details), nowIso());
};
const teamExists = id => teamDb.prepare("SELECT * FROM teams WHERE id = ? AND deleted_at IS NULL").get(id);
const playerExists = id => teamDb.prepare("SELECT * FROM players WHERE id = ? AND deleted_at IS NULL").get(id);
const photoMapForPlayer = playerId => {
    const rows = teamDb.prepare('SELECT pose_key, image_url FROM player_photos WHERE player_id = ?').all(playerId);
    return Object.fromEntries(rows.map(row => [row.pose_key, row.image_url]));
};
const getRosterDetail = rosterId => {
    if (!rosterId) return null;
    const roster = teamDb.prepare('SELECT * FROM roster_versions WHERE id = ?').get(rosterId);
    if (!roster) return null;
    const members = teamDb.prepare(`
        SELECT
            rm.slot_number,
            rm.role,
            p.id AS player_id,
            COALESCE(rm.player_name_snapshot, p.name, 'Deleted Player') AS player_name,
            COALESCE(p.status, 'deleted_snapshot') AS player_status,
            COALESCE(rm.photo1_snapshot,
                (SELECT image_url FROM player_photos WHERE player_id = rm.player_id AND pose_key = 'pose1')) AS photo1,
            COALESCE(rm.photo2_snapshot,
                (SELECT image_url FROM player_photos WHERE player_id = rm.player_id AND pose_key = 'pose2')) AS photo2
        FROM roster_members rm
        LEFT JOIN players p ON p.id = rm.player_id
        WHERE rm.roster_version_id = ?
        ORDER BY rm.slot_number
    `).all(rosterId).map(member => ({
        slotNumber: member.slot_number,
        playerId: member.player_id,
        name: member.player_name,
        role: member.role,
        playerStatus: member.player_status,
        photos: { pose1: member.photo1 || '', pose2: member.photo2 || '' }
    }));
    return {
        id: roster.id, teamId: roster.team_id, versionNumber: roster.version_number,
        name: roster.name, status: roster.status, createdAt: roster.created_at, members
    };
};
const getTeamDetail = teamId => {
    const team = teamDb.prepare('SELECT * FROM teams WHERE id = ? AND deleted_at IS NULL').get(teamId);
    if (!team) return null;
    const presets = teamDb.prepare('SELECT id, name, roster_version_id AS rosterVersionId, created_at AS createdAt FROM team_presets WHERE team_id = ? ORDER BY name').all(teamId);
    const versions = teamDb.prepare('SELECT id, version_number AS versionNumber, name, status, created_at AS createdAt FROM roster_versions WHERE team_id = ? ORDER BY version_number DESC').all(teamId);
    return {
        id: team.id, name: team.name, shortName: team.short_name, coachName: team.coach_name,
        logoUrl: team.logo_url, status: team.status, activeRosterVersionId: team.active_roster_version_id,
        createdAt: team.created_at, updatedAt: team.updated_at,
        activeRoster: getRosterDetail(team.active_roster_version_id), rosterVersions: versions, presets
    };
};
const validatePngWithAlpha = body => {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!Buffer.isBuffer(body) || body.length < 33 || !body.subarray(0, 8).equals(signature)) return false;
    let offset = 8, hasAlpha = false, hasIHDR = false, hasIEND = false;
    while (offset + 12 <= body.length) {
        const chunkLength = body.readUInt32BE(offset);
        const chunkType = body.toString('ascii', offset + 4, offset + 8);
        const chunkEnd = offset + 12 + chunkLength;
        if (chunkEnd > body.length) return false;
        if (chunkType === 'IHDR') {
            hasIHDR = true;
            const colorType = body[offset + 17];
            hasAlpha = colorType === 4 || colorType === 6;
        } else if (chunkType === 'tRNS') {
            hasAlpha = true;
        } else if (chunkType === 'IEND') {
            hasIEND = true;
            break;
        }
        offset = chunkEnd;
    }
    return hasIHDR && hasIEND && hasAlpha;
};

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


// Only remove files whose resolved paths remain inside the local uploads directory.
// URLs referenced by active overlay state or the match archive are deliberately kept.
const safeUploadPathFromUrl = imageUrl => {
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return null;
    let pathname;
    try { pathname = decodeURIComponent(new URL(imageUrl, 'http://localhost').pathname); }
    catch (_) { return null; }
    if (!pathname.startsWith('/uploads/')) return null;
    const absolute = path.resolve(UPLOADS_DIR, pathname.slice('/uploads/'.length));
    const uploadsRoot = path.resolve(UPLOADS_DIR) + path.sep;
    return absolute.startsWith(uploadsRoot) ? absolute : null;
};
const urlUsedOutsideTeamManager = imageUrl => {
    const sharedState = JSON.stringify({ state, matchArchive });
    return sharedState.includes(imageUrl);
};
const unlinkTeamManagerAsset = imageUrl => {
    const absolute = safeUploadPathFromUrl(imageUrl);
    if (!absolute || !fs.existsSync(absolute) || urlUsedOutsideTeamManager(imageUrl)) return false;
    fs.unlinkSync(absolute);
    return true;
};
const deleteTeamLogoIfUnreferenced = (imageUrl, excludingTeamId) => {
    if (!imageUrl) return false;
    const otherTeamUse = teamDb.prepare(
        'SELECT 1 FROM teams WHERE logo_url=? AND id<>? LIMIT 1'
    ).get(imageUrl, excludingTeamId);
    if (otherTeamUse) return false;
    const playerUse = teamDb.prepare(
        `SELECT 1 FROM player_photos WHERE image_url=?
         UNION SELECT 1 FROM roster_members WHERE photo1_snapshot=? OR photo2_snapshot=? LIMIT 1`
    ).get(imageUrl, imageUrl, imageUrl);
    if (playerUse) return false;
    return unlinkTeamManagerAsset(imageUrl);
};

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



// --------------------------- TEAM MANAGER API ---------------------------
app.get('/api/team-manager/health', (req, res) => {
    res.json({ ok: true, database: 'team-library.sqlite', schemaVersion: 3, rosterSnapshots: true, permanentDelete: true, resetAll: true });
});

app.get('/api/team-manager/teams', (req, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    const rows = teamDb.prepare(`
        SELECT t.id, t.name, t.short_name AS shortName, t.coach_name AS coachName,
               t.logo_url AS logoUrl, t.status, t.active_roster_version_id AS activeRosterVersionId,
               t.updated_at AS updatedAt, rv.name AS activeRosterName, rv.version_number AS activeRosterVersion
        FROM teams t LEFT JOIN roster_versions rv ON rv.id = t.active_roster_version_id
        ${includeArchived ? '' : "WHERE t.deleted_at IS NULL"}
        ORDER BY t.name COLLATE NOCASE
    `).all();
    res.json({ teams: rows });
});

app.post('/api/team-manager/teams', (req, res) => {
    const name = cleanText(req.body?.name, 80);
    if (!name) return res.status(400).json({ error: 'team_name_required' });
    const id = newId('team');
    const now = nowIso();
    const create = teamDb.transaction(() => {
        teamDb.prepare(`INSERT INTO teams (id, name, short_name, coach_name, logo_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`).run(id, name,
            cleanText(req.body.shortName, 16), cleanText(req.body.coachName, 80), '', now, now);
        auditTeamChange('team', id, 'created', { name });
    });
    create();
    res.status(201).json({ team: getTeamDetail(id) });
});

app.get('/api/team-manager/teams/:teamId', (req, res) => {
    const team = getTeamDetail(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    res.json({ team });
});

app.put('/api/team-manager/teams/:teamId', (req, res) => {
    const existing = teamExists(req.params.teamId);
    if (!existing) return res.status(404).json({ error: 'team_not_found' });
    const name = cleanText(req.body?.name, 80);
    if (!name) return res.status(400).json({ error: 'team_name_required' });
    const shortName = cleanText(req.body.shortName, 16);
    const coachName = cleanText(req.body.coachName, 80);
    const logoUrl = cleanText(req.body.logoUrl, 500);
    if (logoUrl && (!logoUrl.startsWith('/uploads/') || logoUrl.includes('..'))) {
        return res.status(400).json({ error: 'invalid_logo_url' });
    }
    teamDb.prepare(`UPDATE teams SET name=?, short_name=?, coach_name=?, logo_url=?, updated_at=? WHERE id=?`)
        .run(name, shortName, coachName, logoUrl, nowIso(), existing.id);
    auditTeamChange('team', existing.id, 'updated', { name, shortName, coachName, logoUrl });
    res.json({ team: getTeamDetail(existing.id) });
});

app.delete('/api/team-manager/teams/:teamId', (req, res) => {
    const existing = teamExists(req.params.teamId);
    if (!existing) return res.status(404).json({ error: 'team_not_found' });
    const now = nowIso();
    teamDb.prepare("UPDATE teams SET status='archived', deleted_at=?, updated_at=? WHERE id=?").run(now, now, existing.id);
    auditTeamChange('team', existing.id, 'archived');
    res.json({ ok: true });
});


// Permanent deletion removes the team, all roster versions, and presets.
// Global Player Library records are intentionally retained.
app.delete('/api/team-manager/teams/:teamId/permanent', (req, res) => {
    const existing = teamDb.prepare('SELECT * FROM teams WHERE id=?').get(req.params.teamId);
    if (!existing) return res.status(404).json({ error: 'team_not_found' });
    const rosterCount = teamDb.prepare('SELECT COUNT(*) AS count FROM roster_versions WHERE team_id=?').get(existing.id).count;
    const presetCount = teamDb.prepare('SELECT COUNT(*) AS count FROM team_presets WHERE team_id=?').get(existing.id).count;
    const logoUrl = existing.logo_url;
    const removeTeam = teamDb.transaction(() => {
        teamDb.prepare('DELETE FROM team_presets WHERE team_id=?').run(existing.id);
        teamDb.prepare(`DELETE FROM roster_members WHERE roster_version_id IN
            (SELECT id FROM roster_versions WHERE team_id=?)`).run(existing.id);
        teamDb.prepare('DELETE FROM roster_versions WHERE team_id=?').run(existing.id);
        teamDb.prepare('DELETE FROM teams WHERE id=?').run(existing.id);
        auditTeamChange('team', existing.id, 'permanently_deleted', {
            name: existing.name, rosterVersionsDeleted: rosterCount, presetsDeleted: presetCount
        });
    });
    try { removeTeam(); }
    catch (error) { return res.status(409).json({ error: 'team_delete_failed', detail: error.message }); }
    const logoRemoved = deleteTeamLogoIfUnreferenced(logoUrl, existing.id);
    res.json({ ok: true, deleted: { team: 1, rosterVersions: rosterCount, presets: presetCount }, logoRemoved });
});

app.get('/api/team-manager/players', (req, res) => {
    const q = cleanText(req.query.q, 80).toLowerCase();
    const rows = teamDb.prepare(`
        SELECT id, name, default_role AS defaultRole, status, created_at AS createdAt, updated_at AS updatedAt
        FROM players WHERE deleted_at IS NULL AND (? = '' OR lower(name) LIKE ?)
        ORDER BY name COLLATE NOCASE
    `).all(q, `%${q}%`).map(player => ({ ...player, photos: photoMapForPlayer(player.id) }));
    res.json({ players: rows });
});

app.post('/api/team-manager/players', (req, res) => {
    const name = cleanText(req.body?.name, 80);
    const role = cleanText(req.body?.defaultRole, 16);
    if (!name) return res.status(400).json({ error: 'player_name_required' });
    if (role && !TEAM_ROLES.has(role)) return res.status(400).json({ error: 'invalid_player_role' });
    const id = newId('player');
    const now = nowIso();
    teamDb.prepare(`INSERT INTO players (id, name, default_role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?)`).run(id, name, role, now, now);
    auditTeamChange('player', id, 'created', { name, defaultRole: role });
    res.status(201).json({ player: { id, name, defaultRole: role, status: 'active', photos: {} } });
});

app.put('/api/team-manager/players/:playerId', (req, res) => {
    const existing = playerExists(req.params.playerId);
    if (!existing) return res.status(404).json({ error: 'player_not_found' });
    const name = cleanText(req.body?.name, 80);
    const role = cleanText(req.body?.defaultRole, 16);
    if (!name) return res.status(400).json({ error: 'player_name_required' });
    if (role && !TEAM_ROLES.has(role)) return res.status(400).json({ error: 'invalid_player_role' });
    teamDb.prepare('UPDATE players SET name=?, default_role=?, updated_at=? WHERE id=?').run(name, role, nowIso(), existing.id);
    auditTeamChange('player', existing.id, 'updated', { name, defaultRole: role });
    res.json({ player: { id: existing.id, name, defaultRole: role, status: existing.status, photos: photoMapForPlayer(existing.id) } });
});

app.delete('/api/team-manager/players/:playerId', (req, res) => {
    const existing = playerExists(req.params.playerId);
    if (!existing) return res.status(404).json({ error: 'player_not_found' });
    const activeMembership = teamDb.prepare(`SELECT rv.team_id FROM roster_members rm
        JOIN roster_versions rv ON rv.id=rm.roster_version_id
        WHERE rm.player_id=? AND rv.status='active' LIMIT 1`).get(existing.id);
    if (activeMembership) return res.status(409).json({ error: 'player_in_active_roster', teamId: activeMembership.team_id });
    const now = nowIso();
    teamDb.prepare("UPDATE players SET status='inactive', deleted_at=?, updated_at=? WHERE id=?").run(now, now, existing.id);
    auditTeamChange('player', existing.id, 'archived');
    res.json({ ok: true });
});


// Permanently remove a Player Library profile. Roster rows keep their immutable
// snapshots; their player_id becomes NULL via the V1.3 schema migration.
app.delete('/api/team-manager/players/:playerId/permanent', (req, res) => {
    const existing = teamDb.prepare('SELECT * FROM players WHERE id=?').get(req.params.playerId);
    if (!existing) return res.status(404).json({ error: 'player_not_found' });
    const photoRows = teamDb.prepare('SELECT image_url FROM player_photos WHERE player_id=?').all(existing.id);
    const rosterReferences = teamDb.prepare('SELECT COUNT(*) AS count FROM roster_members WHERE player_id=?').get(existing.id).count;
    const deletePlayer = teamDb.transaction(() => {
        teamDb.prepare('DELETE FROM players WHERE id=?').run(existing.id);
        auditTeamChange('player', existing.id, 'permanently_deleted', {
            name: existing.name, preservedRosterSnapshots: rosterReferences
        });
    });
    try { deletePlayer(); }
    catch (error) { return res.status(409).json({ error: 'player_delete_failed', detail: error.message }); }

    let removedPhotos = 0;
    let preservedPhotos = 0;
    for (const row of photoRows) {
        const snapshotUse = teamDb.prepare(
            'SELECT 1 FROM roster_members WHERE photo1_snapshot=? OR photo2_snapshot=? LIMIT 1'
        ).get(row.image_url, row.image_url);
        if (snapshotUse || urlUsedOutsideTeamManager(row.image_url)) {
            preservedPhotos++;
            continue;
        }
        if (unlinkTeamManagerAsset(row.image_url)) removedPhotos++;
    }
    res.json({
        ok: true, deleted: { player: 1 }, preservedRosterSnapshots: rosterReferences,
        removedPhotos, preservedPhotos
    });
});

// Upload pose1 / pose2 as original transparent PNG bytes. Old assets are retained
// so a historical match snapshot can continue referencing its original image.
app.post('/api/team-manager/players/:playerId/photos/:pose',
    express.raw({ type: 'image/png', limit: '15mb' }), (req, res) => {
        const player = playerExists(req.params.playerId);
        if (!player) return res.status(404).json({ error: 'player_not_found' });
        const pose = req.params.pose;
        if (!['pose1', 'pose2'].includes(pose)) return res.status(400).json({ error: 'invalid_pose_key' });
        const body = req.body;
        if (!validatePngWithAlpha(body)) return res.status(415).json({ error: 'transparent_png_required' });
        const filename = `${player.id}-${pose}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.png`;
        const absolutePath = path.join(TEAM_PLAYER_UPLOAD_DIR, filename);
        fs.writeFileSync(absolutePath, body, { flag: 'wx' });
        const imageUrl = `/uploads/team-manager/players/${filename}`;
        const now = nowIso();
        teamDb.prepare(`INSERT INTO player_photos (player_id, pose_key, image_url, mime_type, created_at, updated_at)
            VALUES (?, ?, ?, 'image/png', ?, ?)
            ON CONFLICT(player_id, pose_key) DO UPDATE SET image_url=excluded.image_url,
            mime_type='image/png', updated_at=excluded.updated_at`).run(player.id, pose, imageUrl, now, now);
        teamDb.prepare('UPDATE players SET updated_at=? WHERE id=?').run(now, player.id);
        auditTeamChange('player', player.id, 'photo_updated', { pose, imageUrl });
        res.status(201).json({ ok: true, playerId: player.id, pose, url: imageUrl, mimeType: 'image/png', format: 'png' });
    });

app.get('/api/team-manager/teams/:teamId/rosters', (req, res) => {
    if (!teamExists(req.params.teamId)) return res.status(404).json({ error: 'team_not_found' });
    const versions = teamDb.prepare('SELECT id FROM roster_versions WHERE team_id=? ORDER BY version_number DESC').all(req.params.teamId)
        .map(row => getRosterDetail(row.id));
    res.json({ rosters: versions });
});

app.post('/api/team-manager/teams/:teamId/rosters', (req, res) => {
    const team = teamExists(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    const name = cleanText(req.body?.name, 80) || 'Roster';
    const members = Array.isArray(req.body?.members) ? req.body.members : [];
    if (members.length !== 5) return res.status(400).json({ error: 'roster_requires_five_players' });
    const normalized = members.map((member, index) => ({
        slotNumber: Number(member.slotNumber || index + 1),
        playerId: cleanText(member.playerId, 100),
        role: cleanText(member.role, 16)
    }));
    if (normalized.some((m, i) => m.slotNumber !== i + 1 || !m.playerId || !TEAM_ROLES.has(m.role))) {
        return res.status(400).json({ error: 'invalid_roster_member_or_role' });
    }
    if (new Set(normalized.map(m => m.playerId)).size !== 5) return res.status(400).json({ error: 'duplicate_player_in_roster' });
    for (const member of normalized) {
        if (!playerExists(member.playerId)) return res.status(400).json({ error: 'roster_player_not_found', playerId: member.playerId });
        const uploadedPoses = teamDb.prepare('SELECT pose_key FROM player_photos WHERE player_id=?').all(member.playerId).map(row => row.pose_key);
        if (!uploadedPoses.includes('pose1') || !uploadedPoses.includes('pose2')) {
            return res.status(400).json({ error: 'player_requires_two_transparent_png_poses', playerId: member.playerId });
        }
    }

    const nextVersion = (teamDb.prepare('SELECT COALESCE(MAX(version_number), 0) AS n FROM roster_versions WHERE team_id=?').get(team.id).n || 0) + 1;
    const rosterId = newId('roster');
    const now = nowIso();
    const createRoster = teamDb.transaction(() => {
        teamDb.prepare("UPDATE roster_versions SET status='archived' WHERE team_id=? AND status='active'").run(team.id);
        teamDb.prepare(`INSERT INTO roster_versions (id, team_id, version_number, name, status, created_at)
            VALUES (?, ?, ?, ?, 'active', ?)`).run(rosterId, team.id, nextVersion, name, now);
        const insertMember = teamDb.prepare(`
            INSERT INTO roster_members
                (roster_version_id, slot_number, player_id, role, player_name_snapshot, photo1_snapshot, photo2_snapshot)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        normalized.forEach(member => {
            const player = playerExists(member.playerId);
            const photos = photoMapForPlayer(member.playerId);
            insertMember.run(
                rosterId,
                member.slotNumber,
                member.playerId,
                member.role,
                player.name,
                photos.pose1,
                photos.pose2
            );
        });
        teamDb.prepare('UPDATE teams SET active_roster_version_id=?, updated_at=? WHERE id=?').run(rosterId, now, team.id);
        auditTeamChange('roster', rosterId, 'created_and_activated', { teamId: team.id, versionNumber: nextVersion, name });
    });
    createRoster();
    res.status(201).json({ roster: getRosterDetail(rosterId), team: getTeamDetail(team.id) });
});

app.get('/api/team-manager/teams/:teamId/presets', (req, res) => {
    if (!teamExists(req.params.teamId)) return res.status(404).json({ error: 'team_not_found' });
    const presets = teamDb.prepare(`SELECT tp.id, tp.name, tp.roster_version_id AS rosterVersionId,
        rv.version_number AS versionNumber, rv.name AS rosterName
        FROM team_presets tp JOIN roster_versions rv ON rv.id=tp.roster_version_id
        WHERE tp.team_id=? ORDER BY tp.name`).all(req.params.teamId);
    res.json({ presets });
});

app.post('/api/team-manager/teams/:teamId/presets', (req, res) => {
    const team = teamExists(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    const name = cleanText(req.body?.name, 80);
    const rosterVersionId = cleanText(req.body?.rosterVersionId, 100);
    if (!name || !rosterVersionId) return res.status(400).json({ error: 'preset_name_and_roster_required' });
    const roster = teamDb.prepare('SELECT id FROM roster_versions WHERE id=? AND team_id=?').get(rosterVersionId, team.id);
    if (!roster) return res.status(400).json({ error: 'roster_version_not_found' });
    const id = newId('preset');
    try {
        teamDb.prepare('INSERT INTO team_presets (id, team_id, name, roster_version_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, team.id, name, rosterVersionId, nowIso(), nowIso());
    } catch (error) {
        if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'preset_name_exists' });
        throw error;
    }
    auditTeamChange('preset', id, 'created', { teamId: team.id, name, rosterVersionId });
    res.status(201).json({ id, teamId: team.id, name, rosterVersionId });
});

app.delete('/api/team-manager/presets/:presetId', (req, res) => {
    const preset = teamDb.prepare('SELECT * FROM team_presets WHERE id=?').get(req.params.presetId);
    if (!preset) return res.status(404).json({ error: 'preset_not_found' });
    teamDb.prepare('DELETE FROM team_presets WHERE id=?').run(preset.id);
    auditTeamChange('preset', preset.id, 'deleted', { teamId: preset.team_id, name: preset.name });
    res.json({ ok: true });
});

// Stable payload contract for future Draft Control integration.
app.get('/api/team-manager/teams/:teamId/selection', (req, res) => {
    const team = getTeamDetail(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    let rosterId = team.activeRosterVersionId;
    if (req.query.presetId) {
        const preset = teamDb.prepare('SELECT roster_version_id FROM team_presets WHERE id=? AND team_id=?')
            .get(String(req.query.presetId), team.id);
        if (!preset) return res.status(404).json({ error: 'preset_not_found' });
        rosterId = preset.roster_version_id;
    }
    const roster = getRosterDetail(rosterId);
    if (!roster || roster.members.length !== 5) return res.status(409).json({ error: 'active_roster_not_ready' });
    res.json({
        teamId: team.id, name: team.name, shortName: team.shortName, coachName: team.coachName,
        logoUrl: team.logoUrl, rosterVersionId: roster.id, rosterVersion: roster.versionNumber,
        rosterName: roster.name,
        players: roster.members.map(member => ({
            playerId: member.playerId,
            name: member.name,
            role: member.role,
            photo1: member.photos.pose1 || '',
            photo2: member.photos.pose2 || ''
        }))
    });
});

app.get('/api/team-manager/audit', (req, res) => {
    const entityType = cleanText(req.query.entityType, 40);
    const entityId = cleanText(req.query.entityId, 120);
    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const rows = teamDb.prepare(`SELECT id, entity_type AS entityType, entity_id AS entityId,
        action, details_json AS detailsJson, created_at AS createdAt
        FROM audit_logs WHERE (? = '' OR entity_type = ?) AND (? = '' OR entity_id = ?)
        ORDER BY id DESC LIMIT ?`).all(entityType, entityType, entityId, entityId, limit);
    res.json({ logs: rows.map(row => ({ ...row, details: JSON.parse(row.detailsJson) })) });
});

app.get('/api/team-manager/export', (req, res) => {
    const teams = teamDb.prepare('SELECT * FROM teams').all();
    const players = teamDb.prepare('SELECT * FROM players').all();
    const photos = teamDb.prepare('SELECT * FROM player_photos').all();
    const rosters = teamDb.prepare('SELECT * FROM roster_versions').all();
    const members = teamDb.prepare('SELECT * FROM roster_members').all();
    const presets = teamDb.prepare('SELECT * FROM team_presets').all();
    const auditLogs = teamDb.prepare('SELECT * FROM audit_logs').all();
    res.setHeader('Content-Disposition', `attachment; filename="team-manager-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
        format: 'mlbb-team-manager', version: 1, exportedAt: nowIso(), teams, players, photos, rosters, members, presets, auditLogs,
        note: 'Copy the uploads folder as well to preserve PNG image assets.'
    });
});

app.post('/api/team-manager/import', (req, res) => {
    const backup = req.body;
    if (!backup || backup.format !== 'mlbb-team-manager' || Number(backup.version) !== 1 ||
        !Array.isArray(backup.teams) || !Array.isArray(backup.players) || !Array.isArray(backup.rosters) ||
        !Array.isArray(backup.members) || !Array.isArray(backup.photos) || !Array.isArray(backup.presets) ||
        (backup.auditLogs !== undefined && !Array.isArray(backup.auditLogs))) {
        return res.status(400).json({ error: 'invalid_team_manager_backup' });
    }
    const importData = teamDb.transaction(() => {
        const insertTeam = teamDb.prepare(`INSERT OR IGNORE INTO teams (id,name,short_name,coach_name,logo_url,status,active_roster_version_id,created_at,updated_at,deleted_at)
            VALUES (@id,@name,@short_name,@coach_name,@logo_url,@status,@active_roster_version_id,@created_at,@updated_at,@deleted_at)`);
        const insertPlayer = teamDb.prepare(`INSERT OR IGNORE INTO players (id,name,default_role,status,created_at,updated_at,deleted_at)
            VALUES (@id,@name,@default_role,@status,@created_at,@updated_at,@deleted_at)`);
        const insertRoster = teamDb.prepare(`INSERT OR IGNORE INTO roster_versions (id,team_id,version_number,name,status,created_at)
            VALUES (@id,@team_id,@version_number,@name,@status,@created_at)`);
        const insertPhoto = teamDb.prepare(`INSERT OR IGNORE INTO player_photos (player_id,pose_key,image_url,mime_type,created_at,updated_at)
            VALUES (@player_id,@pose_key,@image_url,@mime_type,@created_at,@updated_at)`);
        const insertMember = teamDb.prepare(`INSERT OR IGNORE INTO roster_members
            (roster_version_id,slot_number,player_id,role,player_name_snapshot,photo1_snapshot,photo2_snapshot)
            VALUES (@roster_version_id,@slot_number,@player_id,@role,@player_name_snapshot,@photo1_snapshot,@photo2_snapshot)`);
        const insertPreset = teamDb.prepare(`INSERT OR IGNORE INTO team_presets (id,team_id,name,roster_version_id,created_at,updated_at)
            VALUES (@id,@team_id,@name,@roster_version_id,@created_at,@updated_at)`);
        const insertAudit = teamDb.prepare(`INSERT OR IGNORE INTO audit_logs (id,entity_type,entity_id,action,details_json,created_at)
            VALUES (@id,@entity_type,@entity_id,@action,@details_json,@created_at)`);
        backup.teams.forEach(row => insertTeam.run(row));
        backup.players.forEach(row => insertPlayer.run(row));
        backup.rosters.forEach(row => insertRoster.run(row));
        backup.photos.forEach(row => insertPhoto.run(row));
        backup.members.forEach(row => insertMember.run({
            ...row,
            player_name_snapshot: row.player_name_snapshot ?? null,
            photo1_snapshot: row.photo1_snapshot ?? null,
            photo2_snapshot: row.photo2_snapshot ?? null
        }));
        backup.presets.forEach(row => insertPreset.run(row));
        (backup.auditLogs || []).forEach(row => insertAudit.run(row));
        auditTeamChange('database', 'team-library', 'backup_imported', { teams: backup.teams.length, players: backup.players.length });
    });
    try { importData(); } catch (error) { return res.status(400).json({ error: 'import_failed', detail: error.message }); }
    res.json({
        ok: true, imported: { teams: backup.teams.length, players: backup.players.length, rosters: backup.rosters.length, presets: backup.presets.length },
        note: 'Import merges records by ID. Copy the matching uploads folder to restore image files.'
    });
});


// Destructive Team Manager reset. It clears Team Manager tables and owned assets only.
// The shared state.json and match-archive.json are never modified.
app.post('/api/team-manager/reset', (req, res) => {
    if (req.body?.confirmText !== 'RESET ALL TEAM DATA') {
        return res.status(400).json({ error: 'reset_confirmation_required' });
    }

    const counts = {
        teams: teamDb.prepare('SELECT COUNT(*) AS count FROM teams').get().count,
        players: teamDb.prepare('SELECT COUNT(*) AS count FROM players').get().count,
        rosterVersions: teamDb.prepare('SELECT COUNT(*) AS count FROM roster_versions').get().count,
        presets: teamDb.prepare('SELECT COUNT(*) AS count FROM team_presets').get().count,
        photos: teamDb.prepare('SELECT COUNT(*) AS count FROM player_photos').get().count
    };
    const logoUrls = [...new Set(teamDb.prepare('SELECT logo_url FROM teams WHERE logo_url<>""').all().map(row => row.logo_url))];
    const protectedText = JSON.stringify({ state, matchArchive });
    // Avoid deleting a file that is also referenced by player-photo or roster snapshot data.
    const teamManagerImageRefs = new Set([
        ...teamDb.prepare('SELECT image_url AS url FROM player_photos').all().map(row => row.url),
        ...teamDb.prepare('SELECT photo1_snapshot AS url FROM roster_members WHERE photo1_snapshot IS NOT NULL').all().map(row => row.url),
        ...teamDb.prepare('SELECT photo2_snapshot AS url FROM roster_members WHERE photo2_snapshot IS NOT NULL').all().map(row => row.url)
    ]);
    const playerAssetFiles = fs.existsSync(TEAM_PLAYER_UPLOAD_DIR)
        ? fs.readdirSync(TEAM_PLAYER_UPLOAD_DIR, { withFileTypes: true })
            .filter(entry => entry.isFile())
            .map(entry => ({
                name: entry.name, url: `/uploads/team-manager/players/${entry.name}`,
                path: path.join(TEAM_PLAYER_UPLOAD_DIR, entry.name)
            }))
        : [];

    const clearAll = teamDb.transaction(() => {
        teamDb.prepare('DELETE FROM team_presets').run();
        teamDb.prepare('DELETE FROM roster_members').run();
        teamDb.prepare('DELETE FROM roster_versions').run();
        teamDb.prepare('DELETE FROM player_photos').run();
        teamDb.prepare('DELETE FROM players').run();
        teamDb.prepare('DELETE FROM teams').run();
        teamDb.prepare('DELETE FROM audit_logs').run();
    });

    try { clearAll(); }
    catch (error) { return res.status(500).json({ error: 'team_manager_reset_failed', detail: error.message }); }

    let removedFiles = 0;
    let preservedFiles = 0;
    for (const imageUrl of logoUrls) {
        if (protectedText.includes(imageUrl) || teamManagerImageRefs.has(imageUrl)) { preservedFiles++; continue; }
        if (unlinkTeamManagerAsset(imageUrl)) removedFiles++;
    }
    for (const file of playerAssetFiles) {
        if (protectedText.includes(file.url)) { preservedFiles++; continue; }
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            removedFiles++;
        }
    }
    res.json({
        ok: true, reset: counts, removedFiles, preservedFiles,
        message: 'Team Manager data was reset. Shared overlay state and match archive were preserved.'
    });
});

// Never expose the private SQLite database, WAL, or SHM files through express.static.
app.use('/.private-data', (req, res) => res.sendStatus(404));

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
        // The sender already has its local state. Excluding it avoids redundant
        // self-echoes while every other subscribed control/display receives the update.
        if (client !== sender &&
            client.readyState === OPEN &&
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

        // Atomically initialize a channel only when no shared snapshot exists.
        // This prevents two newly opened controls from overwriting one another's
        // initial state while their hero manifests are still loading.
        if (message.type === 'overlay:seed') {
            const channel = message.channel;
            if (!isValidChannel(channel) || !Object.prototype.hasOwnProperty.call(message, 'payload')) {
                return;
            }
            if (Object.prototype.hasOwnProperty.call(state.overlays, channel)) {
                sendJson(ws, {
                    type: 'overlay:state',
                    channel,
                    payload: state.overlays[channel],
                    revision: Number(state.overlayRevisions[channel]) || 0,
                    now: Date.now()
                });
            } else {
                publishOverlayState(channel, message.payload, ws);
            }
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


function closeTeamDatabase() {
    try { if (teamDb && teamDb.open) teamDb.close(); } catch (_) { }
}
process.on('SIGINT', () => { closeTeamDatabase(); process.exit(0); });
process.on('SIGTERM', () => { closeTeamDatabase(); process.exit(0); });
