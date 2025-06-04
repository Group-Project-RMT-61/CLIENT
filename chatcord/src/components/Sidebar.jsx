import { useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth, useRooms, useUsers } from "../contexts";
import UserStatusIndicator from "./UserStatusIndicator";
import StatusSelector from "./StatusSelector";

export default function SidebarDiscord({
  onRoomSelect,
  selectedRoom,
  onlineUsers,
  onLogout,
}) {
  const { user } = useAuth();
  const {
    rooms,
    loading: roomsLoading,
    fetchRooms,
    createRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
  } = useRooms();
  const { changeUserStatus } = useUsers();

  // Get user data from context instead of localStorage
  const username = user?.username || "User";
  const userStatus = user?.status || "online";

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

  // Load rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    const { value: roomName } = await Swal.fire({
      title: "Create New Room",
      input: "text",
      inputLabel: "Room Name",
      inputPlaceholder: "Enter room name...",
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return "Room name is required!";
        }
        if (value.trim().length > 50) {
          return "Room name must be less than 50 characters!";
        }
      },
    });

    if (roomName) {
      try {
        console.log("Sidebar - Creating room with name:", roomName.trim());
        const roomData = { name: roomName.trim() };
        console.log("Sidebar - Room data object:", roomData);
        await createRoom(roomData);
        console.log("Sidebar - Room creation completed");
      } catch (error) {
        console.error("Sidebar - Error creating room:", error);
      }
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
      // fetchRooms will be called by the RoomContext
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      await leaveRoom(roomId);
      // fetchRooms will be called by the RoomContext
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleDeleteRoom = async (room) => {
    // Confirm deletion
    const result = await Swal.fire({
      title: "Delete Room",
      text: `Are you sure you want to delete "${room.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteRoom(room.id);
      } catch (error) {
        console.error("Error deleting room:", error);
      }
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#2f3136",
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
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          ChatCord Server
        </h3>
      </div>

      {/* Rooms Section */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 12px 8px 16px",
            color: "#8e9297",
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Channels</span>
          <button
            onClick={handleCreateRoom}
            style={{
              background: "none",
              border: "none",
              color: "#8e9297",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "3px",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#40444b";
              e.target.style.color = "#dcddde";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#8e9297";
            }}
            title="Create Channel"
          >
            +
          </button>
        </div>

        {/* Rooms List */}
        <div style={{ flex: 1, overflow: "auto", paddingRight: "8px" }}>
          {roomsLoading ? (
            <div
              style={{ padding: "16px", color: "#8e9297", textAlign: "center" }}
            >
              Loading rooms...
            </div>
          ) : (
            <div style={{ padding: "0 8px" }}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onRoomSelect(room)}
                  style={{
                    padding: "6px 8px",
                    margin: "1px 0",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: selectedRoom?.id === room.id ? "#ffffff" : "#8e9297",
                    backgroundColor:
                      selectedRoom?.id === room.id ? "#42464d" : "transparent",
                    fontSize: "16px",
                    fontWeight: selectedRoom?.id === room.id ? "500" : "400",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoom?.id !== room.id) {
                      e.target.style.backgroundColor = "#36393f";
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
                  <span style={{ marginRight: "6px", fontSize: "20px" }}>
                    #
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {room.name}
                  </span>

                  <div
                    style={{ display: "flex", gap: "4px", marginLeft: "8px" }}
                  >
                    {/* Show Join or Leave button based on membership status */}
                    {room.isJoined ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveRoom(room.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#fbbf24",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f59e0b";
                          e.target.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#fbbf24";
                        }}
                        title="Leave Room"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinRoom(room.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#10b981",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#059669";
                          e.target.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#10b981";
                        }}
                        title="Join Room"
                      >
                        Join
                      </button>
                    )}

                    {/* Show delete button only if current user created the room */}
                    {room.createdBy === user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#ef4444";
                          e.target.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#f87171";
                        }}
                        title="Delete Room"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Users Section */}
      <div
        style={{
          borderTop: "1px solid #202225",
          maxHeight: "200px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 12px 8px 16px",
            color: "#8e9297",
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Online Users — {onlineUsers.length}
        </div>{" "}
        <div style={{ overflow: "auto", paddingBottom: "8px" }}>
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: "4px 16px",
                display: "flex",
                alignItems: "center",
                color: "#dcddde",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#5865f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginRight: "12px",
                }}
              >
                {user.avatar || getUserInitials(user.username)}
                {/* Status indicator positioned at bottom-right */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                  }}
                >
                  <UserStatusIndicator status={user.status} size="medium" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.username}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8e9297",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <UserStatusIndicator
                    status={user.status}
                    showText={true}
                    size="small"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid #202225",
          backgroundColor: "#292b2f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {" "}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#5865f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              marginRight: "8px",
            }}
          >
            {" "}
            {initials}
            {/* Current user status indicator */}
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
              }}
            >
              <UserStatusIndicator status={userStatus} size="medium" />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "500",
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
                color: "#8e9297",
                display: "flex",
                alignItems: "center",
              }}
            >
              <StatusSelector
                currentStatus={userStatus}
                onStatusChange={changeUserStatus}
              />
            </div>
          </div>
        </div>
        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            background: "none",
            border: "none",
            color: "#8e9297",
            cursor: "pointer",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#40444b";
            e.target.style.color = "#dcddde";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#8e9297";
          }}
          title="Logout"
        >
          🚪
        </button>
      </div>
    </div>
  );
}
