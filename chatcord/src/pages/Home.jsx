import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router";
import Swal from "sweetalert2";

import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import socketService from "../lib/socket";

export default function Home() {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef(messages);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Check if user is authenticated
  const token = localStorage.getItem("access_token");

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token) {
      const socket = socketService.connect(token); // Connection status
      socket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);
      });

      socket.on("disconnect", (reason) => {
        console.log("Disconnected from server. Reason:", reason);
        setIsConnected(false);

        // Attempt to reconnect after a short delay
        if (reason === "io server disconnect") {
          // Server initiated disconnect, don't reconnect automatically
          Swal.fire({
            icon: "warning",
            title: "Server Disconnected",
            text: "The server disconnected you. Please refresh the page.",
            showConfirmButton: true,
            confirmButtonText: "Refresh Page",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        }
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Reconnected to server after", attemptNumber, "attempts");
        setIsConnected(true);
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log("Attempting to reconnect... attempt", attemptNumber);
      });

      socket.on("reconnect_failed", () => {
        console.log("Failed to reconnect to server");
        setIsConnected(false);
        Swal.fire({
          icon: "error",
          title: "Connection Failed",
          text: "Unable to reconnect to the server. Please refresh the page.",
          showConfirmButton: true,
          confirmButtonText: "Refresh Page",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      });

      socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        setIsConnected(false);

        // More user-friendly error messages
        let errorMessage = "Failed to connect to chat server";
        if (error.message?.includes("ECONNREFUSED")) {
          errorMessage = "Server is not running or unreachable";
        } else if (error.message?.includes("timeout")) {
          errorMessage = "Connection timeout - server may be slow";
        } else if (error.type === "TransportError") {
          errorMessage = "Network connection issue";
        }

        Swal.fire({
          icon: "error",
          title: "Connection Error",
          text: errorMessage,
          footer: '<a href="/status">Check server status</a>',
          showConfirmButton: true,
          confirmButtonText: "Retry",
          showCancelButton: true,
          cancelButtonText: "Check Status",
        }).then((result) => {
          if (
            result.isDismissed &&
            result.dismiss === Swal.DismissReason.cancel
          ) {
            window.location.href = "/status";
          }
        });
      }); // Listen for new messages
      socketService.onMessage((data) => {
        console.log("New message received:", data);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: data.id || Date.now().toString(),
            message: data.message,
            username: data.user?.username || data.username,
            time: new Date(data.createdAt || Date.now()).toLocaleTimeString(),
            avatar: data.user?.username
              ? data.user.username.charAt(0).toUpperCase()
              : "👤",
            isAI: data.isAI || false,
          },
        ]);
      }); // Listen for room messages when joining a room
      socketService.onRoomMessages((data) => {
        console.log("Room messages received:", data);
        const formattedMessages = data.map((msg) => ({
          id: msg.id || msg._id,
          message: msg.message,
          username: msg.user?.username || msg.username,
          time: new Date(msg.createdAt).toLocaleTimeString(),
          avatar: msg.user?.username
            ? msg.user.username.charAt(0).toUpperCase()
            : "👤",
          isAI: msg.isAI || false,
        }));
        setMessages(formattedMessages);
      });

      // Listen for users updates
      socketService.onUsersUpdate((users) => {
        console.log("Users update received:", users);
        const formattedUsers = users.map((user) => ({
          ...user,
          avatar: user.username ? user.username.charAt(0).toUpperCase() : "👤",
          status: user.status || "online",
        }));
        setOnlineUsers(formattedUsers);
      }); // Listen for user joined
      socketService.onUserJoined((data) => {
        console.log("User joined:", data);
        const username =
          data.username || data.user?.username || data.user?.name || "A user";
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: `${username} joined the room`,
          showConfirmButton: false,
          timer: 3000,
        });
      });

      // Listen for user left
      socketService.onUserLeft((data) => {
        console.log("User left:", data);
        const username =
          data.username || data.user?.username || data.user?.name || "A user";
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: `${username} left the room`,
          showConfirmButton: false,
          timer: 3000,
        });
      });

      // Cleanup on unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [token]);

  // Early return after hooks
  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleRoomSelect = (room) => {
    // Leave previous room if any
    if (selectedRoom) {
      socketService.leaveRoom(selectedRoom.id);
    }

    setSelectedRoom(room);
    setMessages([]); // Clear messages when switching rooms

    // Join new room
    if (room && socketService.isSocketConnected()) {
      socketService.joinRoom(room.id);
      console.log(`Joining room: ${room.name} (${room.id})`);
    }
  };
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) {
      return;
    }

    // Check connection status more thoroughly
    const isSocketReady = socketService.isSocketConnected();
    const socketInstance = socketService.getSocket();

    if (!isSocketReady || !socketInstance || !socketInstance.connected) {
      console.error("Socket not connected. Socket status:", {
        isSocketReady,
        hasSocketInstance: !!socketInstance,
        socketConnected: socketInstance?.connected,
        reactIsConnected: isConnected,
      });

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Not connected to chat server. Please refresh the page.",
        showConfirmButton: true,
        confirmButtonText: "Refresh Page",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
      return;
    }

    try {
      // Send message via Socket.IO
      socketService.sendMessage(selectedRoom.id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Send Message",
        text: "There was an error sending your message. Please try again.",
      });
    }
  };

  const leaveRoom = () => {
    if (selectedRoom && socketService.isSocketConnected()) {
      socketService.leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(null);
    setMessages([]);
  };

  const logout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#667eea",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
      }
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#36393f",
        display: "flex",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "white",
      }}
    >
      {/* Connection Status and AI Test Toggle */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          display: "flex",
          gap: "8px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: isConnected ? "#22c55e" : "#ef4444",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white",
              animation: isConnected ? "none" : "pulse 2s infinite",
            }}
          />{" "}
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div
        style={{
          width: "240px",
          backgroundColor: "#2f3136",
          borderRight: "1px solid #202225",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
          onlineUsers={onlineUsers}
          setOnlineUsers={setOnlineUsers}
          onLogout={logout}
        />
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatArea
          currentRoom={selectedRoom}
          messages={messages}
          onlineUsers={onlineUsers}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          leaveRoom={leaveRoom}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
