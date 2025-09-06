# 🎤 @pollen/speaker-detector-client

React client for interfacing with the [speaker-detector](https://pypi.org/project/speaker-detector) Python backend.  
Supports real-time speaker identification, meeting transcription, and speaker enrollment.

---

## 📦 Installation

Install the client package (frontend) and backend:

```bash
npm install @pollen/speaker-detector-client
pip install speaker-detector
```

Ensure the backend is running at `http://localhost:9000` (default) or configure it to match your frontend environment.

---

## 🚀 Quick Start

```jsx
import {
  useSpeakerDetection,
  SpeakerStatus,
} from "@pollen/speaker-detector-client";

function App() {
  const { speaker, confidence, isSpeaking } = useSpeakerDetection();

  return <SpeakerStatus />;
}
```

---

## 🧱 Package Exports

### 🧠 Hooks

- **`useSpeakerDetection(options)`**  
  Polls `/api/active-speaker` and returns:

  ```js
  {
    speaker, confidence, isSpeaking, error;
  }
  ```

- **`useMeetingTranscript(auto, interval)`**  
  Polls or manually fetches transcript data from `/api/meetings/transcribe`.

---

### 🎛 Components

- **`<SpeakerStatus />`**  
  Displays live speaker name, confidence, and backend status. All tuning (mode, threshold, interval, etc.) is backend‑controlled; the UI is read‑only.

---

### 📡 API Helpers

```js
import {
  enrollSpeaker,
  identifySpeaker,
  fetchSpeakers,
  startMeeting,
  stopMeeting,
  generateTranscript,
} from "@pollen/speaker-detector-client";
```

- `enrollSpeaker(blob, speakerName)`
- `identifySpeaker(blob)`
- `fetchSpeakers()`
- `startMeeting()`
- `stopMeeting()`
- `generateTranscript()`

---

### 🧩 Utilities

```js
import { getSpeakerPrompt } from "@pollen/speaker-detector-client";
```

- **`getSpeakerPrompt()`** → Returns a UI-friendly default prompt for recording.

---

## 💡 Example: SpeakerStatus with Correction

```jsx
import React from "react";
import { useSpeakerDetection } from "@pollen/speaker-detector-client";

function SpeakerStatus({ minConfidence = 0.5, interval = 3000 }) {
  const { speaker, confidence, isSpeaking, error } = useSpeakerDetection({
    interval,
    minConfidence,
  });

  if (error) return <p className="speaker-error">❌ {error}</p>;

  return (
    <div className="speaker-status-panel">
      <h4 className="speaker-heading">🔊 Speaker Status</h4>
      {isSpeaking ? (
        <div className="speaker-wrapper">
          <p>
            <strong>Status:</strong> 🎙 Speaking
            <br />
            <strong>Speaker:</strong> {speaker}
            <br />
            <strong>Confidence:</strong> {Math.round(confidence * 100)}%
          </p>
        </div>
      ) : (
        <p className="willobee-muted">🕵️ Listening... (no speaker detected)</p>
      )}
    </div>
  );
}

export default SpeakerStatus;
```

---

## 🧪 Local Demo (Preview UI)

This repo includes a small Vite demo so you can run a page locally, tweak the UI, and test against the backend before integrating into your app.

1) Install demo deps (at repo root `speaker-detector-client/`):

```
npm i
npm i -D vite @vitejs/plugin-react
```

2) Start your backend (default at `http://localhost:9000`).

3) Run the demo:

```
npm run dev
```

Open the printed URL (default `http://localhost:5173`). The demo imports from `src/` directly for instant feedback and proxies `/api/*` calls to your backend.

Change demo ports/targets without editing files:

- Windows PowerShell:
  - `set DEMO_PORT=5175; npm run dev`
  - `set DEMO_BACKEND=http://localhost:9100; npm run dev`
- macOS/Linux:
  - `DEMO_PORT=5175 npm run dev`
  - `DEMO_BACKEND=http://localhost:9100 npm run dev`

You can also pass a CLI flag: `npm run dev -- --port 5175`.

Build or preview the demo:

```
npm run demo:build
npm run demo:preview
```

The `demo/` folder is excluded from the published npm package.

---

## ⚙️ API Base (CORS‑friendly)

By default, this package avoids hardwiring a cross‑origin base URL. All internal requests flow through a small resolver:

- `withBase(path)`: prefixes `path` with a configured base URL if provided; otherwise keeps it relative.
- Configuration precedence:
  1. `window.__SPEAKER_API_BASE__` (if set by the host app)
  2. `API_BASE` exported from `@lib/constants` (for back‑compat)
  3. Empty string → relative URLs (same‑origin)

Recommended production setup is to use same‑origin relative URLs and route `/api/*` via your reverse proxy (Nginx/Traefik/CDN) to the backend. If you need to target a different origin, set at app startup:

```html
<script>
  window.__SPEAKER_API_BASE__ = 'https://api.pl4tform.online';
  // or programmatically: setApiBase('https://api.pl4tform.online')
  // import { setApiBase } from '@pollen/speaker-detector-client'
</script>
```

The demo explicitly sets `window.__SPEAKER_API_BASE__ = ''` to use the Vite proxy and avoid CORS during local development.


## 🌐 Backend Setup

The backend is required for this client to function.

Install and run:

```bash
pip install speaker-detector
python -m speaker_detector.server
```

---

## 🔗 Related Projects

- [`speaker-detector` (Python backend)](https://pypi.org/project/speaker-detector) – backend for this client.
- [`willobee`](https://github.com/p0llen/willobee) – AI assistant project using this package.

---

## 🛠 Maintained by

**Lara Whybrow** — [@p0llen](https://github.com/p0llen)  
📧 lara.whybrow@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/lara-whybrow/)

Licensed under **MIT**.
