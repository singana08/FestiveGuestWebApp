import * as signalR from "@microsoft/signalr";

class ChatService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.messageHandlers = new Set();
  }

  async connect() {
    if (this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // Clean up existing connection if it exists
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        console.log('Error stopping existing connection:', e);
      }
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:7219/chathub", {
        accessTokenFactory: () => {
          const user = localStorage.getItem('user');
          if (user) {
            const userData = JSON.parse(user);
            return userData.token;
          }
          return null;
        }
      })
      .withAutomaticReconnect()
      .build();

    // Handle connection state changes
    this.connection.onreconnected(() => {
      console.log('SignalR Reconnected');
      this.isConnected = true;
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR Reconnecting...');
      this.isConnected = false;
    });

    this.connection.onclose(() => {
      console.log('SignalR Connection Closed');
      this.isConnected = false;
    });

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      this.isConnected = false;
      throw err;
    }
  }

  async joinChat(otherUserId) {
    if (!this.isConnected) await this.connect();
    try {
      await this.connection.invoke("JoinChat", otherUserId);
    } catch (err) {
      console.error("Error joining chat:", err);
    }
  }

  async sendMessage(otherUserId, message) {
    // Ensure we have a valid connection
    if (!this.isConnected || this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.log('Connection not ready, attempting to connect...');
      await this.connect();
    }
    
    try {
      await this.connection.invoke("SendMessage", otherUserId, message);
    } catch (err) {
      console.error("Error sending message:", err);
      // Try to reconnect and send again
      if (err.message?.includes('not in the \'Connected\' State')) {
        console.log('Attempting to reconnect and resend...');
        await this.connect();
        await this.connection.invoke("SendMessage", otherUserId, message);
      } else {
        throw err;
      }
    }
  }

  onReceiveMessage(callback) {
    if (this.connection && !this.messageHandlers.has(callback)) {
      this.messageHandlers.add(callback);
      this.connection.on("ReceiveMessage", callback);
    }
  }

  offReceiveMessage(callback) {
    if (this.connection && this.messageHandlers.has(callback)) {
      this.messageHandlers.delete(callback);
      this.connection.off("ReceiveMessage", callback);
    }
  }

  onError(callback) {
    if (this.connection) {
      this.connection.on("Error", callback);
    }
  }

  onMessageStatusUpdated(callback) {
    if (this.connection) {
      this.connection.on("MessageStatusUpdated", callback);
    }
  }

  async markDelivered(messageId, chatRoom) {
    if (!this.isConnected) await this.connect();
    try {
      await this.connection.invoke("MarkDelivered", messageId, chatRoom);
    } catch (err) {
      console.error("Error marking delivered:", err);
    }
  }

  async markRead(messageId, chatRoom) {
    if (!this.isConnected) await this.connect();
    try {
      await this.connection.invoke("MarkRead", messageId, chatRoom);
    } catch (err) {
      console.error("Error marking read:", err);
    }
  }

  async getMessageHistory(otherUserId) {
    if (!this.isConnected) await this.connect();
    try {
      return await this.connection.invoke("GetMessageHistory", otherUserId);
    } catch (err) {
      console.error("Error getting message history:", err);
      return [];
    }
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      await this.connection.stop();
      this.isConnected = false;
    }
  }
}

export default new ChatService();
