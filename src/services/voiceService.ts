// ------------------------------------------------------------------
// CARELINK - Mock Voice / ASR Service
// Frontend simulation of speech-to-text.
// ------------------------------------------------------------------

import { delay } from "./aiService";

export async function transcribeDemo(seconds = 2): Promise<string> {
  await delay(1200);
  void seconds;
  return "I have been experiencing stomach pain for the last three days. It is mild to moderate, worse after eating.";
}

export async function simulateVoiceAvailable(): Promise<boolean> {
  await delay(400);
  return true;
}
