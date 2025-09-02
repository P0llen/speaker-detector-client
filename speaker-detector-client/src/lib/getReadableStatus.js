/**
 * Maps `useMicCheck` status to a user-friendly message + emoji.
 *
 * @param {string} status - one of: checking, ok, silent, blocked, none, error
 * @returns {string}
 */
export default function getReadableMicStatus(status) {
  switch ((status || "").trim()) {
    case "checking":
      return "⏳ Checking microphone...";
    case "ok":
      return "✅ Microphone active and detecting sound";
    case "silent":
      return "🤫 Microphone detected but no sound (muted, silent, or virtual)";
    case "blocked":
      return "🚫 Microphone access blocked — allow permissions in browser settings";
    case "none":
      return "❌ No microphone detected — please plug one in";
    case "error":
      return "⚠️ Microphone check failed — check connection or drivers";
    default:
      return "⚠️ Unknown microphone state";
  }
}
