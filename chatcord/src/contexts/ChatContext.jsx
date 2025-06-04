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
  // const [messageCache, setMessageCache] = useState({}); // Cache messages per room - commented out unused
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef(messages);

  // Persistence functions for localStorage
  const saveSelectedRoomToStorage = useCallback((room) => {
    try {
      if (room) {
        localStorage.setItem("chatcord_selectedRoom", JSON.stringify(room));
      } else {
        localStorage.removeItem("chatcord_selectedRoom");
      }
    } catch (error) {
      console.error("Error saving selected room to localStorage:", error);
    }
  }, []);

  const loadSelectedRoomFromStorage = useCallback(() => {
    try {
      const savedRoom = localStorage.getItem("chatcord_selectedRoom");
      return savedRoom ? JSON.parse(savedRoom) : null;
    } catch (error) {
      console.error("Error loading selected room from localStorage:", error);
      return null;
    }
  }, []);
  const saveMessagesToCache = useCallback((roomId, messages) => {
    try {
      if (roomId && messages) {
        const cacheKey = `chatcord_messages_${roomId}`;
        // Limit to last 100 messages to prevent localStorage from growing too large
        const limitedMessages = messages.slice(-100);
        localStorage.setItem(cacheKey, JSON.stringify(limitedMessages));

        // Update local cache state (if we used it)
        // setMessageCache(prev => ({
        //   ...prev,
        //   [roomId]: limitedMessages
        // }));
      }
    } catch (error) {
      console.error("Error saving messages to cache:", error);
    }
  }, []);

  const loadMessagesFromCache = useCallback((roomId) => {
    try {
      if (roomId) {
        const cacheKey = `chatcord_messages_${roomId}`;
        const cachedMessages = localStorage.getItem(cacheKey);
        return cachedMessages ? JSON.parse(cachedMessages) : [];
      }
      return [];
    } catch (error) {
      console.error("Error loading messages from cache:", error);
      return [];
    }
  }, []);
  // Clear old message cache (keep only recent rooms)
  // const clearOldMessageCache = useCallback(() => {
  //   try {
  //     const keysToRemove = [];
  //     for (let i = 0; i < localStorage.length; i++) {
  //       const key = localStorage.key(i);
  //       if (key && key.startsWith('chatcord_messages_')) {
  //         // You can add logic here to remove old cache entries
  //         // For now, we'll keep all cache but limit message count per room
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error clearing old message cache:', error);
  //   }
  // }, []);

  // Load saved room and message cache on component mount
  useEffect(() => {
    const savedRoom = loadSelectedRoomFromStorage();
    if (savedRoom) {
      setSelectedRoom(savedRoom);
      // Load cached messages for the saved room
      const cachedMessages = loadMessagesFromCache(savedRoom.id);
      setMessages(cachedMessages);
    } // Load all message cache from localStorage
    try {
      // const cache = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("chatcord_messages_")) {
          // const roomId = key.replace('chatcord_messages_', '');
          // const messages = JSON.parse(localStorage.getItem(key) || '[]');
          // cache[roomId] = messages;
        }
      }
      // setMessageCache(cache);
    } catch (error) {
      console.error("Error loading message cache:", error);
    }
  }, [loadSelectedRoomFromStorage, loadMessagesFromCache]);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Save messages to cache whenever messages change
  useEffect(() => {
    if (selectedRoom && messages.length > 0) {
      saveMessagesToCache(selectedRoom.id, messages);
    }
  }, [messages, selectedRoom, saveMessagesToCache]);

  // Auto-rejoin room when socket connects and we have a selected room
  useEffect(() => {
    if (
      isConnected &&
      selectedRoom &&
      selectedRoom.id &&
      socketService.isSocketConnected()
    ) {
      // Check if we're not already in the room by checking if we should rejoin
      console.log(
        `Ensuring user is joined to room: ${selectedRoom.name} (${selectedRoom.id})`
      );
      socketService.joinRoom(selectedRoom.id);
    }
  }, [isConnected, selectedRoom]);

  // Initialize Socket.IO connection
  const initializeSocket = useCallback((token) => {
    // Prevent multiple connections
    if (socketService.isSocketConnected()) {
      console.log("Socket already connected, skipping initialization");
      return;
    }

    if (token) {
      const socket = socketService.connect(token); // Connection status
      socket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);

        // Auto-rejoin saved room when socket connects
        const savedRoom = loadSelectedRoomFromStorage();
        if (savedRoom && savedRoom.id) {
          console.log(
            `Auto-rejoining saved room: ${savedRoom.name} (${savedRoom.id})`
          );
          socketService.joinRoom(savedRoom.id);

          // Make sure the selectedRoom state is set
          setSelectedRoom(savedRoom);

          // Load cached messages for the saved room
          const cachedMessages = loadMessagesFromCache(savedRoom.id);
          setMessages(cachedMessages);
        }
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

        // Auto-rejoin saved room when socket reconnects
        const savedRoom = loadSelectedRoomFromStorage();
        const roomToRejoin = selectedRoom || savedRoom;

        if (roomToRejoin && roomToRejoin.id) {
          console.log(
            `Auto-rejoining room after reconnect: ${roomToRejoin.name} (${roomToRejoin.id})`
          );
          socketService.joinRoom(roomToRejoin.id);

          // Make sure state is consistent
          if (!selectedRoom && savedRoom) {
            setSelectedRoom(savedRoom);
            const cachedMessages = loadMessagesFromCache(savedRoom.id);
            setMessages(cachedMessages);
          }
        }
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

      // Listen for room deletion events
      socketService.onRoomDeleted((data) => {
        console.log("Room deleted:", data);
        // Check if the user is currently in the deleted room
        if (selectedRoom && selectedRoom.id === data.roomId) {
          // Save current messages before leaving
          if (messages.length > 0) {
            saveMessagesToCache(selectedRoom.id, messages);
          }

          // Clear the selected room and messages
          setSelectedRoom(null);
          saveSelectedRoomToStorage(null);
          setMessages([]);

          // Show notification to user
          Swal.fire({
            icon: "warning",
            title: "Room Deleted",
            text: `The room "${data.roomName || 'Unknown room'}" has been deleted by ${data.deletedBy || 'the room creator'}.`,
            showConfirmButton: true,
            confirmButtonText: "OK",
          });
        }
      });

      // Listen for room removal events (alternative event)
      socketService.onRoomRemoved((data) => {
        console.log("Room removed:", data);
        // Check if the user is currently in the removed room
        if (selectedRoom && selectedRoom.id === data.roomId) {
          // Save current messages before leaving
          if (messages.length > 0) {
            saveMessagesToCache(selectedRoom.id, messages);
          }

          // Clear the selected room and messages
          setSelectedRoom(null);
          saveSelectedRoomToStorage(null);
          setMessages([]);

          // Show notification to user
          Swal.fire({
            icon: "info",
            title: "Room Unavailable",
            text: `The room "${data.roomName || 'Unknown room'}" is no longer available.`,
            showConfirmButton: true,
            confirmButtonText: "OK",
          });
        }
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
    // Save current room's messages before leaving
    if (selectedRoom && messages.length > 0) {
      saveMessagesToCache(selectedRoom.id, messages);
    }

    // Leave previous room if any
    if (selectedRoom) {
      socketService.leaveRoom(selectedRoom.id);
    }

    // Set new room and save to localStorage
    setSelectedRoom(room);
    saveSelectedRoomToStorage(room);

    // Load cached messages for the new room
    if (room) {
      const cachedMessages = loadMessagesFromCache(room.id);
      setMessages(cachedMessages);

      // Join new room
      if (socketService.isSocketConnected()) {
        socketService.joinRoom(room.id);
        console.log(`Joining room: ${room.name} (${room.id})`);
      }
    } else {
      setMessages([]);
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
    // Save current room's messages before leaving
    if (selectedRoom && messages.length > 0) {
      saveMessagesToCache(selectedRoom.id, messages);
    }

    if (selectedRoom && socketService.isSocketConnected()) {
      socketService.leaveRoom(selectedRoom.id);
    }

    setSelectedRoom(null);
    saveSelectedRoomToStorage(null); // Clear from localStorage
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
