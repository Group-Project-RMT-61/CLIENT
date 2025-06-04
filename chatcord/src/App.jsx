import { BrowserRouter, Routes, Route } from "react-router";
import {
  AuthProvider,
  ChatProvider,
  RoomProvider,
  UserProvider,
} from "./contexts";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <RoomProvider>
          <UserProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </BrowserRouter>
          </UserProvider>
        </RoomProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
