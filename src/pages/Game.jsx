import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket, { connectAuthenticatedSocket } from "../socket";
import DrawingCanvas from "../components/DrawingCanvas";
import Chatwindow from "../components/Chatwindow";

function Game() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [players, setPlayers] = useState([]);
  const [currentDrawer, setCurrentDrawer] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);
  const [wordOptions, setWordOptions] = useState([]);
  const [selectedWord, setSelectedWord] = useState("");
  const [wordLength, setWordLength] = useState(0);
  const [maskedWord, setMaskedWord] = useState("");
  const [status, setStatus] = useState("playing");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [finalWinners, setFinalWinners] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);

  useEffect(() => {
    if (!roomCode || !username) {
      navigate("/");
      return;
    }
    if (!localStorage.getItem("token")) {
      navigate("/", { replace: true });
      return;
    }

    const handleGameState = (gameData) => {
      setPlayers(gameData.players || []);
      setCurrentDrawer(gameData.currentDrawer || "");
      setTimeLeft(gameData.timeLeft ?? 60);
      setRound(gameData.round ?? 1);
      setTotalRounds(gameData.totalRounds ?? 10);
      setGameSettings(gameData.settings || null);
      setStatus(gameData.status || "playing");
      setMaskedWord(gameData.maskedWord || "");
      setWordLength(gameData.maskedWord?.length || 0);
      setResult(gameData.result || null);
    };

    const handleGameStarted = (gameData) => {
      setWordOptions([]);
      setSelectedWord("");
      setWordLength(0);
      setMaskedWord("");
      setError("");
      handleGameState(gameData);
    };

    const handleWordOptions = (data) => {
      setWordOptions(data.words || []);
      setSelectedWord("");
    };

    const handleWordSelected = (data) => {
      setWordLength(data.wordLength || 0);
      setMaskedWord(data.maskedWord || "");
      setTimeLeft(data.timeLeft ?? 60);
      setStatus(data.status || "playing");
      setWordOptions([]);
    };

    const handleWordRevealed = (data) => {
      setMaskedWord(data.maskedWord || "");
    };

    const handleGameTimer = (data) => {
      setTimeLeft(data.timeLeft ?? 0);
    };

    const handleGameEnded = (data) => {
      setPlayers(data.players || []);
      setTimeLeft(data.timeLeft ?? 0);
      setMaskedWord(data.maskedWord || "");
      setStatus(data.status || "round-over");
      setResult(data.result || null);
      setWordOptions([]);
    };

    const handleGameFinished = (data) => {
      setPlayers(data.players || []);
      setRound(data.round ?? 10);
      setTotalRounds(data.totalRounds ?? 10);
      setFinalWinners(data.winners || []);
      setResult(data.result || null);
      setStatus("finished");
      setWordOptions([]);
    };

    const handleYourWord = (data) => {
      setSelectedWord(data.word || "");
    };

    const handleGameError = (data) => {
      setError(data.message || "Game error");
    };
    const handleSocketError = (socketError) => {
      setError(socketError.message || "Unable to connect. Please log in again.");
    };

    socket.on("game-state", handleGameState);
    socket.on("game-started", handleGameStarted);
    socket.on("word-options", handleWordOptions);
    socket.on("word-selected", handleWordSelected);
    socket.on("word-revealed", handleWordRevealed);
    socket.on("game-timer", handleGameTimer);
    socket.on("game-ended", handleGameEnded);
    socket.on("game-finished", handleGameFinished);
    socket.on("your-word", handleYourWord);
    socket.on("game-error", handleGameError);
    socket.on("connect_error", handleSocketError);

    const joinGameRoom = () => {
      socket.emit("join-room", { roomCode }, (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join this game.");
          return;
        }

        socket.emit("get-game-state", { roomCode });
      });
    };

    socket.on("connect", joinGameRoom);
    connectAuthenticatedSocket();
    if (socket.connected) {
      joinGameRoom();
    }

    return () => {
      socket.off("game-state", handleGameState);
      socket.off("game-started", handleGameStarted);
      socket.off("word-options", handleWordOptions);
      socket.off("word-selected", handleWordSelected);
      socket.off("word-revealed", handleWordRevealed);
      socket.off("game-timer", handleGameTimer);
      socket.off("game-ended", handleGameEnded);
      socket.off("game-finished", handleGameFinished);
      socket.off("your-word", handleYourWord);
      socket.off("game-error", handleGameError);
      socket.off("connect_error", handleSocketError);
      socket.off("connect", joinGameRoom);
    };
  }, [roomCode, username, navigate]);

  const isDrawer = username === currentDrawer;
  const currentDrawerIndex = players.findIndex(
    (player) => player.username === currentDrawer
  );
  const nextDrawer =
    currentDrawerIndex >= 0 && players.length > 0
      ? players[(currentDrawerIndex + 1) % players.length]?.username
      : "";
  const rankedPlayers = [...players].sort(
    (first, second) => (second.score ?? 0) - (first.score ?? 0)
  );
  const categoryLabels = {
    animals: "Animals",
    food: "Food",
    fruits: "Fruits",
    objects: "Objects",
    nature: "Nature",
    sports: "Sports",
    vehicles: "Vehicles",
    places: "Places",
    professions: "Professions",
  };

  const chooseWord = (word) => {
    socket.emit("select-word", {
      roomCode,
      username,
      word,
    });
  };

  const startNextRound = () => {
    setError("");
    socket.emit("new-game", {
      roomCode,
      username,
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">
              Draw<span className="text-blue-500">AI</span>
            </h1>
            <p className="text-sm text-slate-500">
              Room {roomCode}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl bg-slate-900 px-4 py-2">
              Round {round}/{totalRounds}
            </div>

            <div className="rounded-xl bg-yellow-400/10 px-4 py-2 font-bold text-yellow-300">
              {timeLeft}s
            </div>
          </div>
        </header>

        {gameSettings && (
          <p className="mb-5 text-sm text-slate-400">
            Rules: {gameSettings.minWordLength}–{gameSettings.maxWordLength} letters
            {" · "}
            {gameSettings.categories
              .map((category) => categoryLabels[category] || category)
              .join(", ")}
          </p>
        )}

        {status === "round-over" && (
          <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5">
            <div>
              <h2 className="text-xl font-black text-blue-200">
                {result?.winner
                  ? `${result.winner} guessed correctly!`
                  : "Time is up!"}
              </h2>
              <p className="mt-1 text-slate-300">
                The word was{" "}
                <span className="font-bold">{result?.word}</span>.{" "}
                {round} of {totalRounds} rounds complete.
              </p>
              {nextDrawer && (
                <p className="mt-1 text-slate-300">
                  {nextDrawer} draws next.
                </p>
              )}
            </div>

            {round < totalRounds && username === nextDrawer ? (
              <button
                onClick={startNextRound}
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500"
              >
                Start Your Round
              </button>
            ) : round < totalRounds ? (
              <p className="text-sm text-slate-400">
                Waiting for {nextDrawer} to start the next round...
              </p>
            ) : null}
          </section>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
          <aside className="rounded-2xl bg-slate-900 p-4">
            <h2 className="mb-4 text-lg font-bold">
              Players
            </h2>

            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.username}
                  className="flex items-center justify-between rounded-xl bg-slate-800 p-3"
                >
                  <span>
                    {player.username}
                    {player.username === username && (
                      <span className="ml-2 text-xs text-blue-400">
                        You
                      </span>
                    )}
                  </span>

                  <span className="font-bold text-yellow-300">
                    {player.score ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <section>
            <div className="mb-4 rounded-2xl bg-slate-900 p-4">
              {status === "round-over" ? (
                <p className="text-slate-300">Round complete</p>
              ) : isDrawer ? (
                <div>
                  <p className="text-green-400">
                    🎨 You are drawing
                  </p>

                  {selectedWord && (
                    <p className="mt-2 text-2xl font-black">
                      {selectedWord}
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  🎯{" "}
                  <span className="font-bold text-blue-400">
                    {currentDrawer}
                  </span>{" "}
                  is drawing
                </p>
              )}
            </div>

            {isDrawer && wordOptions.length > 0 && (
              <div className="mb-4 rounded-2xl border border-blue-500/20 bg-slate-900 p-5">
                <h2 className="mb-4 text-lg font-bold">
                  Choose a word
                </h2>

                <div className="flex flex-wrap gap-3">
                  {wordOptions.map((word) => (
                    <button
                      key={word}
                      onClick={() => chooseWord(word)}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isDrawer && wordLength > 0 && (
              <div className="mb-4 text-center">
                <p className="text-sm text-slate-500">
                  Guess the word
                </p>

                <p className="mt-2 text-2xl font-black tracking-[0.45em]">
                  {maskedWord.split("").join(" ") || "_ ".repeat(wordLength)}
                </p>
              </div>
            )}

            <DrawingCanvas
              roomCode={roomCode}
              isDrawer={isDrawer && status === "playing"}
            />
          </section>
          <Chatwindow
            roomCode={roomCode}
            username={username}
            isActive={status === "playing"}
          />
        </div>
      </div>

      {status === "finished" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="final-results-title"
            className="my-8 w-full max-w-lg rounded-3xl border border-yellow-400/20 bg-slate-900 p-6 shadow-2xl sm:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
              Game complete
            </p>
            <h2
              id="final-results-title"
              className="mt-2 text-3xl font-black text-white"
            >
              Final scores
            </h2>
            {finalWinners.length === 1 ? (
              <p className="mt-2 text-slate-300">
                {finalWinners[0].username} wins with {finalWinners[0].score} points!
              </p>
            ) : finalWinners.length > 1 ? (
              <p className="mt-2 text-slate-300">
                It&apos;s a tie! {finalWinners.map((winner) => winner.username).join(", ")}{" "}
                finished with {finalWinners[0].score} points.
              </p>
            ) : (
              <p className="mt-2 text-slate-300">The game ended without a winner.</p>
            )}

            <ol className="mt-6 space-y-2">
              {rankedPlayers.map((player, index) => (
                <li
                  key={player.username}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    finalWinners.some((winner) => winner.username === player.username)
                      ? "bg-yellow-400/10 text-yellow-100"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <span>
                    <span className="mr-3 text-slate-500">#{index + 1}</span>
                    {player.username}
                  </span>
                  <span className="font-bold">
                    {player.score ?? 0} {player.score === 1 ? "point" : "points"}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-sm text-slate-400">
              The room is closed. Head back to the home screen to play again.
            </p>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500"
            >
              Back to Home
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default Game;
