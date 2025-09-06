// hooks/useListeningMode.js
import { useState, useEffect, useRef } from "react";
import { withBase } from "../lib/apiBase";

// Updated safe fallback based on backend defaults
const FALLBACK_DEFAULTS = { threshold: 0.38, interval_ms: 4000 };

export default function useListeningMode(initial = "off") {
  const [mode, setMode] = useState(initial);
  const [intervalMs, setIntervalMs] = useState(FALLBACK_DEFAULTS.interval_ms);
  // Keep a local threshold only for client-side gating compatibility
  const [threshold, setThreshold] = useState(FALLBACK_DEFAULTS.threshold);

  const [defaults, setDefaults] = useState(FALLBACK_DEFAULTS);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [sessionLogging, setSessionLogging] = useState(false);

  const readyRef = useRef(false); // block POSTs until we hydrate

  // 1) Hydrate from backend (current + defaults if available)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(withBase(`/api/listening-mode`), {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch listening mode");
        const data = await res.json();

        if (cancelled) return;

        // current state
        setMode(data.mode ?? initial);
        setIntervalMs(
          typeof data.interval_ms === "number"
            ? data.interval_ms
            : FALLBACK_DEFAULTS.interval_ms
        );
        // Prefer new API field spk_threshold; fall back to threshold
        const spkTh =
          typeof data.spk_threshold === "number"
            ? data.spk_threshold
            : typeof data.threshold === "number"
            ? data.threshold
            : FALLBACK_DEFAULTS.threshold;
        setThreshold(spkTh);
        setSessionLogging(Boolean(data.session_logging));

        // defaults (optional on server; fall back if missing)
        const serverDefaults = {
          interval_ms:
            data.defaults && typeof data.defaults.interval_ms === "number"
              ? data.defaults.interval_ms
              : FALLBACK_DEFAULTS.interval_ms,
          threshold:
            data.defaults && typeof data.defaults.spk_threshold === "number"
              ? data.defaults.spk_threshold
              : typeof data.defaults?.threshold === "number"
              ? data.defaults.threshold
              : FALLBACK_DEFAULTS.threshold,
        };
        setDefaults(serverDefaults);

        setError(null);
      } catch (err) {
        console.error("❌ Failed to hydrate listening mode:", err);
        setError(err.message);
        // keep FALLBACK_DEFAULTS; UI still usable
      } finally {
        readyRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initial]);

  // 2) Updating mode or logging triggers immediate POST; backend owns tuning
  useEffect(() => {
    if (!readyRef.current) return;

    (async () => {
      try {
        setSyncing(true);
        const res = await fetch(withBase(`/api/listening-mode`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, session_logging: sessionLogging }),
        });
        let json = null;
        try { json = await res.json(); } catch {}
        if (!res.ok) throw new Error(json?.error || "Failed to update mode");

        setError(null);
      } catch (err) {
        console.error("❌ Failed to update mode:", err);
        setError(err.message);
      } finally {
        setSyncing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionLogging]);

  // Read-only client; provide setters for compatibility but do not auto-POST
  const resetToDefaults = () => {
    setIntervalMs(defaults.interval_ms);
    setThreshold(defaults.threshold);
  };

  return {
    mode,
    setMode,
    intervalMs,
    setIntervalMs,
    threshold,
    setThreshold,
    defaults,
    resetToDefaults,
    sessionLogging,
    setSessionLogging,
    error,
    syncing,
  };
}
