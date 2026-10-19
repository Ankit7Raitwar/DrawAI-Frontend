import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket, { connectAuthenticatedSocket } from "../socket";
import PlayerAvatar from "../components/PlayerAvatar";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://drawai-backend.onrender.com")
).replace(/\/+$/, "");

const fetchLeaderboard = async () => {
  const response = await fetch(`${API_URL}/api/leaderboard`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to load leaderboard.");
  }
  return data.leaderboard;
};

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      try {
        const rows = await fetchLeaderboard();
        if (active) {
          setLeaderboard(rows);
          setLeaderboardError("");
        }
      } catch (loadError) {
        if (active) setLeaderboardError(loadError.message);
      } finally {
        if (active) setLeaderboardLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.message || "Please log in again.");
          }
          if (active) {
            setUser(data.user);
            setUsername(data.user.username);
            setProfileUsername(data.user.username);
            setProfileAvatarUrl(data.user.avatarUrl || "");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
        });
    }

    loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  const handleAuthenticate = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const credentials = { username, password };
      if (authMode === "register") credentials.email = email;
      const response = await fetch(`${API_URL}/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to authenticate.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      setUsername(data.user.username);
      setUser(data.user);
      setProfileUsername(data.user.username);
      setProfileAvatarUrl(data.user.avatarUrl || "");
      setPassword("");
      connectAuthenticatedSocket();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: profileUsername,
          avatarUrl: profileAvatarUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update your profile.");
      }
      setUser(data.user);
      setUsername(data.user.username);
      localStorage.setItem("username", data.user.username);
      setProfileEditing(false);
      socket.disconnect();
      connectAuthenticatedSocket();
    } catch (profileError) {
      setError(profileError.message);
    } finally {
      setLoading(false);
    }
  };

  const authorizedFetch = async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to complete your request.");
    }
    return data;
  };

  const handleCreateRoom = async () => {
    setError("");
    try {
      setLoading(true);
      const data = await authorizedFetch("/api/rooms/create", {});
      navigate(`/room/${data.room.roomCode}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setError("");
    if (!roomCode.trim()) {
      setError("Please enter a room code.");
      return;
    }
    try {
      setLoading(true);
      const data = await authorizedFetch("/api/rooms/join", {
        roomCode: roomCode.trim().toUpperCase(),
      });
      navigate(`/room/${data.room.roomCode}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (logoutError) {
      setError(logoutError.message || "Unable to contact the server. Logged out locally.");
    } finally {
      socket.disconnect();
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setUser(null);
      setPassword("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
          <section className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
              Real-time multiplayer drawing game
            </div>
            <h1 className="text-6xl font-black tracking-tight">
              Draw<span className="text-blue-500">AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
              Draw, guess and compete with friends. Track your wins, average
              score, and rank against other players.
            </p>

            {user && (
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      username={user.username}
                      avatarUrl={user.avatarUrl}
                      size="large"
                    />
                    <div>
                      <p className="text-sm text-slate-400">Signed in as</p>
                      <h2 className="text-xl font-bold">{user.username}</h2>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileUsername(user.username);
                      setProfileAvatarUrl(user.avatarUrl || "");
                      setProfileEditing(!profileEditing);
                      setError("");
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  >
                    {profileEditing ? "Cancel edit" : "Edit profile"}
                  </button>
                </div>
                {profileEditing && (
                  <form className="mt-5 space-y-3" onSubmit={handleProfileUpdate}>
                    <label className="block text-sm text-slate-300">
                      Username
                      <input
                        value={profileUsername}
                        onChange={(event) => setProfileUsername(event.target.value)}
                        minLength={3}
                        maxLength={20}
                        required
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Profile picture URL
                      <input
                        type="url"
                        value={profileAvatarUrl}
                        onChange={(event) => setProfileAvatarUrl(event.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        maxLength={2048}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </label>
                    <button
                      disabled={loading}
                      className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save profile"}
                    </button>
                  </form>
                )}
                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Your game stats</p>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-800 p-3">
                    <p className="text-xl font-black">{user.gamesPlayed}</p>
                    <p className="mt-1 text-xs text-slate-400">Games</p>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3">
                    <p className="text-xl font-black">{user.winPercentage}%</p>
                    <p className="mt-1 text-xs text-slate-400">Win rate</p>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3">
                    <p className="text-xl font-black">{user.averageScore}</p>
                    <p className="mt-1 text-xs text-slate-400">Avg. score</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
            {!user ? (
              <>
                <h2 className="text-2xl font-bold">
                  {authMode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-2 text-slate-400">
                  {authMode === "login"
                    ? "Log in to play and save your stats."
                    : "Register to save your game history and stats."}
                </p>
                <form onSubmit={handleAuthenticate}>
                  <label className="mt-6 block text-sm text-slate-300">
                    Username
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="3–20 letters, numbers, or underscores"
                      autoComplete="username"
                      minLength={3}
                      maxLength={20}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </label>
                  {authMode === "register" && (
                    <label className="mt-4 block text-sm text-slate-300">
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        maxLength={254}
                        required
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </label>
                  )}
                  <label className="mt-4 block text-sm text-slate-300">
                    Password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      maxLength={128}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </label>
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}
                  <button
                    disabled={loading}
                    className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Please wait..."
                      : authMode === "login"
                        ? "Log In"
                        : "Register"}
                  </button>
                </form>
                <button
                  onClick={() => {
                    setError("");
                    setEmail("");
                    setAuthMode(authMode === "login" ? "register" : "login");
                  }}
                  className="mt-4 w-full text-sm text-blue-300 hover:text-blue-200"
                >
                  {authMode === "login"
                    ? "New here? Create an account"
                    : "Already registered? Log in"}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Play a game</h2>
                <p className="mt-2 text-slate-400">
                  Create a private room or join a friend.
                </p>
                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <button
                  disabled={loading}
                  onClick={handleCreateRoom}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
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
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 uppercase tracking-widest outline-none focus:border-blue-500"
                />
                <button
                  disabled={loading}
                  onClick={handleJoinRoom}
                  className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Join Room
                </button>
              </>
            )}
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
                Global standings
              </p>
              <h2 className="mt-1 text-2xl font-black">Leaderboard</h2>
            </div>
            <button
              onClick={() => navigate("/leaderboard")}
              className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
            >
              View full dashboard
            </button>
          </div>
          {leaderboardError ? (
            <p className="mt-5 text-sm text-red-300">
              {leaderboardError} Check that the backend is running at {API_URL}.
            </p>
          ) : leaderboardLoading ? (
            <p className="mt-5 text-slate-400">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="mt-5 text-slate-400">No completed games yet. Be the first to play!</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Rank</th>
                    <th className="px-3 py-3">Player</th>
                    <th className="px-3 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => (
                    <tr key={player._id} className="border-t border-slate-800">
                      <td className="px-3 py-3 font-bold text-yellow-300">
                        #{player.rank}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-3 font-semibold">
                          <PlayerAvatar
                            username={player.username}
                            avatarUrl={player.avatarUrl}
                          />
                          {player.username}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-blue-300">
                        {(player.points ?? player.totalScore ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Home;
