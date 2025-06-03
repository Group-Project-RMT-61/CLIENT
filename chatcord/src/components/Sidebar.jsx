import { useState, useEffect, useCallback } from "react";
import http from "../lib/http";
import Swal from "sweetalert2";

export default function SidebarDiscord({
  onRoomSelect,
  selectedRoom,
  onlineUsers,
  setOnlineUsers,
  onLogout,
}) {
  // Get user data from localStorage
  const username = localStorage.getItem("username") || "User";
  const [rooms, setRooms] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);

  // Get user's initials from username
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const initials = getUserInitials(username);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      const response = await http.get("/users");
      // Ensure we always set an array, with proper avatar initials
      const users = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            avatar: getUserInitials(user.username),
          }))
        : [];
      setOnlineUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock data if API fails
      setOnlineUsers([
        {
          id: 1,
          username: "Demo User",
          status: "online",
          avatar: "DU",
        },
        {
          id: 2,
          username: "System Bot",
          status: "idle",
          avatar: "SB",
        },
      ]);
    }
  }, [setOnlineUsers]);

  // Fetch rooms and users on component mount
  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, [fetchUsers]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await http.get("/rooms");
      // Ensure we always set an array
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Set empty array on error
      setRooms([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch rooms",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const response = await http.post(`/rooms/${roomId}/join`);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh rooms list and trigger room selection
      fetchRooms();

      // Find the room and trigger selection
      const room = rooms.find((r) => r.id === roomId) || {
        id: roomId,
        name: `room-${roomId}`,
      };
      if (onRoomSelect) {
        onRoomSelect(room);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to join room",
      });
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      const response = await http.delete(`/rooms/${roomId}/leave`);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh rooms list
      fetchRooms();
    } catch (error) {
      console.error("Error leaving room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to leave room",
      });
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#2f3136",
        borderRadius: "0",
      }}
    >
      {/* Server Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #202225",
          backgroundColor: "#36393f",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ChatCord Server
          <span
            style={{
              fontSize: "12px",
              color: "#b9bbbe",
              background: "#4f545c",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            ↓
          </span>
        </h3>
      </div>

      {/* Text Channels Section */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 8px 8px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#8e9297",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
              }}
            >
              ▼ Text Channels
            </span>
            <div
              style={{
                marginLeft: "auto",
                fontSize: "18px",
                color: "#b9bbbe",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              +
            </div>
          </div>

          {/* Channels List */}
          <div style={{ paddingLeft: "8px" }}>
            {loading ? (
              <div
                style={{
                  color: "#8e9297",
                  fontSize: "14px",
                  padding: "8px 0",
                }}
              >
                Loading channels...
              </div>
            ) : !Array.isArray(rooms) || rooms.length === 0 ? (
              <div
                style={{
                  color: "#8e9297",
                  fontSize: "14px",
                  padding: "8px 0",
                }}
              >
                No channels available
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onRoomSelect && onRoomSelect(room)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Show context menu for join/leave
                    if (selectedRoom?.id === room.id) {
                      leaveRoom(room.id);
                    } else {
                      joinRoom(room.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    margin: "1px 0",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedRoom?.id === room.id ? "#42464d" : "transparent",
                    color: selectedRoom?.id === room.id ? "#ffffff" : "#8e9297",
                    fontSize: "16px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoom?.id !== room.id) {
                      e.target.style.backgroundColor = "#3c3f45";
                      e.target.style.color = "#dcddde";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoom?.id !== room.id) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#8e9297";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>#</span>
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>
                    {room.name.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                  {selectedRoom?.id === room.id && (
                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{ fontSize: "16px", cursor: "pointer" }}
                        title="Notifications"
                      >
                        🔔
                      </span>
                      <span
                        style={{ fontSize: "16px", cursor: "pointer" }}
                        title="Members"
                      >
                        👥
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Default general channel */}
            <div
              onClick={() =>
                onRoomSelect && onRoomSelect({ id: "general", name: "general" })
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                margin: "1px 0",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  selectedRoom?.id === "general" ? "#42464d" : "transparent",
                color: selectedRoom?.id === "general" ? "#ffffff" : "#8e9297",
                fontSize: "16px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedRoom?.id !== "general") {
                  e.target.style.backgroundColor = "#3c3f45";
                  e.target.style.color = "#dcddde";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRoom?.id !== "general") {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#8e9297";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>#</span>
              <span style={{ fontSize: "16px", fontWeight: "500" }}>
                general
              </span>
              {selectedRoom?.id === "general" && (
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{ fontSize: "16px", cursor: "pointer" }}
                    title="Notifications"
                  >
                    🔔
                  </span>
                  <span
                    style={{ fontSize: "16px", cursor: "pointer" }}
                    title="Members"
                  >
                    👥
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Online Users Section */}
        {onlineUsers.filter((u) => u.status === "online").length > 0 && (
          <div style={{ padding: "16px 8px 8px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#8e9297",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ▼ Online —{" "}
                {onlineUsers.filter((u) => u.status === "online").length}
              </span>
            </div>

            <div style={{ paddingLeft: "8px" }}>
              {onlineUsers
                .filter((user) => user.status === "online")
                .map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px",
                      margin: "1px 0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#3c3f45";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "white",
                        }}
                      >
                        {user.avatar}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#4ade80",
                          border: "3px solid #2f3136",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#dcddde",
                      }}
                    >
                      {user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Idle Users Section */}
        {onlineUsers.filter((u) => u.status === "idle").length > 0 && (
          <div style={{ padding: "16px 8px 8px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#8e9297",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ▼ Idle — {onlineUsers.filter((u) => u.status === "idle").length}
              </span>
            </div>

            <div style={{ paddingLeft: "8px" }}>
              {onlineUsers
                .filter((user) => user.status === "idle")
                .map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px",
                      margin: "1px 0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#3c3f45";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "white",
                        }}
                      >
                        {user.avatar}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#facc15",
                          border: "3px solid #2f3136",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#dcddde",
                      }}
                    >
                      {user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Offline Users Section */}
        {onlineUsers.filter((u) => u.status === "offline").length > 0 && (
          <div style={{ padding: "16px 8px 8px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#8e9297",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ▼ Offline —{" "}
                {onlineUsers.filter((u) => u.status === "offline").length}
              </span>
            </div>

            <div style={{ paddingLeft: "8px" }}>
              {onlineUsers
                .filter((user) => user.status === "offline")
                .map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px",
                      margin: "1px 0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      opacity: 0.5,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#3c3f45";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "white",
                        }}
                      >
                        {user.avatar}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#747f8d",
                          border: "3px solid #2f3136",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#dcddde",
                      }}
                    >
                      {user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Panel */}
      <div
        style={{
          padding: "8px",
          backgroundColor: "#292b2f",
          borderTop: "1px solid #202225",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* User Avatar and Info */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "600",
                color: "white",
              }}
            >
              {initials}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "12px",
                height: "12px",
                backgroundColor: "#4ade80",
                border: "3px solid #292b2f",
                borderRadius: "50%",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {username}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#b9bbbe",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Online
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="container d-flex justify-content-end">
          <button
            onClick={onLogout}

            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#4f545c";
              e.target.style.color = "#dcddde";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#b9bbbe";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
