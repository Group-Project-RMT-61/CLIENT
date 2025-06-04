import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import socketService from "../lib/socket";
import Swal from "sweetalert2";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
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
  // Initialize Socket.IO connection
  const initializeSocket = useCallback((token) => {
    // Prevent multiple connections
    if (socketService.isSocketConnected()) {
      console.log("Socket already connected, skipping initialization");
      return;
    }

    if (token) {
      const socket = socketService.connect(token);

      // Connection status
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
          text: "Unable to reconnect to chat server. Please refresh the page.",
          showConfirmButton: true,
          confirmButtonText: "Refresh Page",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      });

      // Listen for new messages
      socketService.onMessage((data) => {
        console.log("New message received:", data);
        setMessages((prevMessages) => {
          const newMsg = {
            id: data.id || Date.now(),
            message: data.message,
            username: data.user?.username || data.username,
            time: new Date(
              data.timestamp || data.createdAt
            ).toLocaleTimeString(),
            avatar: data.user?.username
              ? data.user.username.charAt(0).toUpperCase()
              : "👤",
            isAI: data.isAI || false,
          };
          return [...prevMessages, newMsg];
        });
      });

      // Listen for room messages
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
      }); // Listen for users updates - Enhanced for real-time room member tracking
      socketService.onUsersUpdate((users) => {
        console.log("Users update received:", users);
        const formattedUsers = users.map((user) => ({
          ...user,
          avatar: user.username ? user.username.charAt(0).toUpperCase() : "👤",
          status: user.status || "online",
          lastSeen: user.lastSeen || new Date(),
          isOnline: user.status !== "offline",
          // Add room context if available
          currentRoom: user.currentRoom || null,
        }));
        setOnlineUsers(formattedUsers);
      });

      // Listen for user joined - Enhanced to update online users immediately
      socketService.onUserJoined((data) => {
        console.log("User joined:", data);
        const username =
          data.username || data.user?.username || data.user?.name || "A user";

        // Add user to online users list immediately
        if (data.user) {
          setOnlineUsers((prevUsers) => {
            const existingUser = prevUsers.find((u) => u.id === data.user.id);
            if (!existingUser) {
              const newUser = {
                ...data.user,
                avatar: data.user.username
                  ? data.user.username.charAt(0).toUpperCase()
                  : "👤",
                status: data.user.status || "online",
                lastSeen: new Date(),
                isOnline: true,
                currentRoom: data.roomId || null,
              };
              return [...prevUsers, newUser];
            } else {
              // Update existing user's status to online
              return prevUsers.map((u) =>
                u.id === data.user.id
                  ? {
                      ...u,
                      isOnline: true,
                      status: "online",
                      currentRoom: data.roomId || null,
                    }
                  : u
              );
            }
          });
        }

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
      return socket;
    }
  }, []);
  // Simulate realistic user statuses for demo purposes
  // Commented out unused function to fix linting errors
  // const simulateUserStatuses = useCallback((users) => {
  //   const statusOptions = ["online", "idle", "dnd", "offline"];
  //   return users.map((user, index) => {
  //     // Assign different statuses to make it look realistic
  //     let status;
  //     switch (index % 4) {
  //       case 0:
  //         status = "online";
  //         break;
  //       case 1:
  //         status = "idle";
  //         break;
  //       case 2:
  //         status = "dnd";
  //         break;
  //       default:
  //         status = "offline";
  //     }

  //     return {
  //       ...user,
  //       status: user.status || status,
  //       lastSeen:
  //         user.lastSeen || new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
  //       isOnline: status !== "offline",
  //     };
  //   });
  // }, []);

  // Enhanced users update with better status handling
  useEffect(() => {
    // If we have online users but no status info, simulate statuses
    if (onlineUsers.length > 0) {
      const usersWithStatuses = onlineUsers.map((user) => ({
        ...user,
        status: user.status || "online", // Default to online if no status
        lastSeen: user.lastSeen || new Date(),
        isOnline: user.status !== "offline",
      }));

      // Only update if the statuses actually changed
      const hasChanges = usersWithStatuses.some(
        (user, index) =>
          !onlineUsers[index] || onlineUsers[index].status !== user.status
      );

      if (hasChanges) {
        setOnlineUsers(usersWithStatuses);
      }
    }
  }, [onlineUsers.length]);

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
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
  }, []);

  const value = {
    selectedRoom,
    setSelectedRoom,
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    onlineUsers,
    setOnlineUsers,
    isConnected,
    setIsConnected,
    initializeSocket,
    handleRoomSelect,
    sendMessage,
    leaveRoom,
    disconnectSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
