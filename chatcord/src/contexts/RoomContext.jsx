import { createContext, useContext, useState, useCallback } from "react";
import http from "../lib/http";
import Swal from "sweetalert2";

const RoomContext = createContext();

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRooms must be used within a RoomProvider");
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
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
  }, []);

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

      // Refresh rooms list
      await fetchRooms();
      return true;
    } catch (error) {
      console.error("Error joining room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to join room",
      });
      return false;
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
      await fetchRooms();
      return true;
    } catch (error) {
      console.error("Error leaving room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to leave room",
      });
      return false;
    }
  };

  const createRoom = async (roomData) => {
    try {
      const response = await http.post("/rooms", roomData);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Room created successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh rooms list
      await fetchRooms();
      return response.data;
    } catch (error) {
      console.error("Error creating room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to create room",
      });
      return null;
    }
  };

  const value = {
    rooms,
    setRooms,
    loading,
    fetchRooms,
    joinRoom,
    leaveRoom,
    createRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
