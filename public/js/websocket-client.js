/**
 * WebSocket Client for AI Tech Hub
 * Handles communication with the WebSocket server.
 */
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.listeners = {
      message: [],
      connect: [],
      disconnect: [],
      error: [],
    };
  }

  /**
   * Establishes a connection to the WebSocket server.
   */
  connect() {
    if (this.socket && this.connected) {
      console.log("WebSocket is already connected");
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/`;

      console.log(`Connecting to WebSocket server: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        this.connected = true;
        this.reconnectAttempts = 0;
        this.listeners.connect.forEach((callback) => callback());
      };

      this.socket.onmessage = (event) => this.handleMessage(event);

      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
        this.connected = false;
        this.listeners.disconnect.forEach((callback) => callback());
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.reconnect(), this.reconnectInterval);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.listeners.error.forEach((callback) => callback(error));
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }

  /**
   * Closes the WebSocket connection.
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Attempts to reconnect to the WebSocket server.
   */
  reconnect() {
    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );
    this.connect();
  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event - The WebSocket message event.
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message:", data);
      this.listeners.message.forEach((callback) => callback(data));
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  /**
   * Sends a message to the WebSocket server.
   * @param {string} type - The type of message.
   * @param {object} [data={}] - The message payload.
   * @returns {boolean} - True if the message was sent successfully, false otherwise.
   */
  send(type, data = {}) {
    if (!this.connected) {
      console.error("WebSocket is not connected, cannot send message");
      return false;
    }

    try {
      const message = { type, ...data, timestamp: new Date().toISOString() };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  }

  // Specific message types
  sendChatMessage(sender, message) {
    return this.send("chat", { sender, message });
  }
  sendNotification(title, message) {
    return this.send("notification", { title, message });
  }
  ping() {
    return this.send("ping");
  }

  // Event listener management
  on(event, callback) {
    if (this.listeners[event]) this.listeners[event].push(callback);
    return this;
  }
  off(event, callback) {
    if (this.listeners[event])
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    return this;
  }
}

const wsClient = new WebSocketClient();

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    wsClient.connect();
    setInterval(() => {
      if (wsClient.connected) wsClient.ping();
    }, 30000);
  }, 1000);
});
