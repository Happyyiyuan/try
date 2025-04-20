/**
 * AI科技库 WebSocket客户端
 * 用于与WebSocket服务器通信
 */

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3秒
        this.listeners = {
            message: [],
            connect: [],
            disconnect: [],
            error: []
        };
        
        // 绑定方法到实例
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.send = this.send.bind(this);
        this.reconnect = this.reconnect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }
    
    /**
     * 连接到WebSocket服务器
     */
    connect() {
        if (this.socket && this.connected) {
            console.log('WebSocket已经连接');
            return;
        }
        
        try {
            // 确定WebSocket URL
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws/`;
            
            console.log(`正在连接到WebSocket服务器: ${wsUrl}`);
            this.socket = new WebSocket(wsUrl);
            
            // 设置事件处理程序
            this.socket.onopen = () => {
                console.log('WebSocket连接已建立');
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // 触发连接事件
                this.listeners.connect.forEach(callback => callback());
            };
            
            this.socket.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket连接已关闭');
                this.connected = false;
                
                // 触发断开连接事件
                this.listeners.disconnect.forEach(callback => callback());
                
                // 尝试重新连接
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(this.reconnect, this.reconnectInterval);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket错误:', error);
                
                // 触发错误事件
                this.listeners.error.forEach(callback => callback(error));
            };
        } catch (error) {
            console.error('创建WebSocket连接时出错:', error);
        }
    }
    
    /**
     * 断开WebSocket连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    }
    
    /**
     * 重新连接到WebSocket服务器
     */
    reconnect() {
        this.reconnectAttempts++;
        console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
    }
    
    /**
     * 处理收到的WebSocket消息
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('收到WebSocket消息:', data);
            
            // 触发消息事件
            this.listeners.message.forEach(callback => callback(data));
        } catch (error) {
            console.error('解析WebSocket消息时出错:', error);
        }
    }
    
    /**
     * 发送消息到WebSocket服务器
     */
    send(type, data = {}) {
        if (!this.connected) {
            console.error('WebSocket未连接，无法发送消息');
            return false;
        }
        
        try {
            const message = {
                type,
                ...data,
                timestamp: new Date().toISOString()
            };
            
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('发送WebSocket消息时出错:', error);
            return false;
        }
    }
    
    /**
     * 发送聊天消息
     */
    sendChatMessage(sender, message) {
        return this.send('chat', { sender, message });
    }
    
    /**
     * 发送通知消息
     */
    sendNotification(title, message) {
        return this.send('notification', { title, message });
    }
    
    /**
     * 发送ping消息以保持连接活跃
     */
    ping() {
        return this.send('ping');
    }
    
    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
        return this;
    }
    
    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
        return this;
    }
}

// 创建全局WebSocket客户端实例
const wsClient = new WebSocketClient();

// 在页面加载完成后自动连接
document.addEventListener('DOMContentLoaded', () => {
    // 延迟连接以确保页面完全加载
    setTimeout(() => {
        wsClient.connect();
        
        // 每30秒发送一次ping以保持连接
        setInterval(() => {
            if (wsClient.connected) {
                wsClient.ping();
            }
        }, 30000);
    }, 1000);
});
