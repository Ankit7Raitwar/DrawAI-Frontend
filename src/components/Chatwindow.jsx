import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function Chatwindow({ roomCode, username, isActive }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleMessage = (newMessage) => {
      setMessages((currentMessages) => [...currentMessages, newMessage]);
      setError("");
    };

    const handleError = (data) => {
      setError(data.message || "Unable to send your guess.");
    };

    socket.on("chat-message", handleMessage);
    socket.on("chat-error", handleError);

    return () => {
      socket.off("chat-message", handleMessage);
      socket.off("chat-error", handleError);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();

    if (!cleanMessage || !isActive) {
      return;
    }

    setError("");
    socket.emit("chat-message", {
      roomCode,
      username,
      message: cleanMessage,
    });
    setMessage("");
  };

  return (
    <aside className="flex min-h-[360px] flex-col rounded-2xl bg-slate-900 p-4 xl:min-h-[500px]">
      <h2 className="mb-3 text-lg font-bold">Guess chat</h2>

      <div
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-950/70 p-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Send a guess for everyone in the room to see.
          </p>
        ) : (
          messages.map((chatMessage) => (
            <p key={chatMessage.id} className="break-words text-sm">
              <span className="font-semibold text-blue-300">
                {chatMessage.username}
              </span>
              <span className="text-slate-400">: </span>
              {chatMessage.message}
            </p>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <label htmlFor="guess-message" className="sr-only">
          Type your guess
        </label>
        <input
          id="guess-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={200}
          disabled={!isActive}
          placeholder={isActive ? "Type your guess..." : "Chat is closed"}
          className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!isActive || !message.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
}

export default Chatwindow;