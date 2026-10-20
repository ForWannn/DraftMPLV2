// Jembatan control <-> display. Jalankan: npm install && npm start
const express = require('express'), http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const UP = path.join(__dirname, 'uploads'), SF = path.join(__dirname, 'state.json');
fs.mkdirSync(UP, { recursive: true });

const team = () => ({ name: '', logo: '' });
const match = () => ({ bo: 3, time: '', a: team(), b: team(), sa: 0, sb: 0 });
let state = {
    countdown: {
        mode: 'window', playing: false,
        timer: { running: false, left: 3599000, endsAt: 0 },
        matches: [match(), match(), match()], casters: [], playlist: [],
    },
};
try { state = { ...state, ...JSON.parse(fs.readFileSync(SF, 'utf8')) }; } catch { }

const app = express(), server = http.createServer(app);

app.post('/upload', express.raw({ type: '*/*', limit: '300mb' }), (req, res) => {
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'empty' });
    const ext = path.extname(String(req.query.name || '')).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const file = Date.now() + '-' + Math.random().toString(36).slice(2, 7) + ext;
    fs.writeFileSync(path.join(UP, file), req.body);
    res.json({ url: '/uploads/' + file });
});
app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });
const pack = () => JSON.stringify({ type: 'state', state, now: Date.now() });
const broadcast = () => {
    const m = pack();
    wss.clients.forEach(c => c.readyState === 1 && c.send(m));
    fs.writeFile(SF, JSON.stringify(state), () => { });
};
const KEYS = ['mode', 'playing', 'matches', 'casters', 'playlist', 'activeMatch', 'ad'];

wss.on('connection', ws => {
    ws.send(pack());
    ws.on('message', raw => {
        let m; try { m = JSON.parse(raw); } catch { return; }
        const s = state[m.page]; if (!s) return;
        if (m.type === 'patch' && KEYS.includes(m.key)) s[m.key] = m.value;
        else if (m.type === 'timer') {
            const t = s.timer, now = Date.now();
            if (m.action === 'start') { t.left = +m.ms || 0; t.endsAt = now + t.left; t.running = true; }
            else if (m.action === 'stop') { t.left = Math.max(0, t.endsAt - now); t.running = false; }
            else if (m.action === 'set') { t.left = +m.ms || 0; t.endsAt = now + t.left; t.running = false; }
        } else return;
        broadcast();
    });
});

server.listen(PORT, () => console.log(`Buka http://localhost:${PORT}`));