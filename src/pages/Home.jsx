import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://drawai-backend.onrender.com"; // import.meta.env.VITE_API_URL || "http://localhost:8000";
  // import.meta.env.VITE_API_URL || "http://localhost:8000";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveUsername = () => {
    localStorage.setItem("username", username.trim());
  };

  const handleCreateRoom = async () => {
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create room.");
      }

      saveUsername();
      navigate(`/room/${data.room.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          roomCode: roomCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to join room.");
      }

      saveUsername();
      navigate(`/room/${data.room.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
              Real-time multiplayer drawing game
            </div>

            <h1 className="text-6xl font-black tracking-tight">
              Draw<span className="text-blue-500">AI</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
              Draw, guess and compete with friends in real time. AI-powered
              features will make the game smarter as the project grows.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
            <h2 className="text-2xl font-bold">Start playing</h2>
            <p className="mt-2 text-slate-400">
              Enter your name and create or join a private room.
            </p>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              onClick={handleCreateRoom}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Create Room"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
              <div className="h-px flex-1 bg-slate-800" />
              OR
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <input
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase())
              }
              placeholder="Room code"
              maxLength={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 uppercase tracking-widest outline-none focus:border-blue-500"
            />

            <button
              disabled={loading}
              onClick={handleJoinRoom}
              className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Room
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Home;
