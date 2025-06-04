import { useState } from "react";
import UserStatusIndicator from "./UserStatusIndicator";

const statusOptions = [
  { value: "online", label: "Online", color: "#23a55a" },
  { value: "idle", label: "Idle", color: "#f0b232" },
  { value: "dnd", label: "Do Not Disturb", color: "#f23f43" },
  { value: "offline", label: "Offline", color: "#80848e" },
];

export default function StatusSelector({ currentStatus, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusSelect = (status) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 8px",
          borderRadius: "4px",
          transition: "background-color 0.2s",
          color: "white",
          fontSize: "12px",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "transparent";
        }}
      >
        <UserStatusIndicator status={currentStatus} size="small" />
        <span style={{ textTransform: "capitalize" }}>{currentStatus}</span>
        <span style={{ marginLeft: "4px" }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#2f3136",
            border: "1px solid #40444b",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            marginTop: "4px",
          }}
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                color: "white",
                fontSize: "12px",
                borderRadius: "0",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              <UserStatusIndicator status={option.value} size="small" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
