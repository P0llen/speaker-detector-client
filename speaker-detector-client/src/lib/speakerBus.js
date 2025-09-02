// src/lib/speakerBus.js
class SpeakerBus extends EventTarget {
  emit(event, detail) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
  on(event, handler) {
    this.addEventListener(event, handler);
    return () => this.removeEventListener(event, handler);
  }
}

export const speakerBus = new SpeakerBus();

// Bridge window → bus so existing window.dispatchEvent(...) still reaches bus listeners.
const forwardFromWindow = (evtName) => {
  const handler = (e) => {
    // Tag the source to avoid future loops if someone ever bridges back.
    const detail = { ...(e.detail || {}), __source: "window" };
    speakerBus.emit(evtName, detail);
  };
  window.addEventListener(evtName, handler);
};

["speaker:update", "speaker:identified", "speaker:cleared"].forEach(
  forwardFromWindow
);

// Convenience helpers
export const onSpeakerIdentified = (handler) =>
  speakerBus.on("speaker:identified", handler);

export const onSpeakerCleared = (handler) =>
  speakerBus.on("speaker:cleared", handler);

export const onSpeakerUpdate = (handler) =>
  speakerBus.on("speaker:update", handler);
