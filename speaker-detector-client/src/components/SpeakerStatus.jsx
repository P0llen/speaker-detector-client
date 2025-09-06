import React, { useState, useEffect, useRef } from "react";
import { useSpeakerDetection } from "../hooks/useSpeakerDetection";

import useListeningMode from "../hooks/useListeningMode";
import { CLIENT_VERSION } from "../lib/constants";
import { withBase } from "../lib/apiBase";
import MicStatus from "./MicStatus"; // ⬅️ unified status component

const SpeakerStatus = ({
  // legacy props ignored; backend controls tuning now
} = {}) => {

  // Backend-controlled settings (via hook)
  const {
    mode: listeningMode,
    setMode: setListeningMode,
    intervalMs,
    threshold,
    sessionLogging,
    setSessionLogging,
    syncing,
  } = useListeningMode("off");

  // Responsive layout: switch to single column when container is narrow
  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setIsNarrow(e.contentRect.width < 720);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const [sessionId, setSessionId] = useState(null);

  const genSessionId = () => {
    const host = (typeof window !== 'undefined' && window.location && window.location.host)
      ? String(window.location.host).replace(/[^a-zA-Z0-9.-]/g, '_')
      : 'unknown-host';
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = Math.random().toString(36).slice(2, 8);
    return `sdc-web_v${CLIENT_VERSION}_${host}_${ts}_${rand}`;
  };

  useEffect(() => {
    if (sessionLogging && listeningMode !== 'off' && !sessionId) {
      setSessionId(genSessionId());
    }
    if (listeningMode === 'off' && sessionId) {
      setSessionId(null);
    }
  }, [sessionLogging, listeningMode]);

  const { speaker, confidence, isSpeaking, error, status, backendOnline, altSpeaker, altConfidence } =
    useSpeakerDetection({
      log: true,
      logOnChangeOnly: true,
      // frontend no longer tunes; rely on backend
      mode: listeningMode,
      intervalMs,
      threshold,
      sid: sessionLogging ? sessionId : null,
    });

  const [backendVersion, setBackendVersion] = useState(null);
  // --- Fetch helpers ---

  const fetchBackendVersion = () => {
    fetch(withBase(`/api/version`))
      .then((res) => res.json())
      .then((data) => setBackendVersion(data.version))
      .catch(() => setBackendVersion(null));
  };

  useEffect(() => {
    fetchBackendVersion();
  }, []);

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
    <div className="speaker-status-panel" ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h4 className="speaker-heading" style={{ margin: 0 }}>🔊 Speaker Status</h4>
      </div>

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

      <div style={{ display: 'grid', gap: 32, gridTemplateColumns: isNarrow ? '1fr' : '2fr 1fr' }}>
        {/* Left column: read-only mic + controls */}
        <div>
          <MicStatus
            backendOnline={backendOnline}
            status={status}
            listeningMode={listeningMode}
            isSpeaking={isSpeaking}
          />
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            <strong>Mode:</strong> {listeningMode} &nbsp;|&nbsp; <strong>Interval:</strong> {intervalMs} ms &nbsp;|&nbsp; <strong>Threshold:</strong> {typeof threshold === 'number' ? threshold.toFixed(2) : '—'}
            {syncing && (
              <span style={{ marginLeft: 8, fontStyle: 'italic' }}>syncing…</span>
            )}
          </div>
          
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div role="group" aria-label="Detection Mode" style={{ display: 'inline-flex', gap: 6 }}>
              <button onClick={() => setListeningMode('off')} disabled={listeningMode === 'off'} title="Stop detection">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: '#c62828', borderRadius: 2, marginRight: 6, verticalAlign: -1 }} />
                Off
              </button>
              <button onClick={() => { if (sessionLogging && !sessionId) setSessionId(genSessionId()); setListeningMode('single'); }} disabled={listeningMode === 'single'} title="Start detection (single mode)">
                ▶️ Single
              </button>
              <button onClick={() => { if (sessionLogging && !sessionId) setSessionId(genSessionId()); setListeningMode('multi'); }} disabled={listeningMode === 'multi'} title="Start detection (multi mode)">
                ▶️ Multi
              </button>
            </div>
            <label style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }} title="When enabled, tag polls with a session id and request backend session logging">
              <input
                type="checkbox"
                checked={!!sessionLogging}
                onChange={(e) => {
                  const next = e.target.checked;
                  setSessionLogging(next);
                  if (next && listeningMode !== 'off' && !sessionId) {
                    setSessionId(genSessionId());
                  }
                }}
              />
              Session logging
            </label>
          </div>
          {sessionLogging && sessionId && (
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              <strong>Session ID:</strong> {sessionId}
            </div>
          )}
        </div>

        {/* Right column: output */}
        <div>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>
            Status: {status} {isSpeaking ? '• speaking' : ''}
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Detected Speaker</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>
              {speaker || 'None'}
              {altSpeaker && (!speaker || speaker === 'unknown') && (
                <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 8, opacity: 0.8 }}>
                  Suggestion: {altSpeaker}{typeof altConfidence === 'number' ? ` (${Math.round(altConfidence * 100)}%)` : ''}
                </span>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 16 }}>
              <strong>Confidence:</strong> {confidence !== null ? `${Math.round(confidence * 100)}%` : 'N/A'}
            </div>
            {altSpeaker && (
              <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
                <span style={{ fontWeight: 600 }}>Suggestion:</span>{' '}
                {altSpeaker} {typeof altConfidence === 'number' ? `(${Math.round(altConfidence * 100)}%)` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SpeakerStatus;
