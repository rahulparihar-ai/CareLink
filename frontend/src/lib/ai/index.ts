// ------------------------------------------------------------------
// CARELINK AI - Public library surface
// ------------------------------------------------------------------

export * from "./types";
export * from "./actions";
export { AI_ACTIONS, isAllowedAction, actionToView } from "./actions";
export type { TextToSpeechProvider, SpeechToTextProvider } from "./types";
export { speechToTextProvider } from "./speech/speechToText";
export { textToSpeechProvider } from "./speech/textToSpeech";
export { langToBcp47, findVoice, SPEECH_LANG } from "./speech/languageMap";
export type { AiChatRequest, AiChatResponse, AiChatMessage, AiChatTurn } from "./types";
export type { LanguageCode } from "@/types";