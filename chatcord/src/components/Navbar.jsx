export default function Navbar({ onLogout }) {
  return (
    <div
      style={{
        padding: "20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          💬
        </div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
          ChatCord
        </h2>
      </div>
      <button
        onClick={onLogout}
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "none",
          borderRadius: "8px",
          padding: "8px 12px",
          color: "white",
          cursor: "pointer",
          fontSize: "12px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 0.1)";
        }}
      >
        Logout
      </button>
    </div>
  );
}
