// Unified API methods for speaker detector backend

export async function enrollSpeaker(blob, speakerName) {
  const form = new FormData();
  form.append("file", blob, "enroll.webm");
  form.append("speaker", speakerName);

  const res = await fetch("/api/enroll", {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function identifySpeaker(blob) {
  const form = new FormData();
  form.append("file", blob, "identify.webm");

  const res = await fetch("/api/identify", {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function fetchSpeakers() {
  const res = await fetch("/api/speakers");
  return res.json();
}

export async function startMeeting() {
  return fetch("/api/meetings/start", { method: "POST" });
}

export async function stopMeeting() {
  return fetch("/api/meetings/stop", { method: "POST" });
}

export async function generateTranscript() {
  const res = await fetch("/api/meetings/transcribe");
  return res.json();
}

/* --- Rebuild helpers ----------------------------------- */
export async function fetchRebuildList() {
  const res = await fetch("/api/rebuild-list");
  return res.json(); // -> { toRebuild: [...] }
}

export async function rebuildSpeaker(speakerId) {
  return fetch(`/api/rebuild/${speakerId}`, { method: "POST" }).then((r) =>
    r.json()
  ); // -> { status: "rebuilt", name: ... }
}

export async function rebuildAllSpeakers() {
  return fetch("/api/rebuild-all", { method: "POST" }).then((r) => r.json()); // -> { status: "rebuilt", rebuilt: [...] }
}

export async function rebuildBackgroundNoise() {
  return fetch("/api/rebuild-background", { method: "POST" }).then((r) =>
    r.json()
  ); // -> { status: "rebuilt" }
}
