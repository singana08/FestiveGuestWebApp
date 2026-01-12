import * as signalR from "@microsoft/signalr";

class ChatService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        console.log('Error stopping existing connection:', e);
      }
    }

    const hubUrl = "https://festive-guest-api.azurewebsites.net/chathub";
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
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

    this.connection.onreconnected(() => {
      this.isConnected = true;
    });

    this.connection.onreconnecting(() => {
      this.isConnected = false;
    });

    this.connection.onclose(() => {
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
    if (!this.isConnected) await this.connect();
    try {
      await this.connection.invoke("SendMessage", otherUserId, message);
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  onReceiveMessage(callback) {
    if (this.connection) {
      this.connection.on("ReceiveMessage", callback);
    }
  }

  offReceiveMessage(callback) {
    if (this.connection) {
      this.connection.off("ReceiveMessage", callback);
    }
  }
}

export default new ChatService();
