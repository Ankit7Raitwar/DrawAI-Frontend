import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";

const categories = [
  ["animals", "Animals"],
  ["food", "Food"],
  ["fruits", "Fruits"],
  ["objects", "Objects"],
  ["nature", "Nature"],
  ["sports", "Sports"],
  ["vehicles", "Vehicles"],
  ["places", "Places"],
  ["professions", "Professions"],
];

function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState("");
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");
  const [totalRounds, setTotalRounds] = useState(10);
  const [minWordLength, setMinWordLength] = useState(3);
  const [maxWordLength, setMaxWordLength] = useState(8);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map(([value]) => value)
  );
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!roomCode || !username) {
      navigate("/");
      return;
    }

    const handleRoomUpdate = (roomData) => {
      setPlayers(roomData.players || []);
      setHost(roomData.host || "");
      setStatus(roomData.status || "waiting");
    };

    const handleGameStarted = () => {
      navigate(`/game/${roomCode}`);
    };

    const handleRoomError = (data) => {
      setError(data.message || "Room error");
    };

    const handleGameError = (data) => {
      setStarting(false);
      setError(data.message || "Game error");
    };

    socket.on("room-updated", handleRoomUpdate);
    socket.on("game-started", handleGameStarted);
    socket.on("room-error", handleRoomError);
    socket.on("game-error", handleGameError);

    socket.emit("join-room", {
      roomCode,
      username,
    });

    return () => {
      socket.off("room-updated", handleRoomUpdate);
      socket.off("game-started", handleGameStarted);
      socket.off("room-error", handleRoomError);
      socket.off("game-error", handleGameError);
    };
  }, [roomCode, username, navigate]);

  const startGame = () => {
    setError("");
    if (minWordLength > maxWordLength) {
      setError("Minimum word length cannot be greater than the maximum.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Select at least one word category.");
      return;
    }

    setStarting(true);
    socket.emit("start-game", {
      roomCode,
      username,
      settings: {
        totalRounds,
        minWordLength,
        maxWordLength,
        categories: selectedCategories,
      },
    });
  };

  const toggleCategory = (category) => {
    setSelectedCategories((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category]
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">DrawAI Room</p>
            <h1 className="mt-1 text-3xl font-black tracking-widest">
              {roomCode}
            </h1>
          </div>

          <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm">
            Status:{" "}
            <span className="font-semibold text-blue-400">
              {status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Players ({players.length})
            </h2>

            <span className="text-sm text-slate-500">
              You: {username}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <div
                key={player._id || player.username}
                className="flex items-center justify-between rounded-xl bg-slate-800 p-4"
              >
                <span className="font-medium">
                  {player.username}
                </span>

                {player.username === host && (
                  <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {username === host && (
            <>
              <div className="mt-7 border-t border-slate-800 pt-6">
                <h3 className="text-lg font-bold">Game rules</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Choose the rules before starting. They apply to everyone in this room.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm text-slate-300">
                    Number of rounds
                    <select
                      value={totalRounds}
                      onChange={(event) => setTotalRounds(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    >
                      {Array.from({ length: 8 }, (_, index) => index + 3).map((roundCount) => (
                        <option key={roundCount} value={roundCount}>
                          {roundCount} rounds
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm text-slate-300">
                    Minimum word length
                    <select
                      value={minWordLength}
                      onChange={(event) => setMinWordLength(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    >
                      {Array.from({ length: 6 }, (_, index) => index + 3).map((length) => (
                        <option key={length} value={length}>
                          {length} letters
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm text-slate-300">
                    Maximum word length
                    <select
                      value={maxWordLength}
                      onChange={(event) => setMaxWordLength(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    >
                      {Array.from({ length: 6 }, (_, index) => index + 3).map((length) => (
                        <option key={length} value={length}>
                          {length} letters
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold text-slate-300">
                    Word categories
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map(([value, label]) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(value)}
                          onChange={() => toggleCategory(value)}
                          className="accent-blue-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <button
                onClick={startGame}
                disabled={
                  players.length < 2 ||
                  starting ||
                  selectedCategories.length === 0 ||
                  minWordLength > maxWordLength
                }
                className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {players.length < 2
                  ? "Waiting for another player..."
                  : starting
                    ? "Starting game..."
                    : "Start Game"}
              </button>
            </>
          )}

          {username !== host && (
            <p className="mt-7 text-center text-sm text-slate-500">
              The host is choosing the game rules. Waiting for the host to start...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default Room;
