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
}) {
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef(null);

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
        cleanText = cleanText.replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          ""
        );

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!currentRoom) {
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}
        >
          💬
        </div>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
          Welcome to ChatCord
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          Select a room to start chatting
        </p>
        {!isConnected && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#ef4444",
              fontSize: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              ⚠️ Not connected to chat server
            </div>
            <a
              href="/status"
              style={{
                color: "#ef4444",
                textDecoration: "underline",
                fontSize: "12px",
              }}
            >
              Check server status
            </a>
          </div>
        )}
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
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, rgba(54, 57, 63, 0.8) 0%, rgba(64, 68, 75, 0.9) 100%)
        `,
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "2px solid rgba(102, 126, 234, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            # {currentRoom.name}
          </h2>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
            }}
          >
            {onlineUsers.length} members online
            {!isConnected && (
              <span style={{ color: "#ef4444", marginLeft: "8px" }}>
                • Disconnected
              </span>
            )}
          </p>{" "}
        </div>{" "}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={generateAISummary}
            disabled={isLoadingSummary}
            style={{
              background: isLoadingSummary
                ? "rgba(255, 255, 255, 0.05)"
                : "linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)",
              border: isLoadingSummary
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(102, 126, 234, 0.5)",
              borderRadius: "10px",
              padding: "10px 18px",
              color: isLoadingSummary ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
              cursor: isLoadingSummary ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: isLoadingSummary
                ? "none"
                : "0 4px 12px rgba(102, 126, 234, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {isLoadingSummary ? "Generating..." : "AI Summary"}
          </button>
        </div>
      </div>
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          minHeight: 0,
          scrollBehavior: "smooth",
        }}
      >
        {" "}
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
                    gap: "12px",
                    backgroundColor:
                      msg.isAI || msgData.isAI
                        ? "rgba(102, 126, 234, 0.15)"
                        : "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "16px",
                    border:
                      msg.isAI || msgData.isAI
                        ? "1px solid rgba(102, 126, 234, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      position: "relative",
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background:
                          msg.isAI || msgData.isAI
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
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
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      {" "}
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: msg.isAI || msgData.isAI ? "#667eea" : "white",
                        }}
                      >
                        {msg.isAI || msgData.isAI
                          ? "🤖 AI Assistant"
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
                            backgroundColor: "#667eea",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          AI
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        {formattedTime}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {typeof msg.content === "string"
                        ? msg.content
                        : typeof msg.message === "string"
                        ? msg.message
                        : String(msg.content || msg.message || "")}
                    </p>
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
                              background: `linear-gradient(135deg, hsl(${
                                i * 60
                              }, 70%, 60%) 0%, hsl(${
                                i * 60 + 30
                              }, 70%, 50%) 100%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "600",
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              }}
            >
              💬
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                No messages yet
              </p>
              <p
                style={{
                  margin: "0",
                  color: "rgba(255, 255, 255, 0.5)",
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
          borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          flexShrink: 0,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(10px)",
        }}
      >
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
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
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(255, 255, 255, 0.05)",
              border: isConnected
                ? "2px solid rgba(102, 126, 234, 0.3)"
                : "2px solid rgba(255, 255, 255, 0.1)",
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
                e.target.style.borderColor = "rgba(102, 126, 234, 0.6)";
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(102, 126, 234, 0.3)";
              e.target.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
            }}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            style={{
              padding: "14px 20px",
              background:
                isConnected && newMessage.trim()
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "rgba(255, 255, 255, 0.08)",
              border:
                isConnected && newMessage.trim()
                  ? "2px solid rgba(102, 126, 234, 0.3)"
                  : "2px solid rgba(255, 255, 255, 0.1)",
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
                  ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            Send
          </button>
        </form>
        {!isConnected && (
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
      </div>{" "}
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
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
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
                    ? "rgba(59, 130, 246, 0.3)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
