/**
 * useMicCheck hook (cleaned version)
 * - Enumerates available input devices
 * - Manages selection with localStorage persistence
 * - Does NOT access or analyze microphone streams
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "mic-test-device-id";
const isConcreteId = (id) =>
  !!id && id !== "default" && id !== "communications";

export default function useMicCheck() {
  const [micStatus, setMicStatus] = useState("pending");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, _setSelectedDeviceId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );

  const lastIdsRef = useRef([]);

  const setSelectedDeviceId = useCallback((id) => {
    _setSelectedDeviceId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshDeviceList = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = all.filter(
        (d) => d.kind === "audioinput" && isConcreteId(d.deviceId)
      );
      setDevices(audioInputs);

      const ids = audioInputs.map((d) => d.deviceId);
      const before = new Set(lastIdsRef.current);
      const newlyAdded = ids.filter((id) => !before.has(id));
      lastIdsRef.current = ids;

      if (!selectedDeviceId && ids.length > 0) {
        setSelectedDeviceId(ids[0]);
      } else if (newlyAdded.length > 0) {
        setSelectedDeviceId(newlyAdded[0]);
      } else if (selectedDeviceId && !ids.includes(selectedDeviceId)) {
        setSelectedDeviceId(ids[0] || "");
      }

      setMicStatus(audioInputs.length > 0 ? "ok" : "none");
    } catch (err) {
      setDevices([]);
      setMicStatus("error");
    }
  }, [selectedDeviceId, setSelectedDeviceId]);

  useEffect(() => {
    refreshDeviceList();

    const onChange = () => {
      refreshDeviceList();
    };
    navigator.mediaDevices?.addEventListener("devicechange", onChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", onChange);
    };
  }, [refreshDeviceList]);

  return {
    micStatus,
    micStatusLabel:
      {
        pending: "⏳ Checking mic devices...",
        ok: "🎤 Mic devices found",
        none: "❌ No microphones detected",
        error: "⚠️ Failed to access microphone",
      }[micStatus] || "❔",
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDeviceList,
  };
}
