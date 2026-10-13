"use client";

import { create } from "zustand";
import { sfx } from "./sound";

export type Tool = "compress" | "split" | "merge";

interface AppState {
  tool: Tool;
  setTool: (t: Tool) => void;
  muted: boolean;
  toggleMuted: () => void;
  pro: boolean;
  unlockPro: () => void;
  proOpen: boolean;
  openPro: (reason?: string) => void;
  closePro: () => void;
  proReason: string;
  toast: { id: number; text: string } | null;
  showToast: (text: string) => void;
}

export const useApp = create<AppState>((set, get) => ({
  tool: "compress",
  setTool: (tool) => set({ tool }),
  muted: false,
  toggleMuted: () => {
    const muted = !get().muted;
    sfx.setMuted(muted);
    set({ muted });
  },
  pro: false,
  unlockPro: () => set({ pro: true }),
  proOpen: false,
  proReason: "",
  openPro: (reason = "") => set({ proOpen: true, proReason: reason }),
  closePro: () => set({ proOpen: false }),
  toast: null,
  showToast: (text) => {
    const id = Date.now();
    set({ toast: { id, text } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3800);
  },
}));
