"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = exports.initializeWebSocket = void 0;
const ws_1 = require("ws");
let wss;
const initializeWebSocket = (server) => {
    try {
        wss = new ws_1.WebSocketServer({ server });
        console.log('WebSocket server initialized.');
        wss.on('connection', (ws, req) => {
            console.log('Client connected to WebSocket from IP:', req.socket.remoteAddress);
            ws.on('message', (message) => {
                console.log('Received message from client:', message.toString());
            });
            ws.on('close', (code, reason) => {
                console.log(`Client disconnected from WebSocket: Code ${code}, Reason: ${reason ? reason.toString() : 'N/A'}`);
            });
            ws.on('error', (error) => {
                console.error('WebSocket client error:', error);
            });
            ws.send(JSON.stringify({ status: 'connected', message: 'Welcome!' }));
        });
        wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
    catch (error) {
        console.error('Failed to initialize WebSocket server:', error);
    }
};
exports.initializeWebSocket = initializeWebSocket;
const broadcast = (data) => {
    if (!wss) {
        console.log('[Broadcast] WebSocket server not initialized. Skipping broadcast.');
        return;
    }
    const clientCount = wss.clients.size;
    console.log(`[Broadcast] Attempting to broadcast to ${clientCount} client(s).`);
    if (clientCount === 0) {
        return;
    }
    wss.clients.forEach((client) => {
        console.log(`[Broadcast] Checking client. ReadyState: ${client.readyState}`);
        if (client.readyState === ws_1.WebSocket.OPEN) {
            try {
                const jsonData = JSON.stringify(data);
                client.send(jsonData);
                console.log(`[Broadcast] Sent data to client: ${jsonData}`);
            }
            catch (error) {
                console.error('[Broadcast] Error sending data to client:', error);
            }
        }
        else {
            console.log('[Broadcast] Client not open. Skipping.');
        }
    });
};
exports.broadcast = broadcast;
