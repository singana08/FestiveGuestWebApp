import * as signalR from "@microsoft/signalr";

class ChatService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.messageHandlers = new Set();
  }

  async connect() {
    if (this.isConnected) return;

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

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      this.isConnected = false;
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
    if (!this.isConnected) await this.connect();
    try {
      await this.connection.invoke("SendMessage", otherUserId, message);
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
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
