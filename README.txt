MLBB BROADCAST TOOLS — UNIVERSAL WEBSOCKET SYNC STARTER
======================================================

This package was prepared against the public repository structure:
- server.js
- state.json
- control/countdown.html
- display/countdown.html
- control/draft.html
- display/draft.html
- package.json already includes express and ws.

Included files
--------------
server.js
  Updated server. Keeps the existing countdown protocol intact and adds generic
  per-overlay WebSocket channels stored under state.overlays. Draft updates are
  broadcast once to subscribers of the matching channel.

shared/sync-client.js
  Reusable browser-side WebSocket client for draft and future overlays.

patch-draft-sync.js
  Patches control/draft.html and display/draft.html to use the shared client.
  It creates timestamped backups before writing.

Install
-------
1. Back up the whole project or commit current work to Git.
2. Copy this package's server.js over the project's root server.js.
3. Copy shared/sync-client.js into a new root folder named shared.
4. Copy patch-draft-sync.js into the project root.
5. From the project root run:
     node patch-draft-sync.js
6. Restart the Node server:
     npm start

No npm install is required for this change: the existing package.json already
contains express and ws.

Important compatibility notes
-----------------------------
- Countdown remains on its existing WebSocket message protocol, so its current
  control/display should continue working.
- Draft is migrated to the generic channel named "draft".
- Future overlays should include ../shared/sync-client.js before their inline
  scripts, publish state with MLBBOverlaySync.publish('channel-name', state),
  and subscribe with MLBBOverlaySync.subscribe('channel-name', callback).
- Keep channel names unique, e.g. "scoreboard", "caster", "postgame".
- Do not open control/display with file://. Serve them through Node, for example:
    http://localhost:3000/control/draft.html
    http://localhost:3000/display/draft.html
- If OBS is on a different machine, use the host PC's LAN IP in both URLs and
  permit the Node port through the firewall.
- Do not expose this development server to the public internet without adding
  authentication and suitable security controls.

Validation performed on the package files
-----------------------------------------
- server.js and patch-draft-sync.js pass Node syntax checks.
- Browser sync client passes Node syntax parsing.
- The patch script checks required markers before writing, and backs up both
  draft HTML files before applying changes.
- Test in the actual local project before using it on a live broadcast.
