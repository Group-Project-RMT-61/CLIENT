import { useState, useEffect } from "react";
import socketService from "../lib/socket";

export default function SocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState("test-room");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const socket = socketService.connect(token);

      socket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from server");
        setIsConnected(false);
      });

      socketService.onMessage((data) => {
        console.log("Message received:", data);
        setMessages((prev) => [...prev, data]);
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, []);

  const joinRoom = () => {
    if (socketService.isSocketConnected()) {
      socketService.joinRoom(room);
      console.log(`Joined room: ${room}`);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socketService.isSocketConnected()) {
      socketService.sendMessage(room, newMessage.trim());
      setNewMessage("");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Socket.IO Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <strong>Connection Status: </strong>
        <span style={{ color: isConnected ? "green" : "red" }}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room name"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button onClick={joinRoom} disabled={!isConnected}>
          Join Room
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Messages:</h3>
        <div
          style={{
            border: "1px solid #ccc",
            height: "200px",
            overflowY: "auto",
            padding: "10px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: "5px" }}>
              <strong>{msg.username || "Unknown"}:</strong> {msg.message}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          style={{ marginRight: "10px", padding: "5px", width: "300px" }}
        />
        <button type="submit" disabled={!isConnected || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
