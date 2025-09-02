// speaker-detector-client/src/hooks/useSpeakerDetection.js
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../lib/constants";
import useListeningMode from "./useListeningMode";

export function useSpeakerDetection({
  endpoint = "/api/active-speaker",
  log = true,
} = {}) {
  const { threshold, intervalMs } = useListeningMode("off"); // ← SSOT values
  const minConfidence = threshold;
  const interval = intervalMs;

  const [speaker, setSpeaker] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);

  const lastAnnouncedNameRef = useRef(null);

  useEffect(() => {
    let id;
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/version`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        await r.json();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let id,
      cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE}${endpoint}`, { cache: "no-store" });
        if (!r.ok) throw new Error("Active speaker API failed");
        const d = await r.json();
        if (cancelled) return;

        const rawSpeaker = d.speaker ?? null;
        const rawConfidence =
          typeof d.confidence === "number" ? d.confidence : null;
        const backendIsSpeaking =
          typeof d.is_speaking === "boolean" ? d.is_speaking : null;
        const stateStatus = (d.status || "pending").trim();

        setStatus(stateStatus);
        setSpeaker(rawSpeaker);
        setConfidence(rawConfidence);

        const knownEnough =
          rawSpeaker &&
          rawSpeaker !== "unknown" &&
          (rawConfidence ?? 0) >= (minConfidence ?? 0.5);

        const computedIsSpeaking =
          backendIsSpeaking !== null ? backendIsSpeaking : knownEnough;
        setIsSpeaking(computedIsSpeaking);

        // events
        window.dispatchEvent(
          new CustomEvent("speaker:update", {
            detail: {
              name: rawSpeaker,
              confidence: rawConfidence,
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
                  confidence: rawConfidence,
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
                confidence: rawConfidence ?? 0,
                ts: Date.now(),
              },
            })
          );
          lastAnnouncedNameRef.current = null;
        }

        if (log) {
          const pct = Math.round((rawConfidence || 0) * 100);
          console.log(
            `🎙️ Detected: ${rawSpeaker} (${pct}%) — ${stateStatus} | isSpeaking=${computedIsSpeaking}`
          );
        }
        setError(null);
      } catch (e) {
        if (backendOnline === false) setError("Backend unreachable");
        setStatus("error");
        setSpeaker(null);
        setConfidence(null);
        setIsSpeaking(false);
      }
    };

    poll();
    id = setInterval(poll, Math.max(300, interval || 3000));
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [endpoint, backendOnline, log, interval, minConfidence]);

  return { speaker, confidence, isSpeaking, error, status, backendOnline };
}

export default useSpeakerDetection;
