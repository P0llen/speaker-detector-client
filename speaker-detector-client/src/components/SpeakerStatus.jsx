import React, { useState, useEffect } from "react";
import { useSpeakerDetection } from "../hooks/useSpeakerDetection";

import useListeningMode from "../hooks/useListeningMode";
import { API_BASE, CLIENT_VERSION } from "../lib/constants";
import MicStatus from "./MicStatus"; // ⬅️ embed the unified status component

const SpeakerStatus = ({ minConfidence, interval } = {}) => {
  // Live detection stream
  const { speaker, confidence, isSpeaking, error, status, backendOnline } =
    useSpeakerDetection({
      minConfidence,
      interval,
      log: true,
    });

  // Backend-controlled settings (via hook)
  const {
    mode: listeningMode,
    setMode: setListeningMode,
    intervalMs,
    setIntervalMs,
    threshold,
    setThreshold,
    syncing,
  } = useListeningMode("off");

  // Local UI state
  const [speakers, setSpeakers] = useState(null);
  const [speakersError, setSpeakersError] = useState(null);
  const [backendVersion, setBackendVersion] = useState(null);
  const [defaults, setDefaults] = useState(null);

  // --- Fetch helpers ---
  const fetchSpeakers = () => {
    setSpeakersError(null);
    fetch(`${API_BASE}/api/speakers`)
      .then((res) => {
        if (!res.ok) throw new Error("Speakers API failed");
        return res.json();
      })
      .then((data) => setSpeakers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("❌ Failed to fetch speakers:", err);
        setSpeakers(null);
        setSpeakersError("Failed to load speakers");
      });
  };

  const fetchBackendVersion = () => {
    fetch(`${API_BASE}/api/version`)
      .then((res) => res.json())
      .then((data) => setBackendVersion(data.version))
      .catch(() => setBackendVersion(null));
  };

  // Hydrate current settings & defaults from backend constants
  const fetchListeningMeta = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/listening-mode`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("listening-mode GET failed");
      const json = await res.json();

      if (json.defaults && typeof json.defaults === "object") {
        setDefaults({
          threshold:
            typeof json.defaults.threshold === "number"
              ? json.defaults.threshold
              : threshold,
          interval_ms:
            typeof json.defaults.interval_ms === "number"
              ? json.defaults.interval_ms
              : intervalMs,
        });
      } else {
        setDefaults({ threshold, interval_ms: intervalMs });
      }
    } catch {
      setDefaults({ threshold, interval_ms: intervalMs });
    }
  };

  useEffect(() => {
    fetchSpeakers();
    fetchBackendVersion();
    fetchListeningMeta();
  }, []);

  const resetToDefaults = () => {
    if (!defaults) return;
    setThreshold(defaults.threshold);
    setIntervalMs(defaults.interval_ms);
  };

  const backendLabel =
    backendOnline === null
      ? "checking…"
      : backendOnline
      ? "online"
      : "unreachable";

  // If backend is truly unreachable and the hook flagged error, show a compact error
  if (error && backendOnline === false) {
    return <p className="speaker-error">❌ {error}</p>;
  }

  return (
    <div className="speaker-status-panel">
      <h4 className="speaker-heading">🔊 Speaker Status</h4>

      <p style={{ marginBottom: 8 }}>
        <strong>Backend:</strong> {backendLabel}
        {backendVersion && (
          <>
            {" "}
            &nbsp;|&nbsp; <strong>Backend v</strong>
            {backendVersion}
          </>
        )}
        &nbsp;|&nbsp; <strong>Client v</strong>
        {CLIENT_VERSION}
      </p>

      {/* Unified mic + engine status */}
      <MicStatus
        backendOnline={backendOnline}
        status={status}
        listeningMode={listeningMode}
        isSpeaking={isSpeaking}
      />

      {/* Listening mode */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <label>
          🎚 Listening Mode:&nbsp;
          <select
            value={listeningMode}
            onChange={(e) => setListeningMode(e.target.value)}
            style={{
              background: "#222",
              color: "#fff",
              borderRadius: 4,
              padding: "4px 6px",
              border: "1px solid #555",
            }}
          >
            <option value="off">🔇 Off</option>
            <option value="single">🧍 Single</option>
            <option value="multi">👥 Multi</option>
          </select>
        </label>
      </div>

      {/* Interval slider */}
      <div style={{ marginBottom: 10 }}>
        <label>
          ⏱ Interval (ms):
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            style={{ width: 260, marginLeft: 8 }}
          />
          <span style={{ marginLeft: 8 }}>{intervalMs} ms</span>
        </label>
        {defaults && (
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            Default: {defaults.interval_ms} ms
          </div>
        )}
      </div>

      {/* Threshold slider */}
      <div style={{ marginBottom: 10 }}>
        <label>
          🧠 Threshold:
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            style={{ width: 260, marginLeft: 8 }}
          />
          <span style={{ marginLeft: 8 }}>{threshold.toFixed(2)}</span>
        </label>
        {defaults && (
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            Default: {defaults.threshold}
          </div>
        )}
      </div>

      <div style={{ margin: "6px 0 14px" }}>
        <button
          onClick={resetToDefaults}
          style={{
            background: "#2a2a2a",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
          }}
          title={
            defaults
              ? `Reset to threshold ${defaults.threshold}, interval ${defaults.interval_ms}ms`
              : "Reset to defaults"
          }
        >
          ♻️ Reset to defaults
        </button>
        {syncing && (
          <span style={{ marginLeft: 10, fontStyle: "italic", color: "#999" }}>
            🔄 Syncing settings…
          </span>
        )}
      </div>

      {/* Pure detection outputs only (no status strings here) */}
      <p style={{ marginTop: 6 }}>
        <strong>Detected Speaker:</strong> {speaker || "None"} <br />
        <strong>Confidence:</strong>{" "}
        {confidence !== null ? `${Math.round(confidence * 100)}%` : "N/A"}
      </p>

      <hr />
      <h5>🧠 Enrolled Speakers</h5>
      {speakersError ? (
        <p style={{ color: "#f55" }}>⚠️ {speakersError}</p>
      ) : speakers === null ? (
        <p style={{ fontStyle: "italic", color: "#aaa" }}>Loading...</p>
      ) : speakers.length === 0 ? (
        <p>No speakers enrolled yet.</p>
      ) : (
        <ul>
          {speakers.map((s) => (
            <li key={s.name}>
              {s.name} ({s.recordings})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SpeakerStatus;
