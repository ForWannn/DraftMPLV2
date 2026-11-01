// Run from the DraftMPLV2 project root:
//   node patch-player-roles-photos.js
// Adds role selectors and player-photo uploads to both team controls,
// then renders role badges and portraits on the draft display.
// Reuses the existing POST /upload endpoint. Creates timestamped backups.

const fs = require('fs');
const path = require('path');
const root = __dirname;
const controlPath = path.join(root, 'control', 'draft.html');
const displayPath = path.join(root, 'display', 'draft.html');

function read(file) {
    if (!fs.existsSync(file)) throw new Error('Missing file: ' + path.relative(root, file));
    return fs.readFileSync(file, 'utf8');
}
function replaceOne(source, oldText, newText, label) {
    const i = source.indexOf(oldText);
    if (i < 0 || source.indexOf(oldText, i + oldText.length) >= 0) {
        throw new Error('Cannot safely locate ' + label + '. No files changed.');
    }
    return source.slice(0, i) + newText + source.slice(i + oldText.length);
}
function extras(side) {
    let roles = '';
    let photos = '';
    for (let i = 1; i <= 5; i++) {
        roles += `
                                    <select id="player-role-${side}-${i}" class="player-role-select"
                                        aria-label="${side} player ${i} role">
                                        <option value="">Select role</option>
                                        <option value="Jungler">Jungler</option>
                                        <option value="Roam">Roam</option>
                                        <option value="EXP">EXP</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Mid">Mid</option>
                                    </select>`;
        photos += `
                                    <div class="player-photo-control">
                                        <div class="player-photo-preview" id="player-photo-preview-${side}-${i}">
                                            <img alt="Player ${i} photo preview"><span>${String(i).padStart(2, '0')}</span>
                                        </div>
                                        <label class="upload-player-photo" for="upload-player-photo-${side}-${i}">
                                            <span>Upload</span>
                                        </label>
                                        <input type="file" id="upload-player-photo-${side}-${i}"
                                            class="player-photo-input" data-side="${side}" data-player="${i}"
                                            accept="image/png,image/jpeg,image/webp,image/gif" hidden>
                                        <input type="hidden" id="player-photo-url-${side}-${i}" value="">
                                    </div>`;
    }
    return `
                        <div class="players-extra-section">
                            <div class="players-extra-group">
                                <label>Player Role</label>
                                <div class="player-roles">${roles}
                                </div>
                            </div>
                            <div class="players-extra-group">
                                <label>Player Photos</label>
                                <div class="player-photos">${photos}
                                </div>
                            </div>
                        </div>`;
}

const controlCss = `
        /* PLAYER ROLE & PHOTO CONTROLS */
        .players-extra-section { display:flex; flex-direction:column; gap:12px; width:100%; margin-top:2px; }
        .players-extra-group { display:flex; flex-direction:column; gap:7px; width:100%; }
        .players-extra-group > label {
            color:#fff; font-family:'Eixample Regular',sans-serif; font-size:12px;
            font-weight:700; margin:0 !important;
        }
        .player-roles, .player-photos {
            display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; width:100%;
        }
        .player-role-select {
            width:100%; min-width:0; height:40px; padding:0 9px; color:#fff;
            background:#202125; border:1px solid #2e3037; border-radius:10px;
            outline:none; font-family:'Eixample Regular',sans-serif; font-size:12px;
            font-weight:700; cursor:pointer;
        }
        .player-role-select:focus { border-color:#50d3f3; }
        .player-photo-control { display:flex; align-items:center; gap:7px; min-width:0; }
        .player-photo-preview {
            position:relative; width:38px; height:38px; flex:0 0 38px;
            display:flex; align-items:center; justify-content:center; overflow:hidden;
            border:1px solid #343740; border-radius:9px; background:#202125;
            color:#8e95a3; font-family:'Eixample Regular',sans-serif; font-size:11px; font-weight:700;
        }
        .player-photo-preview img { position:absolute; inset:0; width:100%; height:100%; display:none; object-fit:cover; }
        .player-photo-preview.has-photo span { display:none; }
        .upload-player-photo {
            display:flex; align-items:center; justify-content:center; flex:1; min-width:0;
            height:38px; padding:0 5px; margin:0 !important; border:1px solid #32353c;
            border-radius:9px; background:#25262b; color:#fff;
            font-family:'Eixample Regular',sans-serif; font-size:11px !important;
            font-weight:700; cursor:pointer; user-select:none;
        }
        .upload-player-photo:hover { background:#2f3137; border-color:#50d3f3; }
        .upload-player-photo.is-uploading { opacity:.65; pointer-events:none; }
        @media (max-width:900px) {
            .players-name, .player-roles, .player-photos { gap:6px !important; }
            .player-role-select { padding:0 4px; font-size:10px; }
            .player-photo-control { gap:4px; }
            .player-photo-preview { width:32px; height:32px; flex-basis:32px; }
            .upload-player-photo { height:32px; font-size:10px !important; }
        }
        /* END PLAYER ROLE & PHOTO CONTROLS */
`;

const uploadJs = `
            // Upload player portraits to Node.js; publish only the returned URL, not Base64 data.
            function initializePlayerPhotoUploads() {
                document.querySelectorAll('.player-photo-input').forEach(input => {
                    input.addEventListener('change', async event => {
                        const file = event.target.files && event.target.files[0];
                        if (!file) return;
                        const side = input.dataset.side;
                        const playerNo = Number(input.dataset.player);
                        const hidden = document.getElementById('player-photo-url-' + side + '-' + playerNo);
                        const preview = document.getElementById('player-photo-preview-' + side + '-' + playerNo);
                        const previewImage = preview && preview.querySelector('img');
                        const uploadLabel = input.parentElement.querySelector('.upload-player-photo');
                        const uploadText = uploadLabel && uploadLabel.querySelector('span');

                        if (!file.type.startsWith('image/')) {
                            console.warn('[Draft Control] Player photo must be an image.');
                            input.value = '';
                            return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                            console.warn('[Draft Control] Player photo must be 5 MB or smaller.');
                            input.value = '';
                            return;
                        }

                        const oldText = uploadText ? uploadText.textContent : 'Upload';
                        if (uploadText) uploadText.textContent = 'Uploading';
                        if (uploadLabel) uploadLabel.classList.add('is-uploading');
                        try {
                            const uploadName = 'player-' + side + '-' + playerNo + '-' + file.name;
                            const response = await fetch('../upload?name=' + encodeURIComponent(uploadName), {
                                method: 'POST',
                                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                                body: file
                            });
                            const result = await response.json().catch(() => ({}));
                            if (!response.ok || !result.url) {
                                throw new Error(result.error || ('Upload failed (' + response.status + ')'));
                            }
                            if (hidden) hidden.value = result.url;
                            if (previewImage) {
                                previewImage.src = result.url;
                                previewImage.style.display = 'block';
                            }
                            if (preview) preview.classList.add('has-photo');
                            if (typeof publishDraftState === 'function') publishDraftState();
                            if (uploadText) uploadText.textContent = 'Change';
                        } catch (error) {
                            console.error('[Draft Control] Player photo upload failed:', error);
                            if (uploadText) uploadText.textContent = 'Retry';
                        } finally {
                            if (uploadLabel) uploadLabel.classList.remove('is-uploading');
                            input.value = '';
                            if (uploadText && uploadText.textContent === 'Uploading') uploadText.textContent = oldText;
                        }
                    });
                });
            }
            initializePlayerPhotoUploads();
`;

const displayCss = `
        /* PLAYER PORTRAIT & ROLE OVERLAY */
        .draft-container .bottom .pick-container .pick-hero { position:relative; overflow:hidden; box-sizing:border-box; }
        .draft-container .bottom .pick-container .pick-hero .player-photo {
            position:absolute; z-index:4; left:7px; bottom:36px; width:34px; height:34px;
            display:none; object-fit:cover; object-position:center;
            border:2px solid rgba(255,255,255,.95); border-radius:50%;
            background:#202125; box-shadow:0 2px 8px rgba(0,0,0,.4); pointer-events:none;
        }
        .draft-container .bottom .pick-container .pick-hero .player-role {
            position:absolute; z-index:4; right:6px; bottom:40px; display:none;
            max-width:calc(100% - 48px); overflow:hidden; padding:4px 6px;
            border:1px solid rgba(255,255,255,.55); border-radius:5px;
            background:rgba(10,16,24,.82); color:#fff;
            font-family:'Eixample Extrabold'; font-size:9px; line-height:1;
            letter-spacing:.35px; text-overflow:ellipsis; white-space:nowrap;
            text-transform:uppercase; pointer-events:none;
        }
        /* END PLAYER PORTRAIT & ROLE OVERLAY */
`;

const newUpdatePickSide = `
        function updatePickSide(side, picks, players) {
            const nodes = Array.from(document.querySelectorAll(
                '.draft-container .bottom .' + side + ' .pick-container .pick-hero'
            ));
            // Left visual order is 1→5; right visual order is 5→1.
            const orderedPicks = side === 'right' ? [...picks].reverse() : picks;
            const orderedPlayers = side === 'right' ? [...players].reverse() : players;
            nodes.forEach((node, index) => {
                const image = node.querySelector('.pick-image');
                const name = node.querySelector('.players-name');
                const photo = node.querySelector('.player-photo');
                const role = node.querySelector('.player-role');
                const hero = orderedPicks[index] || null;
                const rawPlayer = orderedPlayers[index] || {};
                const player = typeof rawPlayer === 'string'
                    ? { name: rawPlayer, role: '', photo: '' }
                    : rawPlayer;

                setHeroImage(image, hero);
                if (name) name.textContent = player.name || '';
                if (role) {
                    const roleText = String(player.role || '').trim();
                    role.textContent = roleText;
                    role.style.display = roleText ? 'block' : 'none';
                }
                if (photo) {
                    const photoUrl = String(player.photo || '').trim();
                    if (photoUrl) {
                        // Do not reload the same avatar on each timer update (prevents blinking).
                        if (photo.getAttribute('src') !== photoUrl) photo.setAttribute('src', photoUrl);
                        photo.style.display = 'block';
                    } else {
                        photo.removeAttribute('src');
                        photo.style.display = 'none';
                    }
                }
            });
        }`;

function patchControl(html) {
    if (!html.includes('PLAYER ROLE & PHOTO CONTROLS')) {
        const cssMarker = '        /* Hero Ban & Pick Section */';
        if (!html.includes(cssMarker)) throw new Error('Control CSS marker not found.');
        html = replaceOne(html, cssMarker, controlCss + '\n' + cssMarker, 'control CSS marker');

        const blockPattern = /<div class="inside-bottom">[\s\S]*?<span class="helper-text">Left to Right \(1-5\)<\/span>\s*<\/div>/g;
        const found = [...html.matchAll(blockPattern)];
        if (found.length !== 2) throw new Error('Expected two team Players Name sections; found ' + found.length + '.');
        html = html.replace(blockPattern, block => {
            const sideMatch = block.match(/id="player-(left|right)-1"/);
            if (!sideMatch) throw new Error('Could not determine team side for player inputs.');
            const close = block.lastIndexOf('</div>');
            return block.slice(0, close) + extras(sideMatch[1]) + '\n                    ' + block.slice(close);
        });
    }

    if (!html.includes('initializePlayerPhotoUploads();')) {
        const marker = "            bindLogoUpload('upload-logo-right', 'logo-img-right');";
        html = replaceOne(html, marker, marker + '\n' + uploadJs, 'logo upload initializer');
    }

    if (!html.includes("photo: photo ? photo.value : ''")) {
        const oldPlayers = [
            "                    players[side] = Array.from({ length: 5 }, (_, index) => {",
            "                        const input = document.getElementById(`player-${side}-${index + 1}`);",
            "                        return input ? input.value.trim() : '';",
            "                    });"
        ].join('\n');
        const newPlayers = [
            "                    players[side] = Array.from({ length: 5 }, (_, index) => {",
            "                        const playerNo = index + 1;",
            "                        const input = document.getElementById('player-' + side + '-' + playerNo);",
            "                        const role = document.getElementById('player-role-' + side + '-' + playerNo);",
            "                        const photo = document.getElementById('player-photo-url-' + side + '-' + playerNo);",
            "                        return {",
            "                            name: input ? input.value.trim() : '',",
            "                            role: role ? role.value : '',",
            "                            photo: photo ? photo.value : ''",
            "                        };",
            "                    });"
        ].join('\n');
        html = replaceOne(html, oldPlayers, newPlayers, 'players state builder');
    }

    html = html.replace(
        "'#score-left, #score-right, .player-input'",
        "'#score-left, #score-right, .player-input, .player-role-select'"
    );
    html = html.replace(
        "'.player-input, .hero-slot-select, .bo-btn'",
        "'.player-input, .player-role-select, .hero-slot-select, .bo-btn'"
    );

    if (!html.includes('player-role-select') || !html.includes('player-photo-url-left-1') ||
        !html.includes("photo: photo ? photo.value : ''")) {
        throw new Error('Control validation failed.');
    }
    return html;
}

function patchDisplay(html) {
    if (!html.includes('PLAYER PORTRAIT & ROLE OVERLAY')) {
        const styleEnd = html.toLowerCase().lastIndexOf('</style>');
        if (styleEnd < 0) throw new Error('Display </style> not found.');
        html = html.slice(0, styleEnd) + displayCss + '\n' + html.slice(styleEnd);
    }

    if (!html.includes('class="player-photo"')) {
        const pattern = /(<div class="pick-image"><\/div>\s*)(<div class="players-name">[\s\S]*?<\/div>)/g;
        const matches = [...html.matchAll(pattern)];
        if (matches.length !== 10) throw new Error('Expected 10 pick-card image/name blocks; found ' + matches.length + '.');
        html = html.replace(pattern, '$1<img class="player-photo" alt="" aria-hidden="true">\n                        <span class="player-role"></span>\n                        $2');
    }

    if (!html.includes('const rawPlayer = orderedPlayers[index]')) {
        const startMarker = '        function updatePickSide(side, picks, players) {';
        const nextMarker = '\n\n        function updateActivePickCards';
        const start = html.indexOf(startMarker);
        const end = html.indexOf(nextMarker, start);
        if (start < 0 || end < 0) throw new Error('Could not isolate display updatePickSide() function.');
        html = html.slice(0, start) + newUpdatePickSide + html.slice(end);
    }

    if (!html.includes('class="player-role"') || !html.includes('const rawPlayer = orderedPlayers[index]')) {
        throw new Error('Display validation failed.');
    }
    return html;
}

function main() {
    let control = patchControl(read(controlPath));
    let display = patchDisplay(read(displayPath));

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(controlPath, controlPath + '.backup-' + stamp);
    fs.copyFileSync(displayPath, displayPath + '.backup-' + stamp);
    fs.writeFileSync(controlPath, control, 'utf8');
    fs.writeFileSync(displayPath, display, 'utf8');

    console.log('SUCCESS: Player roles and photo uploads installed.');
    console.log('Updated control/draft.html and display/draft.html.');
    console.log('Reused the existing /upload endpoint; server.js was not changed.');
    console.log('Timestamped backups were created for both HTML files.');
}

try { main(); }
catch (error) {
    console.error('PATCH FAILED:', error.message);
    process.exitCode = 1;
}
