/**
 * AI科技库 WebSocket服务器
 * 用于实时通信功能
 */

'use strict';

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 从.env文件加载配置（如果存在）
let WS_PORT = 8081;
try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const wsPortMatch = envFile.match(/WS_PORT=(\d+)/);
    if (wsPortMatch && wsPortMatch[1]) {
        WS_PORT = parseInt(wsPortMatch[1], 10);
    }
} catch (error) {
    console.log('未找到.env文件或无法读取WS_PORT，使用默认端口8081');
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket服务器正在运行');
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 连接的客户端集合
const clients = new Map();

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // 将日志写入文件
    try {
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(path.join(logDir, 'websocket.log'), logMessage + '\n');
    } catch (error) {
        console.error('写入日志文件失败:', error);
    }
}

// 当有客户端连接时
wss.on('connection', (ws, req) => {
    const clientId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const ip = req.socket.remoteAddress;
    
    log(`新客户端连接 [ID: ${clientId}, IP: ${ip}]`);
    
    // 存储客户端信息
    clients.set(ws, {
        id: clientId,
        ip: ip,
        connectedAt: new Date()
    });
    
    // 处理接收到的消息
    ws.on('message', (message) => {
        try {
            const messageStr = message.toString();
            log(`收到来自客户端 ${clientId} 的消息: ${messageStr}`);
            
            let data;
            try {
                data = JSON.parse(messageStr);
            } catch (e) {
                log(`消息不是有效的JSON格式: ${e.message}`);
                return;
            }
            
            // 根据消息类型处理
            switch (data.type) {
                case 'chat':
                    // 广播聊天消息给所有客户端
                    broadcastMessage({
                        type: 'chat',
                        sender: data.sender || '匿名用户',
                        message: data.message,
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'notification':
                    // 处理通知消息
                    broadcastMessage({
                        type: 'notification',
                        title: data.title,
                        message: data.message,
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'ping':
                    // 响应ping消息
                    ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                default:
                    log(`未知的消息类型: ${data.type}`);
            }
        } catch (error) {
            log(`处理消息时出错: ${error.message}`);
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        log(`客户端 ${clientId} 断开连接`);
        clients.delete(ws);
    });
    
    // 处理错误
    ws.on('error', (error) => {
        log(`客户端 ${clientId} 连接错误: ${error.message}`);
    });
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'system',
        message: '已成功连接到AI科技库WebSocket服务器',
        timestamp: new Date().toISOString()
    }));
});

// 广播消息给所有连接的客户端
function broadcastMessage(data) {
    const message = JSON.stringify(data);
    log(`广播消息: ${message}`);
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 启动服务器
server.listen(WS_PORT, () => {
    log(`WebSocket服务器已启动，监听端口: ${WS_PORT}`);
});

// 处理进程终止信号
process.on('SIGINT', () => {
    log('接收到SIGINT信号，关闭服务器...');
    wss.close(() => {
        log('WebSocket服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    log('接收到SIGTERM信号，关闭服务器...');
    wss.close(() => {
        log('WebSocket服务器已关闭');
        process.exit(0);
    });
});
