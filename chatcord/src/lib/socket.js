import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    console.log(`Attempting to connect to server at: ${this.serverUrl}`);

    // Connect to the server with authentication
    this.socket = io(this.serverUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 5000,
      forceNew: true,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Room management
  joinRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("join_room", { roomId });
    }
  }

  leaveRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("leave_room", { roomId });
    }
  }

  // Message handling
  sendMessage(roomId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit("send_message", {
        roomId,
        content,
      });
    }
  }

  // Event listeners
  onMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on("user_joined", callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on("user_left", callback);
    }
  }

  onUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on("users_update", callback);
    }
  }

  onRoomMessages(callback) {
    if (this.socket) {
      this.socket.on("room_messages", callback);
    }
  }

  onRoomJoined(callback) {
    if (this.socket) {
      this.socket.on("room_joined", callback);
    }
  }

  onRoomLeft(callback) {
    if (this.socket) {
      this.socket.on("room_left", callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
