// /src/lib/getSpeakerPrompt.js

const getSpeakerPrompt = () =>
  "Please speak clearly into the microphone. Say a full sentence in your normal voice.";

// default export (keeps old code working)
export default getSpeakerPrompt;

// named export (solves “no matching export” error)
export { getSpeakerPrompt };
