import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlayerAvatar from "../components/PlayerAvatar";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://drawai-backend.onrender.com")
).replace(/\/+$/, "");

const formatPoints = (points) => Number(points || 0).toLocaleString();

function LeaderboardDashboard() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: "10",
          search,
        });
        const response = await fetch(
          `${API_URL}/api/leaderboard/dashboard?${query.toString()}`
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load leaderboard dashboard.");
        }
        if (active) setData(result);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [page, search]);

  const renderPlayerTable = (players, metric, label) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="px-3 py-3">Rank</th>
            <th className="px-3 py-3">Player</th>
            <th className="px-3 py-3 text-right">{label}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player._id} className="border-t border-slate-800">
              <td className="px-3 py-3 font-bold text-yellow-300">#{player.rank}</td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-3 font-medium">
                  <PlayerAvatar
                    username={player.username}
                    avatarUrl={player.avatarUrl}
                  />
                  {player.username}
                </span>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-blue-300">
                {formatPoints(player[metric])}
              </td>
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan="3" className="px-3 py-5 text-center text-slate-400">
                No players to show yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm font-semibold text-blue-300 hover:text-blue-200">
              ← Back to DrawAI
            </Link>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-blue-300">
              Player statistics
            </p>
            <h1 className="mt-1 text-4xl font-black">Leaderboard dashboard</h1>
          </div>
          <p className="text-sm text-slate-400">Ranked by total points and games played</p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error} Check that the backend is running at {API_URL}.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-3">
              <p className="text-sm uppercase tracking-widest text-blue-300">Top points</p>
              <h2 className="text-2xl font-bold">Highest scoring players</h2>
            </div>
            {loading && !data ? (
              <p className="py-5 text-slate-400">Loading leaderboard...</p>
            ) : (
              renderPlayerTable(data?.topPoints || [], "points", "Points")
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-3">
              <p className="text-sm uppercase tracking-widest text-blue-300">Game records</p>
              <h2 className="text-2xl font-bold">Most games played</h2>
            </div>
            {loading && !data ? (
              <p className="py-5 text-slate-400">Loading game records...</p>
            ) : (
              renderPlayerTable(data?.mostPlayed || [], "gamesPlayed", "Games played")
            )}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-300">Directory</p>
              <h2 className="text-2xl font-bold">All players</h2>
            </div>
            <label className="w-full max-w-sm text-sm text-slate-300">
              Search by username
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search players..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3 text-right">Points</th>
                  <th className="px-3 py-3 text-right">Games played</th>
                  <th className="px-3 py-3 text-right">Wins</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((player) => (
                  <tr key={player._id} className="border-t border-slate-800">
                    <td className="px-3 py-3 font-bold text-yellow-300">#{player.rank}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-3 font-medium">
                        <PlayerAvatar
                          username={player.username}
                          avatarUrl={player.avatarUrl}
                        />
                        {player.username}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">{formatPoints(player.points)}</td>
                    <td className="px-3 py-3 text-right">{player.gamesPlayed}</td>
                    <td className="px-3 py-3 text-right">{player.gamesWon}</td>
                  </tr>
                ))}
                {!loading && data?.users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-slate-400">
                      No players match that search.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-slate-400">
                      Loading players...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-400">
              {pagination
                ? `${pagination.totalUsers} players · Page ${pagination.page} of ${Math.max(1, pagination.totalPages)}`
                : " "}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!pagination || page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={!pagination || page >= pagination.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LeaderboardDashboard;
