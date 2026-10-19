import { useEffect, useState } from "react";

function PlayerAvatar({ username, avatarUrl, size = "normal" }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);
  const dimensions = size === "large" ? "h-14 w-14 text-lg" : "h-9 w-9 text-sm";
  const initials = username?.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={`${username}'s profile`}
        onError={() => setImageFailed(true)}
        className={`${dimensions} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-label={`${username} profile picture`}
      className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-200`}
    >
      {initials}
    </span>
  );
}

export default PlayerAvatar;
