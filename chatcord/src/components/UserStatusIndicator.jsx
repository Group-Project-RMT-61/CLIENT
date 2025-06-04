import React from "react";

const UserStatusIndicator = ({ status, size = "small", showText = false }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "#22c55e"; // Green
      case "idle":
      case "away":
        return "#f59e0b"; // Yellow/Orange
      case "dnd":
      case "busy":
        return "#ef4444"; // Red
      case "offline":
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "Online";
      case "idle":
      case "away":
        return "Away";
      case "dnd":
      case "busy":
        return "Do Not Disturb";
      case "offline":
      default:
        return "Offline";
    }
  };

  const dotSize =
    size === "large" ? "12px" : size === "medium" ? "10px" : "8px";
  const borderWidth =
    size === "large" ? "3px" : size === "medium" ? "2px" : "2px";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: showText ? "6px" : "0",
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: getStatusColor(status),
          border: `${borderWidth} solid #2f3136`, // Discord-like border
          flexShrink: 0,
          boxSizing: "border-box",
        }}
        title={getStatusText(status)}
      />
      {showText && (
        <span
          style={{
            fontSize: "12px",
            color: getStatusColor(status),
            fontWeight: "500",
          }}
        >
          {getStatusText(status)}
        </span>
      )}
    </div>
  );
};

export default UserStatusIndicator;
