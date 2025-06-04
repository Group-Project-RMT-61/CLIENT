import { useState } from "react";
import http from "../lib/http";

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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Chat Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
            # {currentRoom.name}
          </h2>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.6)",
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
                : "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              padding: "8px 16px",
              color: isLoadingSummary ? "rgba(255, 255, 255, 0.5)" : "#60a5fa",
              cursor: isLoadingSummary ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {isLoadingSummary ? "Generating..." : "AI Summary"}
          </button>
          <button
            onClick={() => leaveRoom(currentRoom.id)}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Leave Room
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
                        ? "rgba(102, 126, 234, 0.1)"
                        : "transparent",
                    borderRadius: msg.isAI || msgData.isAI ? "8px" : "0",
                    padding: msg.isAI || msgData.isAI ? "12px" : "0",
                    border:
                      msg.isAI || msgData.isAI
                        ? "1px solid rgba(102, 126, 234, 0.3)"
                        : "none",
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
                      flexShrink: 0,
                    }}
                  >
                    {msg.isAI || msgData.isAI ? "🤖" : msg.avatar || "👤"}
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
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
            }}
          >
            No messages yet. Start the conversation!
          </div>
        )}
      </div>
      {/* Message Input */}
      <div
        style={{
          padding: "24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
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
              padding: "12px 16px",
              backgroundColor: isConnected
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: isConnected ? "white" : "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
              outline: "none",
              cursor: isConnected ? "text" : "not-allowed",
            }}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            style={{
              padding: "12px 16px",
              background:
                isConnected && newMessage.trim()
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "12px",
              color:
                isConnected && newMessage.trim()
                  ? "white"
                  : "rgba(255, 255, 255, 0.5)",
              cursor:
                isConnected && newMessage.trim() ? "pointer" : "not-allowed",
              fontSize: "14px",
              opacity: isConnected && newMessage.trim() ? 1 : 0.6,
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
