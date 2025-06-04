import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import Swal from "sweetalert2";

import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useAuth, useChat } from "../contexts";

export default function Home() {
  const navigate = useNavigate();
  // const location = useLocation(); // Commented out unused variable
  const { isAuthenticated, user, logout } = useAuth();
  const {
    selectedRoom,
    messages,
    newMessage,
    setNewMessage,
    onlineUsers,
    isConnected,
    initializeSocket,
    handleRoomSelect,
    sendMessage,
    disconnectSocket,
  } = useChat();
  // Initialize Socket.IO connection
  useEffect(() => {
    if (user?.token) {
      initializeSocket(user.token);

      // Cleanup on unmount
      return () => {
        disconnectSocket();
      };
    }
  }, [user?.token, initializeSocket, disconnectSocket]);

  // Early return after hooks
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        disconnectSocket();
        logout();
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
      {/* Connection Status */}
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
            }}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Sidebar */}
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
          onLogout={handleLogout}
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
          isConnected={isConnected}
        />
      </div>

      {/* Status Feature Demo - Shown only for demo users */}
    </div>
  );
}
