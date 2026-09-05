"use client";

import { create } from "zustand";

/**
 * Thor guide UI state. Kept separate from the main app store so the feature
 * stays self-contained. `bubble` holds the currently spoken/displayed guide
 * line; `spokenViews` avoids re-narrating the same page on repeated visits
 * unless the user asks again.
 */
interface ThorMessage {
  id: string;
  role: "user" | "thor";
  text: string;
}

interface ThorState {
  open: boolean;
  setOpen: (open: boolean) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  bubble: string | null;
  setBubble: (text: string | null) => void;
  thinking: boolean;
  setThinking: (thinking: boolean) => void;
  messages: ThorMessage[];
  addMessage: (m: ThorMessage) => void;
  clearMessages: () => void;
  spokenViews: string[];
  markSpoken: (view: string) => void;
  hasSpoken: (view: string) => boolean;
}

export const useThorStore = create<ThorState>()((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  muted: false,
  setMuted: (muted) => set({ muted }),
  bubble: null,
  setBubble: (text) => set({ bubble: text }),
  thinking: false,
  setThinking: (thinking) => set({ thinking }),
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  spokenViews: [],
  markSpoken: (view) => set((s) => ({ spokenViews: [...s.spokenViews, view] })),
  hasSpoken: (view) => get().spokenViews.includes(view),
}));