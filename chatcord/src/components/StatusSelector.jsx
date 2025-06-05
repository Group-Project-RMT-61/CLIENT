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
    <div style={{ position: "relative", minWidth: "120px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(40,44,52,0.7)",
          border: "1.5px solid rgba(147,112,219,0.18)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "7px 14px",
          borderRadius: "8px",
          color: "white",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: isOpen
            ? "0 4px 16px rgba(147,112,219,0.12)"
            : "0 1px 4px rgba(0,0,0,0.08)",
          transition: "background 0.2s, box-shadow 0.2s",
          outline: isOpen ? "2px solid #b19cd9" : "none",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(147,112,219,0.13)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(40,44,52,0.7)";
        }}
      >
        <UserStatusIndicator status={currentStatus} size="small" />
        <span style={{ textTransform: "capitalize" }}>{currentStatus}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          style={{ marginLeft: 2 }}
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="#b19cd9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            minWidth: "140px",
            background: "rgba(40,44,52,0.97)",
            border: "1.5px solid #b19cd9",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(147,112,219,0.18)",
            zIndex: 1000,
            marginTop: "6px",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
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
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                color: "white",
                fontSize: "13px",
                fontWeight: 500,
                borderRadius: "0",
                transition: "background 0.18s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(147,112,219,0.10)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "none";
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
