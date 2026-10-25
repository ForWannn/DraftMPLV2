
const fs = require('fs');
const path = require('path');

const root = __dirname;
const controlPath = path.join(root, 'control', 'draft.html');
const displayPath = path.join(root, 'display', 'draft.html');
const clientPath = path.join(root, 'shared', 'sync-client.js');

function readRequired(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`File tidak ditemukan: ${path.relative(root, file)}`);
    }
    return fs.readFileSync(file, 'utf8');
}

function ensureClientScript(html) {
    if (/src=["']\.\.\/shared\/sync-client\.js["']/.test(html)) {
        return html;
    }

    const headEnd = html.toLowerCase().lastIndexOf('</head>');
    if (headEnd < 0) {
        throw new Error('Tag </head> tidak ditemukan.');
    }

    return html.slice(0, headEnd) +
        '    <script src="../shared/sync-client.js"></script>\n' +
        html.slice(headEnd);
}

function findMatchingBrace(source, openIndex) {
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let i = openIndex; i < source.length; i++) {
        const ch = source[i];
        const next = source[i + 1];

        if (lineComment) {
            if (ch === '\n') lineComment = false;
            continue;
        }

        if (blockComment) {
            if (ch === '*' && next === '/') {
                blockComment = false;
                i++;
            }
            continue;
        }

        if (quote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === quote) quote = null;
            continue;
        }

        if (ch === '/' && next === '/') {
            lineComment = true;
            i++;
            continue;
        }

        if (ch === '/' && next === '*') {
            blockComment = true;
            i++;
            continue;
        }

        if (ch === "'" || ch === '"' || ch === '`') {
            quote = ch;
            continue;
        }

        if (ch === '{') depth++;

        if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }

    throw new Error('Kurung penutup fungsi tidak ditemukan.');
}

function addPublishHook(html) {
    if (html.includes("MLBBOverlaySync.publish('draft', state)")) {
        return { html, changed: false };
    }

    const match =
        /\bfunction\s+publishDraftState\s*\([^)]*\)\s*\{/.exec(html);

    if (!match) {
        throw new Error(
            'Fungsi publishDraftState() tidak ditemukan. ' +
            'File belum diubah. Periksa struktur control/draft.html.'
        );
    }

    const openBrace = html.indexOf('{', match.index);
    const closeBrace = findMatchingBrace(html, openBrace);

    const hook = `
        // Kirim state draft ke server WebSocket.
        if (window.MLBBOverlaySync) {
            window.MLBBOverlaySync.publish('draft', state);
        }
    `;

    return {
        html: html.slice(0, closeBrace) +
            hook +
            html.slice(closeBrace),
        changed: true
    };
}

function addDisplaySubscription(html) {
    if (html.includes("MLBBOverlaySync.subscribe('draft'")) {
        return { html, changed: false };
    }

    if (!html.includes('applyDraftState')) {
        throw new Error(
            'Fungsi applyDraftState tidak ditemukan. ' +
            'File belum diubah.'
        );
    }

    const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
    const htmlEnd = html.toLowerCase().lastIndexOf('</html>');
    const insertionPoint = bodyEnd >= 0 ? bodyEnd : htmlEnd;

    if (insertionPoint < 0) {
        throw new Error('Tag </body> dan </html> tidak ditemukan.');
    }

    const snippet = `
    <script>
        // Terima state draft dari server.
        if (window.MLBBOverlaySync &&
            typeof applyDraftState === 'function') {
            window.MLBBOverlaySync.subscribe('draft', payload => {
                applyDraftState(payload);
            });
        }
    </script>
`;

    return {
        html: html.slice(0, insertionPoint) +
            snippet +
            html.slice(insertionPoint),
        changed: true
    };
}

function main() {
    let control = readRequired(controlPath);
    let display = readRequired(displayPath);
    readRequired(clientPath);

    control = ensureClientScript(control);
    display = ensureClientScript(display);

    const controlResult = addPublishHook(control);
    control = controlResult.html;

    const displayResult = addDisplaySubscription(display);
    display = displayResult.html;

    // Validasi sebelum menyimpan perubahan.
    if (!control.includes("MLBBOverlaySync.publish('draft', state)")) {
        throw new Error('Validasi control gagal. File belum diubah.');
    }

    if (!display.includes("MLBBOverlaySync.subscribe('draft'")) {
        throw new Error('Validasi display gagal. File belum diubah.');
    }

    // Buat backup terlebih dahulu.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const file of [controlPath, displayPath]) {
        fs.copyFileSync(file, `${file}.backup-${stamp}`);
    }

    fs.writeFileSync(controlPath, control, 'utf8');
    fs.writeFileSync(displayPath, display, 'utf8');

    console.log('Draft sync patch berhasil diterapkan.');
    console.log(
        'Control:',
        controlResult.changed ? 'hook ditambahkan' : 'sudah terpasang'
    );
    console.log(
        'Display:',
        displayResult.changed ? 'hook ditambahkan' : 'sudah terpasang'
    );
    console.log('Backup kedua HTML telah dibuat.');
    console.log('Restart Node.js, lalu reload Chrome dan OBS.');
}

try {
    main();
} catch (error) {
    console.error('\nPATCH GAGAL:', error.message);
    process.exitCode = 1;
}
