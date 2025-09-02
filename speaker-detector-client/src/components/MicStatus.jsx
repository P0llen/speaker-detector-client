import React, { useState, useRef, useEffect, useCallback } from "react";
import useMicCheck from "../hooks/useMicCheck";

const MicStatus = ({
  backendOnline,
  status,
  listeningMode,
  isSpeaking,
  title = "🎤 Microphone & Detection Status",
  enableMicTest = true,
  micTestButtonLabel = "🎤 Mic Test",
}) => {
  const { devices, selectedDeviceId, setSelectedDeviceId } = useMicCheck();

  const [showMicTest, setShowMicTest] = useState(false);

  const combinedStatusLabel = () => {
    if (backendOnline === false) return "🔌 Backend unreachable";
    if (listeningMode === "off" || status === "disabled")
      return "🔇 Detection disabled";
    if (status === "pending") return "⏳ Engine awaiting data...";
    if (status === "listening")
      return isSpeaking ? "🎙 Voice detected" : "🕵️ Listening...";
    if (backendOnline === null) return "🔎 Checking backend...";
    return "ℹ️ Ready";
  };

  const onSelectDevice = (e) => {
    setSelectedDeviceId(e.target.value);
  };

  return (
    <div className="mic-status-panel">
      <h4 className="speaker-heading">{title}</h4>

      <p>
        <strong>Status:</strong> {combinedStatusLabel()}
      </p>

      <div style={{ marginTop: 8 }}>
        <label>
          Input device:&nbsp;
          <select
            value={selectedDeviceId || ""}
            onChange={onSelectDevice}
            style={{
              background: "#222",
              color: "#fff",
              borderRadius: 4,
              padding: 4,
            }}
          >
            {devices.length === 0 ? (
              <option value="">(no audio inputs)</option>
            ) : (
              devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))
            )}
          </select>
        </label>

        {enableMicTest && (
          <button
            onClick={() => setShowMicTest((v) => !v)}
            style={{ marginLeft: 8 }}
          >
            {showMicTest ? "⬆️ Close Mic Test" : micTestButtonLabel + " ⬇️"}
          </button>
        )}
      </div>

      {enableMicTest && showMicTest && (
        <MicTestSection deviceId={selectedDeviceId} />
      )}
    </div>
  );
};

export default MicStatus;

function MicTestSection({ deviceId }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const chunks = useRef([]);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (audioCtxRef.current?.state && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    audioCtxRef.current = null;
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f0";
    ctx.beginPath();

    const slice = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += slice;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    rafRef.current = requestAnimationFrame(draw);
  };

  const setupMic = useCallback(async () => {
    cleanup();
    try {
      const constraints = deviceId
        ? { audio: { deviceId: { exact: deviceId } } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      draw();
    } catch (err) {
      alert("⚠️ Microphone access failed: " + err.message);
    }
  }, [deviceId, cleanup]);

  useEffect(() => {
    setupMic();
    return cleanup;
  }, [setupMic]);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || !stream.active) {
      alert("🎤 Mic stream not ready.");
      return;
    }

    chunks.current = [];
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.onstop = () => {
      if (chunks.current.length > 0) {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(() => {});
          }
        }, 50);
      }
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorder) recorder.stop();
    setRecording(false);
  };

  const restart = () => {
    setAudioURL(null);
    setRecording(false);
    chunks.current = [];
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: "#1b1b1b",
        border: "1px solid #333",
        borderRadius: 8,
      }}
    >
      <h5 style={{ marginBottom: 8 }}>🎧 Mic Signal Visualizer</h5>
      <canvas
        ref={canvasRef}
        width={560}
        height={100}
        style={{
          width: "100%",
          height: 120,
          background: "#1b1b1b",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      />

      <div style={{ marginTop: 12 }}>
        {!recording && !audioURL && (
          <button onClick={startRecording}>⏺ Start Recording</button>
        )}
        {recording && <button onClick={stopRecording}>⏹ Stop Recording</button>}
        {audioURL && !recording && (
          <>
            <audio
              ref={audioRef}
              controls
              style={{ display: "block", margin: "8px 0" }}
            />
            <button onClick={restart}>🔄 Restart</button>
          </>
        )}
      </div>
    </div>
  );
}
