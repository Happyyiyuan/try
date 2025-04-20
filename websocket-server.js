'use strict';

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WS_PORT = process.env.WS_PORT || 8081;
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'websocket.log');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const httpServer = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('WebSocket server is running');
});

const wss = new WebSocket.Server({ server: httpServer });

const clients = new Map();

const generateClientId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 12);

const formatLogMessage = (message) => `[${new Date().toISOString()}] ${message}`;

const log = (message) => {
    const logMessage = formatLogMessage(message);
    console.log(logMessage);
    fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

const handleMessage = (ws, message) => {
    const { clientId } = clients.get(ws);
    const messageStr = message.toString();
    log(`Received from client ${clientId}: ${messageStr}`);

    try {
        const data = JSON.parse(messageStr);
        switch (data.type) {
            case 'chat':
                broadcast({
                    type: 'chat',
                    sender: data.sender || 'Anonymous',
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'notification':
                broadcast({
                    type: 'notification',
                    title: data.title,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;
            default:
                log(`Unknown message type: ${data.type}`);
        }
    } catch (error) {
        log(`Invalid JSON format: ${error.message}`);
    }
};

const handleClose = (ws) => {
    const { clientId } = clients.get(ws);
    log(`Client ${clientId} disconnected`);
    clients.delete(ws);
};

const handleError = (ws, error) => {
    const { clientId } = clients.get(ws);
    log(`Client ${clientId} error: ${error.message}`);
};

const sendWelcomeMessage = (ws) => {
    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to AI Library WebSocket server',
        timestamp: new Date().toISOString()
    }));
};

wss.on('connection', (ws, request) => {
    const clientId = generateClientId();
    const ip = request.socket.remoteAddress;
    log(`New client connected [ID: ${clientId}, IP: ${ip}]`);

    clients.set(ws, { clientId, ip, connectedAt: new Date() });

    ws.on('message', (message) => handleMessage(ws, message));
    ws.on('close', () => handleClose(ws));
    ws.on('error', (error) => handleError(ws, error));

    sendWelcomeMessage(ws);
});

const broadcast = (data) => {
    const message = JSON.stringify(data);
    log(`Broadcasting: ${message}`);
    [...wss.clients]
        .filter(client => client.readyState === WebSocket.OPEN)
        .forEach(client => client.send(message));
};

httpServer.listen(WS_PORT, () => log(`Server started on port ${WS_PORT}`));

const shutdown = (signal) => {
    log(`${signal} signal received: closing server...`);
    wss.close(() => {
        log('Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.stack}`);
    shutdown('Uncaught Exception');
        try {
});
