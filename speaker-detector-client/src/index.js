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
};
