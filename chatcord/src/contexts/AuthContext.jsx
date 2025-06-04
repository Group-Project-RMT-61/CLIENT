import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Check if user is authenticated on app start
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const id = localStorage.getItem("id");
    const status = localStorage.getItem("status");

    if (token && username) {
      setUser({
        id: id,
        username: username,
        email: email,
        token: token,
        status: status || "online",
      });
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Store in localStorage
    localStorage.setItem("access_token", userData.access_token);
    localStorage.setItem("username", userData.username);
    localStorage.setItem("email", userData.email);
    localStorage.setItem("id", userData.id);
    localStorage.setItem("status", userData.status || "online"); // Update state
    setUser({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      token: userData.access_token,
      status: userData.status || "online",
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("id");
    localStorage.removeItem("status");
    localStorage.removeItem("currentRoom");
    localStorage.removeItem("roomMessages");

    // Update state
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
