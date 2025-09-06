// speaker-detector-client/src/hooks/useSpeakerDetection.js
import { useEffect, useRef, useState } from "react";
import { withBase } from "../lib/apiBase";

export function useSpeakerDetection({
  endpoint = "/api/active-speaker",
  log = true,
  logOnChangeOnly = true,
  minDelta = 0.02,
  smoothing = 1,
  backgroundLabel = null,
  // Provided by parent to ensure a single source of truth
  mode = "off",
  intervalMs = 3000,
  threshold = 0.75,
  sid = null,
} = {}) {
  const minConfidence = threshold;
  const interval = intervalMs;

  const [speaker, setSpeaker] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [altSpeaker, setAltSpeaker] = useState(null);
  const [altConfidence, setAltConfidence] = useState(null);

  const lastAnnouncedNameRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastSampleRef = useRef({ name: null, confidence: null, status: null, isSpeaking: null });
  const confWindowRef = useRef([]);
  const cooldownUntilRef = useRef(0);
  const detectionStateRef = useRef("unknown"); // 'running' | 'stopped' | 'unknown'

  // Backend online indicator via one-time server push (SSE).
  // The backend should send a single event when online and may close.
  useEffect(() => {
    let es;
    try {
      es = new EventSource(withBase(`/api/online`));
      const onMsg = () => {
        setBackendOnline(true);
        // Close after first signal to avoid a long-lived connection.
        try { es.close(); } catch {}
      };
      es.onmessage = onMsg;
      es.addEventListener("online", onMsg);
      es.onerror = () => {
        // Do not flip to false here to avoid churn; polling failures will set false.
      };
    } catch {}
    return () => {
      try { es && es.close && es.close(); } catch {}
    };
  }, []);

  // Detection state SSE: backend pushes 'running' | 'stopped'.
  // Client polls /api/active-speaker only when 'running'.
  useEffect(() => {
    let es;
    try {
      es = new EventSource(withBase(`/api/detection-state`));
      es.onopen = () => setBackendOnline(true);
      const handle = (data) => {
        const raw = (data || "").toString().trim().toLowerCase();
        if (raw === "running") {
          detectionStateRef.current = "running";
        } else if (raw === "stopped") {
          detectionStateRef.current = "stopped";
          setStatus("pending");
          setSpeaker(null);
          setConfidence(null);
          setIsSpeaking(false);
        }
      };
      es.onmessage = (e) => handle(e.data);
      es.addEventListener("detection", (e) => handle(e.data));
      es.onerror = () => {
        // Keep state; network failures will be reflected by fetch paths.
      };
    } catch {}
    return () => {
      try { es && es.close && es.close(); } catch {}
    };
  }, []);

  useEffect(() => {
    let id,
      cancelled = false;
    const poll = async () => {
      if (Date.now() < cooldownUntilRef.current) return;
      if (mode === "off") {
        setStatus("disabled");
        setSpeaker(null);
        setConfidence(null);
        setIsSpeaking(false);
        return;
      }
      if (detectionStateRef.current === "stopped") {
        // Engine explicitly reported as stopped via SSE
        setStatus("pending");
        setSpeaker(null);
        setConfidence(null);
        setIsSpeaking(false);
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const hasQ = endpoint.includes("?");
        const url = `${endpoint}${sid ? (hasQ ? "&" : "?") + "sid=" + encodeURIComponent(sid) : ""}`;
        const r = await fetch(withBase(url), { cache: "no-store" });
        if (!r.ok) {
          // Server reachable but not ready or error
          if (r.status === 503) {
            setBackendOnline(true);
            setStatus("pending"); // engine awaiting data
            setSpeaker(null);
            setConfidence(null);
            setIsSpeaking(false);
            // Back off a bit to reduce repeated 503s
            const wait = Math.max(1500, (interval || 3000));
            cooldownUntilRef.current = Date.now() + wait;
          } else {
            setBackendOnline(true);
            setStatus("error");
            setSpeaker(null);
            setConfidence(null);
            setIsSpeaking(false);
            // Brief backoff on other errors
            cooldownUntilRef.current = Date.now() + 1500;
          }
          return;
        }
        const d = await r.json();
        // Any successful response from backend implies it's reachable
        setBackendOnline(true);
        // Any successful response from backend implies it's reachable
        setBackendOnline(true);
        if (cancelled) return;

        const rawSpeaker = d.speaker ?? null;
        const rawConfidence =
          typeof d.confidence === "number" ? d.confidence : null;
        const backendIsSpeaking =
          typeof d.is_speaking === "boolean" ? d.is_speaking : null;
        const stateStatus = (d.status || "pending").trim();

        // Optional suggested candidate from backend (supporting multiple shapes)
        let altName = null;
        let altConf = null;
        const pickFromObj = (obj) => {
          if (!obj || typeof obj !== "object") return { name: null, conf: null };
          const name = obj.speaker || obj.name || obj.label || null;
          const confVal = obj.confidence ?? obj.score ?? obj.probability;
          const conf = typeof confVal === "number" ? confVal : null;
          return { name, conf };
        };
        if (d && typeof d === "object") {
          if (d.suggested !== undefined) {
            const s = d.suggested;
            if (Array.isArray(s)) {
              const top = s[0];
              const { name, conf } = pickFromObj(top);
              altName = typeof top === "string" ? top : name;
              altConf = typeof top === "object" ? conf : null;
            } else if (typeof s === "string") {
              altName = s;
              altConf = null;
            } else {
              const { name, conf } = pickFromObj(s);
              altName = name;
              altConf = conf;
            }
          } else if (d.candidate) {
            const { name, conf } = pickFromObj(d.candidate);
            altName = name;
            altConf = conf;
          } else if (Array.isArray(d.suggestions)) {
            const { name, conf } = pickFromObj(d.suggestions[0]);
            altName = name;
            altConf = conf;
          }
        }

        // optional smoothing for confidence
        let smoothed = rawConfidence;
        if (typeof rawConfidence === "number" && smoothing > 1) {
          const w = confWindowRef.current;
          w.push(rawConfidence);
          if (w.length > smoothing) w.shift();
          smoothed = w.reduce((a, b) => a + b, 0) / w.length;
        }
        const nextConfidence = smoothed;

        setStatus(stateStatus);
        setSpeaker(rawSpeaker);
        setConfidence(nextConfidence);
        setAltSpeaker(altName);
        setAltConfidence(altConf);

        const knownEnough =
          rawSpeaker &&
          rawSpeaker !== "unknown" &&
          (backgroundLabel ? rawSpeaker !== backgroundLabel : true) &&
          (nextConfidence ?? 0) >= (minConfidence ?? 0.5);

        const computedIsSpeaking =
          backendIsSpeaking !== null ? backendIsSpeaking : knownEnough;
        setIsSpeaking(computedIsSpeaking);

        // events
        window.dispatchEvent(
          new CustomEvent("speaker:update", {
            detail: {
              name: rawSpeaker,
              confidence: nextConfidence,
              isSpeaking: computedIsSpeaking,
              status: stateStatus,
              backendOnline: backendOnline !== false,
              ts: Date.now(),
            },
          })
        );

        if (knownEnough) {
          if (lastAnnouncedNameRef.current !== rawSpeaker) {
            window.dispatchEvent(
              new CustomEvent("speaker:identified", {
                detail: {
                  name: rawSpeaker,
                  confidence: nextConfidence,
                  status: stateStatus,
                  ts: Date.now(),
                },
              })
            );
            lastAnnouncedNameRef.current = rawSpeaker;
          }
        } else if (lastAnnouncedNameRef.current) {
          window.dispatchEvent(
            new CustomEvent("speaker:cleared", {
              detail: {
                previous: lastAnnouncedNameRef.current,
                to: rawSpeaker || "unknown",
                status: stateStatus,
                confidence: nextConfidence ?? 0,
                ts: Date.now(),
              },
            })
          );
          lastAnnouncedNameRef.current = null;
        }

        if (log) {
          const last = lastSampleRef.current;
          const changedName = last.name !== rawSpeaker;
          const changedStatus = last.status !== stateStatus;
          const changedSpeaking = last.isSpeaking !== computedIsSpeaking;
          const delta = Math.abs((nextConfidence || 0) - (last.confidence || 0));
          const shouldLog = !logOnChangeOnly || changedName || changedStatus || changedSpeaking || delta >= minDelta;
          if (shouldLog) {
            const pct = Math.round((nextConfidence || 0) * 100);
            console.log(
              `??? Detected: ${rawSpeaker} (${pct}%) - ${stateStatus} | isSpeaking=${computedIsSpeaking}`
            );
          }
          lastSampleRef.current = {
            name: rawSpeaker,
            confidence: nextConfidence,
            status: stateStatus,
            isSpeaking: computedIsSpeaking,
          };
        }
        setError(null);
      } catch (e) {
        // Network-level failure (server down or CORS)
        setBackendOnline(false);
        setError("Backend unreachable");
        setStatus("error");
        setSpeaker(null);
        setConfidence(null);
        setIsSpeaking(false);
      } finally {
        inFlightRef.current = false;
      }
    };

    poll();
    id = setInterval(poll, Math.max(300, interval || 3000));
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [endpoint, backendOnline, log, logOnChangeOnly, minDelta, smoothing, backgroundLabel, interval, minConfidence, mode]);

  return { speaker, confidence, isSpeaking, error, status, backendOnline, altSpeaker, altConfidence };
}

// Export default and keep named export via the function declaration above
export default useSpeakerDetection;
