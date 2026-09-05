"use client";

import { langToBcp47 } from "@/lib/ai/speech/languageMap";
import { textToSpeechProvider } from "@/lib/ai/speech/textToSpeech";

function synth(): SpeechSynthesis | null {
  return typeof speechSynthesis !== "undefined" ? speechSynthesis : null;
}

// ------------------------------------------------------------------
// Thor voice selection.
//
// Thor is a hero - he must sound like one. These lists let us pick a MALE,
// deep voice wherever the device has one, and refuse known female voices
// unless literally nothing else exists. Gender outweighs language so that
// "no female voice" always wins over "right accent" - the user asked for
// Thor's voice over a female assistant.
// ------------------------------------------------------------------

/** Substrings that identify male voices (Microsoft, Google, Apple, Amazon). */
const MALE_VOICE_NAMES = [
  "male",
  " david",
  "david ",
  "mark",
  "daniel",
  "arthur",
  "alex",
  " guy",
  "fred",
  "ryan",
  "george",
  "christopher",
  "james",
  "matt ",
  "sean",
  "stefan",
  "paul",
  "pablo",
  "ravi",
  "hemant",
  "madhur",
];

/** Substrings that identify female voices - heavily penalised. */
const FEMALE_VOICE_NAMES = [
  "female",
  "zira",
  "hazel",
  "susan",
  "samantha",
  "vanessa",
  "karen",
  "victoria",
  "joanna",
  "aria",
  "jenny",
  "salli",
  "joey",
  "kimberly",
  "alison",
  "ava",
  "emma",
  "serena",
  "catherine",
  "linda",
  "heera",
  "kalpana",
  "pallavi",
  "swara",
];

function isMaleName(name: string): boolean {
  return MALE_VOICE_NAMES.some((n) => name.includes(n));
}

function isFemaleName(name: string): boolean {
  return FEMALE_VOICE_NAMES.some((n) => name.includes(n));
}

/**
 * Score a voice for Thor. Gender is dominant (+1000 male, -1000 female),
 * then language match, then quality (natural/premium), then India locale.
 */
function scoreVoice(v: SpeechSynthesisVoice, base: string): number {
  const name = (v.name ?? "").toLowerCase();
  const lang = (v.lang ?? "").toLowerCase();
  let score = 0;

  if (isMaleName(name)) score += 1000;
  if (name.includes("male")) score += 120;
  if (isFemaleName(name)) score -= 1000;
  if (name.includes("female")) score -= 120;

  if (lang.startsWith(base)) score += 220;
  if (lang.includes("-in")) score += 60;

  if (name.includes("natural")) score += 80;
  if (name.includes("premium")) score += 50;
  if (name.includes("online")) score += 35;
  if (name.includes("google")) score += 25;
  if (name.includes("enhanced")) score += 25;
  if (name.includes("neural")) score += 40;

  if (name.includes("robot") || name.includes("click")) score -= 200;
  return score;
}

/**
 * Best Thor voice: male/deep first (any language), then an exact-language
 * voice, never preferring a female voice unless it is the only choice.
 */
function findThorVoice(language: string): SpeechSynthesisVoice | null {
  const voices = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;
  const bcp47 = langToBcp47(language as Parameters<typeof langToBcp47>[0]).toLowerCase();
  const base = bcp47.split("-")[0];

  const scored = voices
    .map((v) => ({ v, score: scoreVoice(v, base) }))
    .sort((a, b) => b.score - a.score);

  // 1) Any male voice (Thor's voice) wherever one exists - gender wins.
  const male = scored.find((s) => s.score > 0);
  if (male) return male.v;

  // 2) Best available voice for the exact language.
  const exact = scored.find((s) => phoneSafeLang(s.v.lang).startsWith(base));
  if (exact) return exact.v;

  // 3) Very last resort: anything at all.
  return scored[0]?.v ?? null;
}

function phoneSafeLang(lang: string): string {
  return (lang ?? "").toLowerCase();
}

// ------------------------------------------------------------------
// Async voice loading.
//
// Browsers (especially Chrome) lazily populate `speechSynthesis.getVoices()`.
// The FIRST call returns an empty array and voices only appear after the
// `voiceschanged` event fires. If we pick the utterance voice before voices
// load, Thor silently uses the browser's default (often female) voice - or
// none at all. We therefore resolve voices asynchronously before speaking.
// ------------------------------------------------------------------

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
let knownVoices: SpeechSynthesisVoice[] = [];

function currentVoices(): SpeechSynthesisVoice[] {
  try {
    const v = synth()?.getVoices() ?? [];
    if (v.length) knownVoices = v;
    return knownVoices;
  } catch {
    return knownVoices;
  }
}

// Chrome fills the voice list lazily: the FIRST getVoices() on a fresh page
// returns [] and only starts loading background voices. Call it eagerly now so
// voices are ready the moment Thor first needs to talk.
if (typeof speechSynthesis !== "undefined") {
  try {
    speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}

/** Chrome quirk: after cancel() the engine can sit in a paused/stuck state
 *  and silently drop the next speak(). A pause/resume cycle un-sticks it. */
function kick(s: SpeechSynthesis): void {
  try {
    if (typeof s.pause === "function") s.pause();
    if (typeof s.resume === "function") s.resume();
  } catch {
    /* ignore */
  }
}

/**
 * Resolve the voice list as soon as it has at least one entry, re-checking on
 * every `voiceschanged` event until then (browsers populate voices lazily and
 * the exact timing is unreliable). Falls back to whatever we have after a
 * generous timeout so speech never silently dies waiting.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  if (voicesReady) return voicesReady;

  voicesReady = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    const finish = (fallback = false) => {
      if (settled) return;
      const list = currentVoices();
      if (list.length || fallback) {
        settled = true;
        resolve(list);
      }
    };
    // Re-check once more after the original `voiceschanged` had a chance.
    let checks = 0;
    const onVoicesChanged = () => {
      finish(false);
      // Chrome may emit `voiceschanged` multiple times; keep listening until
      // we actually have voices.
      if (++checks > 20) s.removeEventListener?.("voiceschanged", onVoicesChanged);
    };
    finish(false);
    s.addEventListener?.("voiceschanged", onVoicesChanged);
    setTimeout(() => finish(true), 2500);
  });
  return voicesReady;
}

/**
 * Speak a line as Thor. Server-first so a voice ALWAYS comes out:
 *
 *  Tier 1: SERVER TTS (/api/ai/thor-tts) - Microsoft Edge neural voices,
 *     authentic MALE voice for every language the app supports (English male,
 *     Hindi male, etc.). No API key, no CORS, no browser voice list needed.
 *     This is the reliable path that works on every device/browser.
 *
 *  Tier 2: native `speechSynthesis` fallback for offline cases - picks the
 *     deepest available MALE voice.
 */
export function speakThor(text: string, language: string, onEnd?: () => void): void {
  if (!text) {
    onEnd?.();
    return;
  }
  playServerVoice(text, language, () => {
    // If the server TTS could not produce sound (offline/blocked), fall back
    // to any male voice the device has.
    speakNative(text, language, onEnd);
  }, onEnd);
}

// ------------------------------------------------------------------
// Tier 1: server TTS through our own API route.
//
// Same-origin `audio` element: no CORS, no autoplay restrictions beyond the
// browser's normal policy, and a real neural male voice for every language.
// Long bubbles are split into requests the server accepts comfortably.
// ------------------------------------------------------------------

function splitForTts(text: string, max = 700): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of clean.split(/(?<=[.!?।])\s+|\s(?=[.!?।])/)) {
    const next = (current + " " + sentence).trim();
    if (next.length > max && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [clean];
}

let serverAudio: HTMLAudioElement | null = null;

function playServerVoice(
  text: string,
  language: string,
  onFail: () => void,
  onEnd?: () => void
): void {
  const chunks = splitForTts(text);
  const base = (language || "en").toLowerCase().split("-")[0];
  let index = 0;
  let audioPlayed = false;

  const playNext = () => {
    if (index >= chunks.length) {
      onEnd?.();
      return;
    }
    const chunk = chunks[index++];
    const url =
      "/api/ai/thor-tts?text=" + encodeURIComponent(chunk) + "&lang=" + encodeURIComponent(base);
    const audio = new Audio(url);
    serverAudio = audio;
    audio.volume = 1;
    audio.onended = () => playNext();
    audio.onerror = () => {
      if (audioPlayed) playNext();
      else onFail();
    };
    audio
      .play()
      .then(() => {
        audioPlayed = true;
      })
      .catch(() => {
        if (audioPlayed) playNext();
        else onFail();
      });
  };
  playNext();
}

// ------------------------------------------------------------------
// Tier 2: native speechSynthesis fallback (offline/devices with male voices).
// ------------------------------------------------------------------

function speakNative(text: string, language: string, onEnd?: () => void): void {
  const s = synth();
  if (!s) {
    onEnd?.();
    return;
  }
  s.cancel();
  kick(s);

  const prefs = { rate: 0.9, pitch: 0.6 };
  void loadVoices().then(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = prefs.rate;
    utterance.pitch = prefs.pitch;
    utterance.volume = 1;
    const voice = findThorVoice(language);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = langToBcp47(language as Parameters<typeof langToBcp47>[0]);
    }
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    kick(s);
    s.speak(utterance);
  });
}

/** Cancel any Thor narration currently playing (server or native). */
export function stopThorSpeech(): void {
  const s = synth();
  if (s) s.cancel();
  if (serverAudio) {
    try {
      serverAudio.pause();
      serverAudio.src = "";
    } catch {
      /* ignore */
    }
    serverAudio = null;
  }
}

export function thorSpeechAvailable(): boolean {
  return textToSpeechProvider.available();
}