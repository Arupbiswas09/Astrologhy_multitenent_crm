"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Quiz step machine state (docs/02 §4: client state in Zustand, mirrored to
 * sessionStorage so a refresh resumes and nothing is stored server-side
 * before email submit).
 */

export interface QuizStateData {
  stepIndex: number;
  answers: Record<string, string>;
  /** 1 while the interstitial has already played this session. */
  interstitialPlayed: boolean;
}

export interface QuizStore extends QuizStateData {
  setAnswer: (stepKey: string, value: string) => void;
  goTo: (index: number) => void;
  markInterstitialPlayed: () => void;
  reset: () => void;
}

const initialData: QuizStateData = {
  stepIndex: 0,
  answers: {},
  interstitialPlayed: false,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...initialData,
      setAnswer: (stepKey, value) =>
        set((s) => ({ answers: { ...s.answers, [stepKey]: value } })),
      goTo: (index) => set({ stepIndex: Math.max(0, index) }),
      markInterstitialPlayed: () => set({ interstitialPlayed: true }),
      reset: () => set(initialData),
    }),
    {
      name: "an_quiz",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        stepIndex: s.stepIndex,
        answers: s.answers,
        interstitialPlayed: s.interstitialPlayed,
      }),
      // Avoid SSR/client hydration mismatch: rehydrate manually after mount.
      skipHydration: true,
    },
  ),
);
