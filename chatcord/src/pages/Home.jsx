import { Navigate, useNavigate } from "react-router";
import Swal from "sweetalert2";

import Navbar from "../components/Navbar";

export default function Home() {
  const navigate = useNavigate();

  const access_token = localStorage.getItem("access_token");

  if (!access_token) {
    return <Navigate to="/login" />;
  }

  const logout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#667eea",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
      }
    });
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        display: "flex",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "white",
      }}
    >

      <div
        style={{
          width: "320px",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar onLogout={logout} />
      </div>
    </div>
  );
}
