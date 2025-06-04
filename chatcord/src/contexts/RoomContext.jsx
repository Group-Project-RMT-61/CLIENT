import { createContext, useContext, useState, useCallback, useEffect } from "react";
import http from "../lib/http";
import socketService from "../lib/socket";
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

  // Set up real-time event listeners
  useEffect(() => {
    let cleanupFunction = null;
    let retryCount = 0;
    const maxRetries = 10;

    const setupEventListeners = () => {
      const handleRoomCreated = (data) => {
        console.log("Room created event received:", data);
        console.log("New room data:", data.room);
        setRooms(prevRooms => {
          // Check if room already exists to avoid duplicates
          const roomExists = prevRooms.find(room => room.id === data.room.id);
          if (roomExists) {
            console.log("Room already exists, skipping duplicate");
            return prevRooms;
          }
          console.log("Adding new room to list");
          return [...prevRooms, data.room];
        });
        
        // Show notification
        Swal.fire({
          icon: "info",
          title: "New Room Created",
          text: `"${data.room.name}" room was created by ${data.room.creator?.username || 'someone'}`,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end"
        });
      };

      const handleRoomRemoved = (data) => {
        console.log("Room removed event received:", data);
        console.log("Room ID to remove:", data.roomId, typeof data.roomId);
        setRooms(prevRooms => {
          console.log("Current rooms before filtering:", prevRooms.map(r => ({id: r.id, name: r.name})));
          const updatedRooms = prevRooms.filter(room => {
            const shouldKeep = room.id !== data.roomId;
            console.log(`Room ${room.id} (${room.name}): keep=${shouldKeep}`);
            return shouldKeep;
          });
          console.log("Rooms after removal:", updatedRooms.map(r => ({id: r.id, name: r.name})));
          return updatedRooms;
        });
        
        // Show notification
        Swal.fire({
          icon: "warning",
          title: "Room Deleted",
          text: "A room has been deleted",
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end"
        });
      };

      // Add socket event listeners
      console.log("Setting up room event listeners");
      socketService.onRoomCreated(handleRoomCreated);
      socketService.onRoomRemoved(handleRoomRemoved);

      return () => {
        console.log("Cleaning up room event listeners");
        socketService.off("room_created", handleRoomCreated);
        socketService.off("room_removed", handleRoomRemoved);
      };
    };

    // Check if socket is connected, if not wait a bit and try again
    const trySetupListeners = () => {
      if (socketService.isSocketConnected()) {
        console.log("Socket is connected, setting up room event listeners");
        cleanupFunction = setupEventListeners();
      } else {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`Socket not connected yet, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(trySetupListeners, 1000);
        } else {
          console.warn("Max retries reached, setting up listeners anyway");
          cleanupFunction = setupEventListeners();
        }
      }
    };

    // Start trying to setup listeners
    trySetupListeners();

    // Cleanup function
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, []);

  // Set up real-time event listeners
  useEffect(() => {
    const handleRoomCreated = (data) => {
      console.log("Room created:", data.room);
      setRooms(prevRooms => [...prevRooms, data.room]);
      
      // Show notification
      Swal.fire({
        icon: "info",
        title: "New Room Created",
        text: `"${data.room.name}" room was created by ${data.room.creator?.username || 'someone'}`,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
      });
    };

    const handleRoomRemoved = (data) => {
      console.log("Room removed:", data.roomId);
      setRooms(prevRooms => prevRooms.filter(room => room.id !== data.roomId));
      
      // Show notification
      Swal.fire({
        icon: "warning",
        title: "Room Deleted",
        text: "A room has been deleted",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
      });
    };

    // Add socket event listeners
    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomRemoved(handleRoomRemoved);

    // Cleanup listeners on unmount
    return () => {
      socketService.off("room_created", handleRoomCreated);
      socketService.off("room_removed", handleRoomRemoved);
    };
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
      console.log("Creating room with data:", roomData);
      const token = localStorage.getItem("access_token");
      console.log("Token exists:", !!token);
      
      const response = await http.post("/rooms", roomData);
      console.log("Room creation successful:", response.data);

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
      console.error("Error details:", error.response?.data);
      console.error("Request config:", error.config);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to create room",
      });
      return null;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      await http.delete(`/rooms/${roomId}`);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Room deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh rooms list
      await fetchRooms();
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to delete room",
      });
      return false;
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
    deleteRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
