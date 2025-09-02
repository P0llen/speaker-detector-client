// hooks/useListeningMode.js
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/constants";

// Safe fallback if backend doesn't return defaults
const FALLBACK_DEFAULTS = { threshold: 0.75, interval_ms: 3000 };

export default function useListeningMode(initial = "off") {
  const [mode, setMode] = useState(initial);
  const [intervalMs, setIntervalMs] = useState(FALLBACK_DEFAULTS.interval_ms);
  const [threshold, setThreshold] = useState(FALLBACK_DEFAULTS.threshold);

  const [defaults, setDefaults] = useState(FALLBACK_DEFAULTS);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const readyRef = useRef(false); // block POSTs until we hydrate

  // 1) Hydrate from backend (current + defaults if available)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/listening-mode`, {
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
        setThreshold(
          typeof data.threshold === "number"
            ? data.threshold
            : FALLBACK_DEFAULTS.threshold
        );

        // defaults (optional on server; fall back if missing)
        const serverDefaults = {
          interval_ms:
            data.defaults && typeof data.defaults.interval_ms === "number"
              ? data.defaults.interval_ms
              : FALLBACK_DEFAULTS.interval_ms,
          threshold:
            data.defaults && typeof data.defaults.threshold === "number"
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

  // 2) Debounced sync for threshold + interval (only after hydrate)
  useEffect(() => {
    if (!readyRef.current) return;

    setSyncing(true);
    const t = setTimeout(() => {
      fetch(`${API_BASE}/api/listening-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, interval_ms: intervalMs, threshold }),
      })
        .catch((err) => {
          console.error("❌ Failed to sync detection settings:", err);
        })
        .finally(() => setSyncing(false));
    }, 300);

    return () => clearTimeout(t);
  }, [intervalMs, threshold, mode]);

  // 3) Updating mode triggers immediate POST (+ optional restart)
  useEffect(() => {
    if (!readyRef.current) return;

    (async () => {
      try {
        setSyncing(true);
        const res = await fetch(`${API_BASE}/api/listening-mode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, interval_ms: intervalMs, threshold }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update mode");

        if (mode !== "off") {
          // best-effort restart; it's fine if the endpoint is a no-op sometimes
          await fetch(`${API_BASE}/api/restart-detection`, {
            method: "POST",
          }).catch(() => {});
        }
        setError(null);
      } catch (err) {
        console.error("❌ Failed to update mode:", err);
        setError(err.message);
      } finally {
        setSyncing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // 4) Reset to backend defaults (and persist)
  const resetToDefaults = async () => {
    setIntervalMs(defaults.interval_ms);
    setThreshold(defaults.threshold);
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/api/listening-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          interval_ms: defaults.interval_ms,
          threshold: defaults.threshold,
        }),
      });
      if (mode !== "off") {
        await fetch(`${API_BASE}/api/restart-detection`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch (err) {
      console.error("❌ Failed to reset to defaults:", err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
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
    error,
    syncing,
  };
}
