import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  }  connect(token) {
    // If socket is already connected and working, return it
    if (this.socket && this.isConnected && this.socket.connected) {
      console.log("Socket already connected, reusing existing connection");
      return this.socket;
    }

    // Clean up any existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    console.log(`Attempting to connect to server at: ${this.serverUrl}`);
    
    // Connect to the server with authentication
    this.socket = io(this.serverUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
    });

    // Only set up internal connection status tracking
    this.socket.on("connect", () => {
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });

    this.socket.on("connect_error", () => {
      this.isConnected = false;
    });

    return this.socket;
  }
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("Socket disconnected and cleaned up");
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
    if (!this.socket) {
      console.error("Socket not initialized");
      return false;
    }
    
    if (!this.isConnected || !this.socket.connected) {
      console.error("Socket not connected. Attempting to reconnect...");
      this.socket.connect();
      return false;
    }

    try {
      this.socket.emit("send_message", {
        roomId,
        content,
      });
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
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
