import type { QuizChoiceOption, QuizStepType } from "@astro-note/cms-sdk";

/** Minimal serialized step passed server → client (only what the UI needs). */
export interface QuizStepData {
  key: string;
  type: QuizStepType;
  headline: string;
  subline: string | null;
  choices: QuizChoiceOption[];
  settings: Record<string, unknown>;
  validation: Record<string, unknown>;
  animationKey: string | null;
}

export interface QuizMachineProps {
  tenantSlug: string;
  steps: QuizStepData[];
}
