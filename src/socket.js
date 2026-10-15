import { io } from "socket.io-client";

const socketUrl = "https://drawai-backend.onrender.com"; // import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

const socket = io(socketUrl, {
  autoConnect: true,
});

export default socket;
