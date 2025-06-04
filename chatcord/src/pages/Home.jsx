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
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #2c2f36 0%, #36393f 50%, #40444b 100%)",
        display: "flex",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "white",
      }}
    >
      {/* Connection Status */}

      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          backgroundColor: "#1e2124",
          borderRight: "1px solid #40444b",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.3)",
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
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
