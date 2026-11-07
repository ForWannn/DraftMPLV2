// Shared browser-side WebSocket client for MLBB overlays.
// Include this script before an overlay's inline script.
(function attachMLBBOverlaySync(global) {
    'use strict';

    if (global.MLBBOverlaySync) return;

    const listeners = new Map();
    const subscribedChannels = new Set();
    const pendingPublishes = new Map();
    const lastRevisions = new Map();
    let socket = null;
    let reconnectTimer = null;
    let manuallyClosed = false;

    function socketUrl() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${location.host}`;
    }

    function notifyStatus(status, error) {
        global.dispatchEvent(new CustomEvent('mlbb-sync-status', {
            detail: { status, error: error || null }
        }));
    }

    function sendRaw(message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    function scheduleReconnect() {
        if (manuallyClosed || reconnectTimer !== null) return;
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, 1500);
    }

    function connect() {
        if (location.protocol === 'file:' || !location.host) {
            notifyStatus('error', 'Open this page through the Node.js server, not file://.');
            return;
        }

        if (socket && (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        )) return;

        try {
            socket = new WebSocket(socketUrl());
        } catch (error) {
            notifyStatus('error', error.message);
            scheduleReconnect();
            return;
        }

        socket.addEventListener('open', () => {
            lastRevisions.clear();
            notifyStatus('connected');
            subscribedChannels.forEach(channel => {
                sendRaw({ type: 'overlay:subscribe', channel });
            });

            // A subscribed channel is server-authoritative after reconnect.
            // Do not replay an offline full snapshot over a newer shared state.
            for (const [channel, payload] of pendingPublishes.entries()) {
                if (!subscribedChannels.has(channel)) {
                    sendRaw({ type: 'overlay:publish', channel, payload });
                }
                pendingPublishes.delete(channel);
            }
        });

        socket.addEventListener('message', event => {
            let message;
            try {
                message = JSON.parse(event.data);
            } catch (_) {
                return;
            }

            if (message.type !== 'overlay:state' || !message.channel) return;
            const incomingRevision = Number(message.revision) || 0;
            const knownRevision = Number(lastRevisions.get(message.channel)) || 0;
            if (incomingRevision < knownRevision) return;
            lastRevisions.set(message.channel, incomingRevision);

            const channelListeners = listeners.get(message.channel);
            if (!channelListeners) return;

            channelListeners.forEach(callback => {
                try {
                    callback(message.payload, {
                        channel: message.channel,
                        revision: message.revision,
                        now: message.now
                    });
                } catch (error) {
                    console.error(`[MLBB Sync] Listener error (${message.channel}):`, error);
                }
            });
        });

        socket.addEventListener('close', () => {
            notifyStatus('disconnected');
            scheduleReconnect();
        });

        socket.addEventListener('error', () => {
            notifyStatus('error', 'WebSocket connection failed.');
            try { socket.close(); } catch (_) { }
        });
    }

    function publish(channel, payload) {
        if (typeof channel !== 'string' || !/^[a-z0-9_-]{1,64}$/i.test(channel)) {
            throw new Error('Invalid MLBB overlay channel.');
        }

        if (!sendRaw({ type: 'overlay:publish', channel, payload })) {
            // Keep only the newest offline update. It is discarded on reconnect
            // for subscribed channels, where the server snapshot takes precedence.
            pendingPublishes.set(channel, payload);
            connect();
            return false;
        }
        return true;
    }

    function seed(channel, payload) {
        if (typeof channel !== 'string' || !/^[a-z0-9_-]{1,64}$/i.test(channel)) {
            throw new Error('Invalid MLBB overlay channel.');
        }
        if (!sendRaw({ type: 'overlay:seed', channel, payload })) {
            connect();
            return false;
        }
        return true;
    }

    function subscribe(channel, callback) {
        if (typeof channel !== 'string' || !/^[a-z0-9_-]{1,64}$/i.test(channel)) {
            throw new Error('Invalid MLBB overlay channel.');
        }
        if (typeof callback !== 'function') {
            throw new TypeError('MLBBOverlaySync.subscribe requires a callback.');
        }

        if (!listeners.has(channel)) listeners.set(channel, new Set());
        listeners.get(channel).add(callback);

        const firstSubscription = !subscribedChannels.has(channel);
        subscribedChannels.add(channel);
        connect();

        if (firstSubscription && socket && socket.readyState === WebSocket.OPEN) {
            sendRaw({ type: 'overlay:subscribe', channel });
        }

        return function unsubscribe() {
            const channelListeners = listeners.get(channel);
            if (!channelListeners) return;
            channelListeners.delete(callback);

            if (channelListeners.size === 0) {
                listeners.delete(channel);
                subscribedChannels.delete(channel);
                sendRaw({ type: 'overlay:unsubscribe', channel });
            }
        };
    }

    global.MLBBOverlaySync = {
        connect,
        publish,
        seed,
        subscribe,
        getStatus: () => socket && socket.readyState === WebSocket.OPEN
            ? 'connected'
            : socket && socket.readyState === WebSocket.CONNECTING
                ? 'connecting'
                : 'disconnected'
    };

    connect();
})(window);
