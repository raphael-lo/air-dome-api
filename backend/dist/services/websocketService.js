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
            // Send a test message immediately to see if it goes through
            try {
                ws.send(JSON.stringify({ status: 'connected', message: 'Welcome!' }));
                console.log('Sent welcome message to client.');
            }
            catch (sendError) {
                console.error('Error sending welcome message:', sendError);
            }
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
        return;
    }
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
exports.broadcast = broadcast;
