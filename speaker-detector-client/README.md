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
  Displays live speaker name, confidence, and correction UI.

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
