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
      // Ensure we always set an array, with proper avatar initials
      const users = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            avatar: getUserInitials(user.username),
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
      prevUsers.map((user) => (user.id === userId ? { ...user, status } : user))
    );
  };

  const addUser = (user) => {
    setUsers((prevUsers) => [
      ...prevUsers,
      {
        ...user,
        avatar: getUserInitials(user.username),
      },
    ]);
  };

  const removeUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  const value = {
    users,
    setUsers,
    loading,
    fetchUsers,
    updateUserStatus,
    addUser,
    removeUser,
    getUserInitials,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
