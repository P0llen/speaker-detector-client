// src/lib/apiBase.js
import { API_BASE } from "./constants";

// Global override key (can be set by host app)
const GLOBAL_KEY = "__SPEAKER_API_BASE__";

export function getApiBase() {
  try {
    if (typeof window !== "undefined" && typeof window[GLOBAL_KEY] === "string") {
      return window[GLOBAL_KEY];
    }
  } catch (_) {}
  // Back-compat: fall back to exported constant
  return API_BASE || "";
}

export function setApiBase(url) {
  if (typeof window !== "undefined") {
    window[GLOBAL_KEY] = url || "";
  }
}

export function withBase(path) {
  const base = getApiBase();
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}${path}`;
}

export const API_BASE_GLOBAL_KEY = GLOBAL_KEY;

