import { useState, useRef, useEffect } from "react";
import http from "../lib/http";
import UserStatusIndicator from "./UserStatusIndicator";

export default function ChatArea({
  currentRoom,
  messages,
  onlineUsers,
  newMessage,
  setNewMessage,
  sendMessage,
  leaveRoom,
  isConnected,
}) {  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const generateAISummary = async () => {
    if (!currentRoom || isLoadingSummary) return;
    setIsLoadingSummary(true);
    setSummaryText("");
    try {
      const response = await http.post(`/rooms/${currentRoom.id}/ai/summary`);
      if (response.data && response.data.data) {
        // Clean up the response text - remove emojis and excessive formatting
        let cleanText =
          response.data.data.content ||
          response.data.data.summary ||
          response.data.message ||
          "No summary available";

        // Remove emojis and special characters
        cleanText = cleanText.replace();

        // Remove markdown formatting
        cleanText = cleanText.replace(/[*#_~`]/g, "");

        // Remove multiple spaces and normalize
        cleanText = cleanText.replace(/\s+/g, " ").trim();

        setSummaryText(cleanText);
        setShowSummary(true);
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);

      if (error.response?.status === 401) {
        setSummaryText(
          "Authentication failed. Please log in again to use AI Summary."
        );
      } else if (error.response?.status === 404) {
        setSummaryText("AI service not available. Please try again later.");
      } else if (error.response?.data?.message) {
        setSummaryText(`Error: ${error.response.data.message}`);
      } else {
        setSummaryText(
          "Sorry, unable to generate summary at this time. Please try again."
        );
      }

      setShowSummary(true);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !currentRoom || isUploadingImage) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await http.post(
        `/rooms/${currentRoom.id}/messages/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Image message will be handled by real-time socket events
      // No need to manually add to messages here

    } catch (error) {
      console.error('Error uploading image:', error);

      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.status === 413) {
        alert('Image file is too large. Please select a smaller image.');
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openImageModal = (imageSrc) => {
    setModalImageSrc(imageSrc);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageSrc("");
  };
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape" && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener("keydown", handleKeyPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [showImageModal]);

  if (!currentRoom) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "24px",
          background: `
          radial-gradient(circle at 50% 50%, rgba(147, 112, 219, 0.08) 0%, transparent 70%),
          linear-gradient(135deg, rgba(10, 10, 26, 0.9) 0%, rgba(26, 13, 46, 0.9) 100%)
        `,
          backdropFilter: "blur(20px)",
          position: "relative",
        }}
      >
        {/* Floating orbs decoration */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "15%",
            width: "120px",
            height: "120px",
            background:
              "linear-gradient(135deg, rgba(147, 112, 219, 0.15), rgba(138, 43, 226, 0.1))",
            borderRadius: "50%",
            filter: "blur(45px)",
            animation: "spaceFloat 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: "10%",
            width: "90px",
            height: "90px",
            background:
              "linear-gradient(135deg, rgba(106, 90, 205, 0.12), rgba(75, 0, 130, 0.1))",
            borderRadius: "50%",
            filter: "blur(35px)",
            animation: "spaceFloat 6s ease-in-out infinite reverse",
          }}
        />

        <div
          style={{
            width: "120px",
            height: "120px",
            background: `
              linear-gradient(135deg, #9370db 0%, #8a2be2 50%, #663399 100%),
              linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)
            `,
            borderRadius: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            boxShadow: `
              0 20px 40px rgba(147, 112, 219, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            animation: "purpleGlow 3s ease-in-out infinite alternate",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              right: "-50%",
              bottom: "-50%",
              background:
                "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
              transform: "rotate(45deg)",
              animation: "shimmer 2s infinite linear",
            }}
          />
          💬
        </div>

        <div style={{ textAlign: "center", zIndex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #b19cd9 0%, #9370db 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "8px",
            }}
          >
            Welcome to ChatCord
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "18px",
              color: "rgba(232, 227, 243, 0.7)",
              fontWeight: "400",
              letterSpacing: "0.5px",
            }}
          >
            Select a room to start your conversation
          </p>
        </div>

        {!isConnected && (
          <div
            style={{
              background: `
                linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%),
                rgba(15, 15, 35, 0.8)
              `,
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "20px 24px",
              color: "#ff6b6b",
              fontSize: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              backdropFilter: "blur(10px)",
              boxShadow: `
                0 8px 32px rgba(239, 68, 68, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.05)
              `,
              maxWidth: "300px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              ⚠️ Connection Lost
            </div>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "13px" }}>
              Unable to connect to chat server. Please check your connection.
            </p>
            <a
              href="/status"
              style={{
                color: "#ff6b6b",
                textDecoration: "none",
                fontSize: "12px",
                padding: "6px 12px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                fontWeight: "500",
              }}
            >
              Check Status
            </a>
          </div>
        )}

        {/* Space decoration elements */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            right: "5%",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(186,85,211,0.12) 0%, rgba(147,112,219,0.08) 40%, transparent 70%)",
            filter: "blur(15px)",
            animation: "orbitFloat 20s infinite linear",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "8%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(138,43,226,0.1) 0%, rgba(106,90,205,0.06) 50%, transparent 75%)",
            filter: "blur(20px)",
            animation: "orbitFloat 30s infinite linear reverse",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Cosmic decoration elements */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#b19cd9",
            boxShadow: "0 0 15px 5px rgba(147, 112, 219, 0.5)",
            opacity: 0.7,
            animation: "twinkle 4s infinite ease-in-out",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "25%",
            right: "20%",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#9370db",
            boxShadow: "0 0 12px 4px rgba(147, 112, 219, 0.6)",
            opacity: 0.6,
            animation: "twinkle 3s infinite ease-in-out 1s",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "30%",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#663399",
            boxShadow: "0 0 18px 6px rgba(138, 43, 226, 0.5)",
            opacity: 0.8,
            animation: "twinkle 5s infinite ease-in-out 0.5s",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: "25%",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "#dda0dd",
            boxShadow: "0 0 10px 3px rgba(221, 160, 221, 0.7)",
            opacity: 0.7,
            animation: "twinkle 6s infinite ease-in-out 2s",
            pointerEvents: "none",
          }}
        />

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          
          @keyframes spaceFloat {
            0% { transform: translate(0px, 0px) rotate(0deg); }
            25% { transform: translate(40px, -60px) rotate(90deg); }
            50% { transform: translate(-30px, 30px) rotate(180deg); }
            75% { transform: translate(20px, -40px) rotate(270deg); }
            100% { transform: translate(0px, 0px) rotate(360deg); }
          }
          
          @keyframes purpleGlow {
            0%, 100% { box-shadow: 0 20px 40px rgba(147, 112, 219, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
            50% { box-shadow: 0 25px 50px rgba(138, 43, 226, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
          }
          
          @keyframes orbitFloat {
            0% { transform: scale(1) rotate(0deg); opacity: 0.5; }
            25% { transform: scale(1.1) rotate(90deg); opacity: 0.7; }
            50% { transform: scale(1) rotate(180deg); opacity: 0.5; }
            75% { transform: scale(0.9) rotate(270deg); opacity: 0.3; }
            100% { transform: scale(1) rotate(360deg); opacity: 0.5; }
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Check if user has joined the room
  if (!currentRoom.isJoined) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}
        >
          🔒
        </div>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
          Join Room to Chat
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
          }}
        >
          You need to join "#{currentRoom.name}" to view messages and
          participate in the conversation.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.4)",
            textAlign: "center",
          }}
        >
          Use the "Join" button in the sidebar to join this room.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: `
          radial-gradient(circle at 25% 75%, rgba(138, 43, 226, 0.22) 0%, transparent 65%),
          radial-gradient(circle at 75% 25%, rgba(75, 0, 130, 0.18) 0%, transparent 65%),
          linear-gradient(135deg, #0a0a1a 0%, #1a0d2e 40%, #2d1b4e 80%, #4a2c7a 100%)
        `,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Cosmic decoration elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#b19cd9",
          boxShadow: "0 0 15px 5px rgba(147, 112, 219, 0.5)",
          opacity: 0.7,
          animation: "twinkle 4s infinite ease-in-out",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "20%",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#9370db",
          boxShadow: "0 0 12px 4px rgba(147, 112, 219, 0.6)",
          opacity: 0.6,
          animation: "twinkle 3s infinite ease-in-out 1s",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "30%",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#663399",
          boxShadow: "0 0 18px 6px rgba(138, 43, 226, 0.5)",
          opacity: 0.8,
          animation: "twinkle 5s infinite ease-in-out 0.5s",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          left: "25%",
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          background: "#dda0dd",
          boxShadow: "0 0 10px 3px rgba(221, 160, 221, 0.7)",
          opacity: 0.7,
          animation: "twinkle 6s infinite ease-in-out 2s",
          pointerEvents: "none",
        }}
      />
      {/* Chat Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "1.5px solid rgba(147, 112, 219, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          background: `
            linear-gradient(135deg, rgba(10, 10, 26, 0.96) 0%, rgba(26, 13, 46, 0.94) 100%),
            linear-gradient(90deg, rgba(147, 112, 219, 0.12) 0%, rgba(138, 43, 226, 0.12) 100%)
          `,
          boxShadow: `0 4px 24px 0 rgba(147, 112, 219, 0.15)`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: isConnected
                ? "linear-gradient(135deg, #9370db 0%, #8a2be2 100%)"
                : "linear-gradient(135deg, #ba55d3 0%, #9932cc 100%)",
              boxShadow: isConnected
                ? "0 0 20px rgba(147, 112, 219, 0.6)"
                : "0 0 20px rgba(186, 85, 211, 0.6)",
              animation: isConnected ? "pulse 2s infinite" : "none",
            }}
          />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #e8e3f3 0%, #b19cd9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.5px",
              }}
            >
              # {currentRoom.name}
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "14px",
                color: "rgba(232, 227, 243, 0.7)",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#9370db",
                    boxShadow: "0 0 10px rgba(147, 112, 219, 0.6)",
                  }}
                />
                {onlineUsers.length} members online
              </span>
              {!isConnected && (
                <span
                  style={{
                    color: "#ba55d3",
                    marginLeft: "8px",
                    padding: "2px 8px",
                    background: "rgba(255, 64, 129, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  • Disconnected
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={generateAISummary}
            disabled={isLoadingSummary}
            style={{
              background: isLoadingSummary
                ? "rgba(255, 255, 255, 0.05)"
                : `
                  linear-gradient(135deg, rgba(147, 112, 219, 0.25) 0%, rgba(138, 43, 226, 0.25) 100%),
                  linear-gradient(135deg, rgba(10, 10, 26, 0.9) 0%, rgba(26, 13, 46, 0.9) 100%)
                `,
              border: isLoadingSummary
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(147, 112, 219, 0.4)",
              borderRadius: "12px",
              padding: "12px 20px",
              color: isLoadingSummary ? "rgba(255, 255, 255, 0.5)" : "#e8e3f3",
              cursor: isLoadingSummary ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: isLoadingSummary
                ? "none"
                : `
                  0 4px 20px rgba(147, 112, 219, 0.25),
                  0 0 0 1px rgba(255, 255, 255, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
              transition: "all 0.2s ease",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoadingSummary ? (
              <>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTop: "2px solid #9370db",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Generating...
              </>
            ) : (
              <>
                <span style={{ fontSize: "16px" }}>🤖</span>
                AI Summary
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
      {/* Messages Area */}
      <div
        ref={messagesAreaRef}
        style={{
          flex: 1,
          padding: "32px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          minHeight: 0,
          scrollBehavior: "smooth",
          background: `
            radial-gradient(circle at 35% 65%, rgba(138, 43, 226, 0.12) 0%, transparent 65%),
            radial-gradient(circle at 65% 35%, rgba(75, 0, 130, 0.08) 0%, transparent 65%)
          `,
        }}
      >
        {Array.isArray(messages) && messages.length > 0 ? (
          messages
            .map((msgData) => {
              // Safety check - skip if message data is invalid
              if (!msgData || typeof msgData !== "object") {
                return null;
              }

              // Handle new message structure: {message: {...}, timestamp: '...'}
              const msg = msgData.message || msgData;
              const timestamp = msgData.timestamp || msg.time || msg.timestamp;

              // Additional safety check for the actual message object
              if (!msg || typeof msg !== "object" || !msg.id) {
                return null;
              }

              // Format timestamp if available
              const formattedTime = timestamp
                ? new Date(timestamp).toLocaleTimeString()
                : "";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    gap: "18px",
                    background:
                      msg.isAI || msgData.isAI
                        ? "linear-gradient(135deg, rgba(147,112,219,0.22) 0%, rgba(138,43,226,0.18) 100%)"
                        : "rgba(10, 10, 26, 0.94)",
                    borderRadius: "18px",
                    padding: "18px 22px",
                    border:
                      msg.isAI || msgData.isAI
                        ? "1.5px solid rgba(147,112,219,0.35)"
                        : "1.5px solid rgba(255,255,255,0.06)",
                    boxShadow:
                      msg.isAI || msgData.isAI
                        ? "0 4px 24px 0 rgba(147,112,219,0.15)"
                        : "0 2px 12px 0 rgba(10,10,26,0.25)",
                    backdropFilter: "blur(8px)",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "44px",
                      height: "44px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background:
                          msg.isAI || msgData.isAI
                            ? "linear-gradient(135deg, #9370db 0%, #663399 100%)"
                            : "linear-gradient(135deg, #2d1b4e 0%, #0a0a1a 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "19px",
                        boxShadow:
                          msg.isAI || msgData.isAI
                            ? "0 2px 12px rgba(147,112,219,0.25)"
                            : "0 1px 4px rgba(10,10,26,0.25)",
                        border:
                          msg.isAI || msgData.isAI
                            ? "1.5px solid #9370db"
                            : "1.5px solid #2d1b4e",
                        color: msg.isAI || msgData.isAI ? "#0a0a1a" : "#b19cd9",
                      }}
                    >
                      {msg.isAI || msgData.isAI ? "🤖" : msg.avatar || "👤"}
                    </div>
                    {/* Status indicator for non-AI users */}
                    {!(msg.isAI || msgData.isAI) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                        }}
                      >
                        <UserStatusIndicator
                          status={
                            msg.user?.status ||
                            msg.status ||
                            msgData.user?.status ||
                            msgData.status ||
                            onlineUsers?.find(
                              (u) =>
                                u.id === msg.userId ||
                                u.id === msg.user?.id ||
                                u.username === msg.username ||
                                u.username === msg.user?.username
                            )?.status ||
                            "offline"
                          }
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "15px",
                          background:
                            msg.isAI || msgData.isAI
                              ? "linear-gradient(135deg, #b19cd9 0%, #9370db 100%)"
                              : "linear-gradient(135deg, #e8e3f3 0%, #b19cd9 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          letterSpacing: "0.2px",
                          lineHeight: 1.1,
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {msg.isAI || msgData.isAI
                          ? "AI Assistant"
                          : msg.username ||
                          msg.user?.username ||
                          msg.user?.name ||
                          msgData.username ||
                          msgData.user?.username ||
                          msgData.user?.name ||
                          (msg.userId ? `User ${msg.userId}` : "User")}
                      </span>
                      {(msg.isAI || msgData.isAI) && (
                        <span
                          style={{
                            fontSize: "10px",
                            background:
                              "linear-gradient(135deg, #9370db 0%, #b19cd9 100%)",
                            color: "#0a0a1a",
                            padding: "2px 7px",
                            borderRadius: "10px",
                            fontWeight: 700,
                            boxShadow: "0 1px 4px rgba(147,112,219,0.25)",
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          AI
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#b19cd9",
                          marginLeft: "auto",
                          fontWeight: 400,
                        }}
                      >
                        {formattedTime}
                      </span>
                    </div>                    <div
                      style={{
                        fontSize: "15px",
                        color: "#f0ebf8",
                        lineHeight: 1.7,
                        wordBreak: "break-word",
                        marginBottom: msg.attachments ? 8 : 0,
                        fontWeight: 400,
                        letterSpacing: "0.01em",
                      }}
                    >                      {msg.type === 'image' ? (
                        <div
                          style={{
                            marginTop: "8px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            maxWidth: "300px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(147, 112, 219, 0.2)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => openImageModal(msg.content)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.02)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(147, 112, 219, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                          }}
                        >
                          <img
                            src={msg.content}
                            alt="Shared image"
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                              maxHeight: "400px",
                              objectFit: "cover",
                              pointerEvents: "none",
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div
                            style={{
                              display: "none",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "20px",
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ff6b6b",
                              fontSize: "14px",
                              gap: "8px",
                            }}
                          >
                            <span>❌</span>
                            Failed to load image
                          </div>
                        </div>
                      ) : (
                        typeof msg.content === "string"
                          ? msg.content
                          : typeof msg.message === "string"
                            ? msg.message
                            : String(msg.content || msg.message || "")
                      )}
                    </div>
                    {msg.attachments && Array.isArray(msg.attachments) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        {msg.attachments.map((att, i) => (
                          <div
                            key={i}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "8px",
                              background: `linear-gradient(135deg, hsl(${i * 60
                                }, 70%, 60%) 0%, hsl(${i * 60 + 30
                                }, 70%, 50%) 100%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#fff",
                            }}
                          >
                            {String(att || "")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            .filter(Boolean)
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #9370db 0%, #663399 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 4px 12px rgba(147, 112, 219, 0.35)",
              }}
            >
              💬
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  color: "#e8e3f3",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                No messages yet
              </p>
              <p
                style={{
                  margin: "0",
                  color: "#b19cd9",
                  fontSize: "14px",
                }}
              >
                Start the conversation!
              </p>
            </div>
          </div>
        )}
        {/* Scroll to bottom marker */}
        <div ref={messagesEndRef} style={{ height: "1px" }} />
      </div>
      {/* Message Input */}
      <div
        style={{
          padding: "24px",
          borderTop: "1px solid rgba(147, 112, 219, 0.2)",
          flexShrink: 0,
          backgroundColor: "rgba(10, 10, 26, 0.85)",
          backdropFilter: "blur(15px)",
          boxShadow: `
            0 -4px 20px rgba(138, 43, 226, 0.15),
            inset 0 1px 0 rgba(147, 112, 219, 0.1)
          `,
        }}
      >        <form
        onSubmit={sendMessage}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={openFileDialog}
            disabled={!isConnected || isUploadingImage}
            style={{
              padding: "14px",
              background: isConnected && !isUploadingImage
                ? "rgba(147, 112, 219, 0.15)"
                : "rgba(147, 112, 219, 0.05)",
              border: isConnected && !isUploadingImage
                ? "2px solid rgba(147, 112, 219, 0.35)"
                : "2px solid rgba(147, 112, 219, 0.15)",
              borderRadius: "12px",
              color: isConnected && !isUploadingImage
                ? "#9370db"
                : "rgba(147, 112, 219, 0.5)",
              cursor: isConnected && !isUploadingImage ? "pointer" : "not-allowed",
              fontSize: "16px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "48px",
              height: "48px",
            }}
            title={isUploadingImage ? "Uploading..." : "Upload image"}
          >
            {isUploadingImage ? (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(147, 112, 219, 0.3)",
                  borderTop: "2px solid #9370db",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              "📷"
            )}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              isConnected
                ? `Message #${currentRoom.name}...`
                : "Reconnecting to chat server..."
            }
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: "14px 18px",
              backgroundColor: isConnected
                ? "rgba(147, 112, 219, 0.12)"
                : "rgba(147, 112, 219, 0.05)",
              border: isConnected
                ? "2px solid rgba(147, 112, 219, 0.35)"
                : "2px solid rgba(147, 112, 219, 0.15)",
              borderRadius: "12px",
              color: isConnected ? "white" : "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
              outline: "none",
              cursor: isConnected ? "text" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            onFocus={(e) => {
              if (isConnected) {
                e.target.style.borderColor = "rgba(147, 112, 219, 0.7)";
                e.target.style.backgroundColor = "rgba(147, 112, 219, 0.15)";
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(147, 112, 219, 0.35)";
              e.target.style.backgroundColor = "rgba(147, 112, 219, 0.12)";
            }}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            style={{
              padding: "14px 20px",
              background:
                isConnected && newMessage.trim()
                  ? "linear-gradient(135deg, #9370db 0%, #663399 100%)"
                  : "rgba(147, 112, 219, 0.08)",
              border:
                isConnected && newMessage.trim()
                  ? "2px solid rgba(147, 112, 219, 0.4)"
                  : "2px solid rgba(147, 112, 219, 0.15)",
              borderRadius: "12px",
              color:
                isConnected && newMessage.trim()
                  ? "white"
                  : "rgba(255, 255, 255, 0.4)",
              cursor:
                isConnected && newMessage.trim() ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow:
                isConnected && newMessage.trim()
                  ? "0 4px 12px rgba(147, 112, 219, 0.35)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            Send
          </button>
        </form>        {!isConnected && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⚠️ Chat is unavailable - check your connection
          </div>
        )}
        {isUploadingImage && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#9370db",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📤 Uploading image...
          </div>
        )}      </div>{" "}
      
      {/* Image Modal */}
      {showImageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
            backdropFilter: "blur(10px)",
          }}
          onClick={closeImageModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: "-50px",
                right: "0",
                background: "rgba(255, 255, 255, 0.2)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                zIndex: 2001,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
                e.target.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "scale(1)";
              }}
            >
              ✕
            </button>
            
            {/* Image container */}
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(147, 112, 219, 0.3)",
                background: "rgba(10, 10, 26, 0.8)",
                backdropFilter: "blur(15px)",
              }}
            >
              <img
                src={modalImageSrc}
                alt="Full size image"
                style={{
                  maxWidth: "80vw",
                  maxHeight: "80vh",
                  width: "auto",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                style={{
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ff6b6b",
                  fontSize: "16px",
                  gap: "12px",
                  minHeight: "200px",
                }}
              >
                <span style={{ fontSize: "24px" }}>❌</span>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                    Failed to load image
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.8 }}>
                    The image might be corrupted or unavailable
                  </div>
                </div>
              </div>
            </div>
            
            {/* Download/Actions */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <a
                href={modalImageSrc}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "12px 20px",
                  background: "linear-gradient(135deg, #9370db 0%, #663399 100%)",
                  border: "2px solid rgba(147, 112, 219, 0.4)",
                  borderRadius: "12px",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 25px rgba(147, 112, 219, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <span>📸</span>
                Open Original
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Summary Modal */}
      {showSummary && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSummary(false);
            }
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0a0a1a 0%, #2d1b4e 100%)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "70vh",
              overflowY: "auto",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "white",
              }}
            >
              Chat Summary
            </h3>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              {summaryText || "No summary available."}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={generateAISummary}
                disabled={isLoadingSummary}
                style={{
                  padding: "10px 16px",
                  background: isLoadingSummary
                    ? "rgba(147, 112, 219, 0.3)"
                    : "linear-gradient(135deg, #9370db 0%, #663399 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor: isLoadingSummary ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: isLoadingSummary ? 0.6 : 1,
                }}
              >
                {isLoadingSummary ? "Generating..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  padding: "10px 16px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
