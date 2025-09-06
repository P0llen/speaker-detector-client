// components
import SpeakerStatus from "@components/SpeakerStatus";
import MicStatus from "@components/MicStatus";

// hooks
import useSpeakerDetection from "@hooks/useSpeakerDetection";
import useMeetingTranscript from "@hooks/useMeetingTranscript";
import useListeningMode from "@hooks/useListeningMode";

// API + utils
import {
  enrollSpeaker,
  identifySpeaker,
  startMeeting,
  stopMeeting,
  generateTranscript,
  fetchSpeakers,
  fetchRebuildList,
  rebuildSpeaker,
  rebuildAllSpeakers,
  rebuildBackgroundNoise,
} from "@lib/api";
import { getSpeakerPrompt } from "@lib/getSpeakerPrompt";
import { CLIENT_VERSION, API_BASE } from "@lib/constants";
import { getApiBase, setApiBase, withBase, API_BASE_GLOBAL_KEY } from "@lib/apiBase";

export {
  // Components & hooks
  SpeakerStatus,
  MicStatus,
  useListeningMode,
  useSpeakerDetection,
  useMeetingTranscript,

  // API functions
  enrollSpeaker,
  identifySpeaker,
  startMeeting,
  stopMeeting,
  generateTranscript,
  fetchSpeakers,
  fetchRebuildList,
  rebuildSpeaker,
  rebuildAllSpeakers,
  rebuildBackgroundNoise,

  // Utilities
  getSpeakerPrompt,
  CLIENT_VERSION,
  API_BASE,
  // API base helpers (non-breaking addition)
  getApiBase,
  setApiBase,
  withBase,
  API_BASE_GLOBAL_KEY,
};
