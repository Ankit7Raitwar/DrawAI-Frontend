import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Game from "./pages/Game";
import LeaderboardDashboard from "./pages/LeaderboardDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<LeaderboardDashboard />} />
      <Route path="/room/:roomCode" element={<Room />} />
      <Route path="/game/:roomCode" element={<Game />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
