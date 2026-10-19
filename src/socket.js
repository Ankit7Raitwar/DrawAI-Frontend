import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://drawai-backend.onrender.com");

const socket = io(socketUrl, {
  autoConnect: false,
});

export const connectAuthenticatedSocket = () => {
  socket.auth = { token: localStorage.getItem("token") };
  if (!socket.connected) {
    socket.connect();
  }
};

export default socket;
