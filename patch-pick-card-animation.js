// Run from the DraftMPLV2 project root:
//   node patch-pick-card-animation.js
// Adds pick-turn card width animation to display/draft.html only.
// Idempotent and creates a timestamped backup before writing.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const displayPath = path.join(root, 'display', 'draft.html');

const cssBlock = `
        /* PICK-CARD ACTIVE TURN ANIMATION */
        .draft-container .bottom .pick-container {
            width: 740px;
            max-width: 740px;
            min-width: 0;
            box-sizing: border-box;
            display: flex;
            gap: 2px;
            overflow: hidden;
        }

        .draft-container .bottom .pick-container .pick-hero {
            width: 148px;
            min-width: 0;
            flex: 1 1 148px;
            box-sizing: border-box;
            overflow: hidden;
            transition: flex-basis 280ms cubic-bezier(.22, .75, .25, 1),
                        width 280ms cubic-bezier(.22, .75, .25, 1);
            will-change: flex-basis;
        }

        .draft-container .bottom .pick-container .pick-hero.is-active-pick {
            width: 170px;
            flex: 0 0 170px;
        }

        .draft-container .bottom .pick-container .pick-hero .pick-image {
            width: 100%;
            min-width: 0;
        }

        .draft-container .bottom .pick-container .pick-hero .players-name {
            min-width: 0;
            box-sizing: border-box;
            padding: 0 4px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        /* END PICK-CARD ACTIVE TURN ANIMATION */
`;

const activePickFunction = `
        function updateActivePickCards(state) {
            const allCards = document.querySelectorAll(
                '.draft-container .bottom .pick-container .pick-hero'
            );

            // Always clear the previous turn first. Ban and Last Change stay at normal width.
            allCards.forEach(card => card.classList.remove('is-active-pick'));

            if (!state || state.phase !== 'pick' || state.complete) return;

            const side = state.side === 'right' ? 'right'
                : state.side === 'left' ? 'left'
                : null;
            if (!side) return;

            // Labels are supplied by the existing DRAFT_SEQUENCE, e.g.
            // "BLUE TEAM · PICK 1" or "RED TEAM · PICK 1 + 2".
            const match = String(state.label || '').match(/\\bPICK\\s+(\\d+)(?:\\s*\\+\\s*(\\d+))?/i);
            if (!match) return;

            const activeSlots = new Set(
                [Number(match[1]), match[2] ? Number(match[2]) : null]
                    .filter(number => Number.isInteger(number) && number >= 1 && number <= 5)
            );

            const sideCards = Array.from(document.querySelectorAll(
                '.draft-container .bottom .' + side + ' .pick-container .pick-hero'
            ));

            sideCards.forEach((card, visualIndex) => {
                // Blue/left is rendered in logical order 1→5.
                // Red/right is rendered in reverse visual order 5→1.
                const logicalSlot = side === 'right'
                    ? sideCards.length - visualIndex
                    : visualIndex + 1;

                if (activeSlots.has(logicalSlot)) {
                    card.classList.add('is-active-pick');
                }
            });
        }
`;

function readRequired(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${path.relative(root, file)}`);
    }
    return fs.readFileSync(file, 'utf8');
}

function main() {
    let html = readRequired(displayPath);

    const hasCss = html.includes('/* PICK-CARD ACTIVE TURN ANIMATION */');
    const hasFunction = html.includes('function updateActivePickCards(state)');
    const hasCall = html.includes('updateActivePickCards(state);');

    if (hasCss && hasFunction && hasCall) {
        console.log('Pick-card animation is already installed; no changes made.');
        return;
    }

    // Prepare all edits in memory before writing anything.
    if (!hasCss) {
        const styleEnd = html.toLowerCase().lastIndexOf('</style>');
        if (styleEnd < 0) throw new Error('Could not find </style> in display/draft.html.');
        html = html.slice(0, styleEnd) + cssBlock + '\n' + html.slice(styleEnd);
    }

    if (!hasFunction) {
        const applyMarker = 'function applyDraftState(state) {';
        const applyIndex = html.indexOf(applyMarker);
        if (applyIndex < 0) {
            throw new Error('Could not find function applyDraftState(state). No files were changed.');
        }
        html = html.slice(0, applyIndex) + activePickFunction + '\n' + html.slice(applyIndex);
    }

    if (!hasCall) {
        const arrowCall = "renderArrowSide(state.side || 'left');";
        if (!html.includes(arrowCall)) {
            throw new Error('Could not find renderArrowSide() inside applyDraftState(). No files were changed.');
        }
        html = html.replace(
            arrowCall,
            arrowCall + '\n            updateActivePickCards(state);'
        );
    }

    if (!html.includes('/* PICK-CARD ACTIVE TURN ANIMATION */') ||
        !html.includes('function updateActivePickCards(state)') ||
        !html.includes('updateActivePickCards(state);')) {
        throw new Error('Validation failed. No files were changed.');
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(displayPath, `${displayPath}.backup-${stamp}`);
    fs.writeFileSync(displayPath, html, 'utf8');

    console.log('Pick-card animation installed successfully.');
    console.log('Backup created for display/draft.html.');
    console.log('Control, server, heroes.js, and sync protocol were not changed.');
    console.log('Reload the OBS Browser Source to test the animation.');
}

try {
    main();
} catch (error) {
    console.error('PATCH FAILED:', error.message);
    process.exitCode = 1;
}
