import { createContext, useContext, useState, useCallback } from "react";
import http from "../lib/http";

const UserContext = createContext();

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to get user initials
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
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await http.get("/users");
      // Ensure we always set an array, with proper avatar initials and status
      const users = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            avatar: getUserInitials(user.username),
            status: user.status || "offline", // Default to offline if no status
            lastSeen: user.lastSeen || new Date(),
            isOnline:
              user.status === "online" ||
              user.status === "idle" ||
              user.status === "dnd",
          }))
        : [];
      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock data if API fails
      setUsers([
        {
          id: 1,
          username: "Demo User",
          status: "online",
          avatar: "DU",
          lastSeen: new Date(),
          isOnline: true,
        },
        {
          id: 2,
          username: "System Bot",
          status: "idle",
          avatar: "SB",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);
  const updateUserStatus = (userId, status) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status,
              lastSeen: status === "online" ? new Date() : user.lastSeen,
              isOnline:
                status === "online" || status === "idle" || status === "dnd",
            }
          : user
      )
    );
  };

  const addUser = (user) => {
    setUsers((prevUsers) => {
      const existingUser = prevUsers.find((u) => u.id === user.id);
      if (existingUser) {
        return prevUsers.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ...user,
                avatar: getUserInitials(user.username || u.username),
                status: user.status || "online",
                lastSeen: new Date(),
                isOnline: true,
              }
            : u
        );
      }
      return [
        ...prevUsers,
        {
          ...user,
          avatar: getUserInitials(user.username),
          status: user.status || "online",
          lastSeen: new Date(),
          isOnline: true,
        },
      ];
    });
  };

  const removeUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  // Update user's last seen when they become offline
  const setUserOffline = (userId) => {
    updateUserStatus(userId, "offline");
  };

  // Set user online
  const setUserOnline = (userId) => {
    updateUserStatus(userId, "online");
  };

  // Function to change user status
  const changeUserStatus = useCallback(async (newStatus) => {
    try {
      // In a real app, this would make an API call to update status
      // For now, we'll simulate it locally
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id) {
        const updatedUser = { ...currentUser, status: newStatus };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Update the user in the users list
        setUsers((prev) =>
          prev.map((user) =>
            user.id === currentUser.id
              ? {
                  ...user,
                  status: newStatus,
                  isOnline: newStatus !== "offline",
                }
              : user
          )
        );

        console.log(`Status changed to: ${newStatus}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error changing user status:", error);
      return false;
    }
  }, []);

  const value = {
    users,
    setUsers,
    loading,
    fetchUsers,
    updateUserStatus,
    addUser,
    removeUser,
    setUserOffline,
    setUserOnline,
    getUserInitials,
    changeUserStatus,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
