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
          </p>
        </div>
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
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              {msg.avatar || "👤"}
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
                <span style={{ fontWeight: "600", fontSize: "14px" }}>
                  {msg.username}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {msg.time}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {msg.message}
              </p>
              {msg.attachments && (
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
                        }, 70%, 60%) 0%, hsl(${i * 60 + 30}, 70%, 50%) 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {att}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
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
      </div>
    </div>
  );
}
