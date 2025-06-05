import React from "react";

const UserStatusIndicator = ({ status, size = "small", showText = false }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "#22c55e";
      case "idle":
      case "away":
        return "#f59e0b";
      case "dnd":
      case "busy":
        return "#ef4444";
      case "offline":
      default:
        return "#6b7280";
    }
  };

  const getStatusGradient = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "linear-gradient(135deg, #22c55e 60%, #16a34a 100%)";
      case "idle":
      case "away":
        return "linear-gradient(135deg, #fbbf24 60%, #f59e0b 100%)";
      case "dnd":
      case "busy":
        return "linear-gradient(135deg, #ef4444 60%, #b91c1c 100%)";
      case "offline":
      default:
        return "linear-gradient(135deg, #6b7280 60%, #374151 100%)";
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
    size === "large" ? "14px" : size === "medium" ? "11px" : "9px";
  const borderWidth =
    size === "large" ? "3px" : size === "medium" ? "2px" : "2px";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: showText ? "7px" : "0",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: getStatusGradient(status),
          border: `${borderWidth} solid #23272a`,
          boxShadow:
            status?.toLowerCase() === "online"
              ? "0 0 0 0 #22c55e80"
              : "0 1px 4px 0 rgba(0,0,0,0.12)",
          display: "inline-block",
          position: "relative",
          animation:
            status?.toLowerCase() === "online"
              ? "statusPulse 1.5s infinite cubic-bezier(.66,0,0,1)"
              : "none",
          boxSizing: "border-box",
        }}
        title={getStatusText(status)}
      />
      {showText && (
        <span
          style={{
            fontSize: "13px",
            color: getStatusColor(status),
            fontWeight: "500",
            letterSpacing: "0.01em",
            textShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          {getStatusText(status)}
        </span>
      )}
      <style>{`
        @keyframes statusPulse {
          0% { box-shadow: 0 0 0 0 #22c55e40; }
          70% { box-shadow: 0 0 0 6px #22c55e00; }
          100% { box-shadow: 0 0 0 0 #22c55e00; }
        }
      `}</style>
    </div>
  );
};

export default UserStatusIndicator;
