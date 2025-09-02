import { useState, useEffect } from "react";
import { generateTranscript } from "../lib/api";

export default function useMeetingTranscript(auto = false, interval = 10000) {
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchTranscript() {
    setLoading(true);
    try {
      const data = await generateTranscript();
      setTranscript(data);
    } catch (err) {
      console.error("Transcript error:", err);
      setError("❌ Failed to fetch transcript");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(fetchTranscript, interval);
    return () => clearInterval(intervalId);
  }, [auto, interval]);

  return { transcript, fetchTranscript, loading, error };
}
