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
        background: `
          radial-gradient(circle at 15% 25%, rgba(138, 43, 226, 0.25) 0%, transparent 45%),
          radial-gradient(circle at 85% 75%, rgba(75, 0, 130, 0.2) 0%, transparent 45%),
          radial-gradient(circle at 45% 15%, rgba(147, 112, 219, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 75% 85%, rgba(106, 90, 205, 0.18) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a1a 0%, #1a0d2e 25%, #2d1b4e 50%, #4a2c7a 75%, #2e1065 100%)
        `,
        display: "flex",
        fontFamily:
          "'Inter', 'Segoe UI', 'San Francisco', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e8e3f3",
        position: "relative",
      }}
    >
      {/* Animated background particles effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(2px 2px at 20% 30%, #b19cd9, transparent),
            radial-gradient(2px 2px at 40% 70%, #9370db, transparent),
            radial-gradient(1px 1px at 90% 40%, #ba55d3, transparent),
            radial-gradient(1px 1px at 60% 10%, #8a2be2, transparent),
            radial-gradient(1px 1px at 15% 85%, #dda0dd, transparent),
            radial-gradient(1px 1px at 85% 15%, #663399, transparent)
          `,
          backgroundSize:
            "250px 250px, 350px 350px, 180px 180px, 280px 280px, 200px 200px, 320px 320px",
          animation: "spaceFloat 25s infinite linear",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          width: "280px",
          backgroundColor: "rgba(10, 10, 26, 0.96)",
          borderRight: "1px solid rgba(147, 112, 219, 0.2)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          backdropFilter: "blur(25px)",
          boxShadow: `
            4px 0 25px rgba(75, 0, 130, 0.3),
            inset -1px 0 0 rgba(147, 112, 219, 0.15)
          `,
          position: "relative",
          zIndex: 2,
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
          position: "relative",
          zIndex: 2,
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        @keyframes spaceFloat {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          25% { transform: translate(40px, -60px) rotate(90deg); }
          50% { transform: translate(-30px, 30px) rotate(180deg); }
          75% { transform: translate(20px, -40px) rotate(270deg); }
          100% { transform: translate(0px, 0px) rotate(360deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 25px rgba(147, 112, 219, 0.4); }
          50% { box-shadow: 0 0 45px rgba(138, 43, 226, 0.6); }
        }
      `}</style>
    </div>
  );
}
