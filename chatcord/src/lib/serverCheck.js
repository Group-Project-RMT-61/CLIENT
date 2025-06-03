import { io } from "socket.io-client";

// Simple utility to check server connectivity
export const checkServerConnection = async () => {
  try {
    const response = await fetch("http://localhost:3000/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};

export const checkSocketConnection = async () => {
  return new Promise((resolve) => {
    try {
      const testSocket = io("http://localhost:3000", {
        timeout: 5000,
        transports: ["websocket", "polling"],
      });

      testSocket.on("connect", () => {
        testSocket.disconnect();
        resolve(true);
      });

      testSocket.on("connect_error", () => {
        testSocket.disconnect();
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        testSocket.disconnect();
        resolve(false);
      }, 5000);
    } catch (err) {
      console.error("Socket connection test failed:", err);
      resolve(false);
    }
  });
};
