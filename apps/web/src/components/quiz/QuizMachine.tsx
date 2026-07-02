"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "@/components/motion";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { ChoiceStep } from "@/components/quiz/steps/ChoiceStep";
import { DateWheelStep } from "@/components/quiz/steps/DateWheelStep";
import { EmailStep } from "@/components/quiz/steps/EmailStep";
import { InterstitialStep } from "@/components/quiz/steps/InterstitialStep";
import { TextInputStep } from "@/components/quiz/steps/TextInputStep";
import type { QuizMachineProps, QuizStepData } from "@/components/quiz/types";
import { track } from "@/lib/analytics";
import { deriveFirstName, interpolateQuizCopy } from "@/lib/interpolate";
import { captureUtmOnce, readUtm } from "@/lib/utm";
import { useQuizStore } from "@/stores/quiz-store";

/** CMS-driven step machine (docs/05, docs/09 Phase 4). */
export function QuizMachine({ tenantSlug, steps }: QuizMachineProps) {
  return (
    <MotionProvider>
      <QuizMachineInner tenantSlug={tenantSlug} steps={steps} />
    </MotionProvider>
  );
}

function QuizMachineInner({ tenantSlug, steps }: QuizMachineProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { stepIndex, answers, setAnswer, goTo, reset } = useQuizStore();
  const [hydrated, setHydrated] = useState(false);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const trackedStep = useRef(-1);

  // Rehydrate persisted answers after mount (SSR-safe), capture UTM once.
  useEffect(() => {
    void useQuizStore.persist.rehydrate();
    setHydrated(true);
    captureUtmOnce();
    try {
      if (!sessionStorage.getItem("an_qs")) {
        sessionStorage.setItem("an_qs", "1");
        track("quiz_start", { tenant: tenantSlug });
      }
    } catch {
      track("quiz_start", { tenant: tenantSlug });
    }
  }, [tenantSlug]);

  const index = Math.min(stepIndex, steps.length - 1);
  const step = steps[index];

  // Per-step analytics + move focus to the new headline for screen readers.
  useEffect(() => {
    if (!hydrated || trackedStep.current === index) return;
    trackedStep.current = index;
    track(`quiz_step_${index + 1}`, { tenant: tenantSlug, step: step?.key ?? "" });
    headlineRef.current?.focus({ preventScroll: true });
  }, [hydrated, index, step?.key, tenantSlug]);

  const goForward = useCallback(
    (from: number) => {
      setDirection(1);
      goTo(Math.min(from + 1, steps.length - 1));
    },
    [goTo, steps.length],
  );

  function goBack() {
    if (index === 0) return;
    let target = index - 1;
    // Never land the user back inside the interstitial.
    while (target > 0 && steps[target]?.type === "interstitial") target--;
    setDirection(-1);
    goTo(target);
  }

  const firstName = deriveFirstName(answers.full_name);

  async function submitLead(data: { email: string; consent: boolean; website: string }) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: tenantSlug,
          email: data.email,
          consent_marketing: data.consent,
          website: data.website,
          answers,
          utm: readUtm(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We couldn't save your reading. Please try again.");
      }
      const { token } = (await res.json()) as { token: string };
      track("email_submitted", { tenant: tenantSlug });
      reset();
      router.push(`/report/${token}`);
    } catch (err) {
      // Answers stay in sessionStorage — nothing is lost on retry (docs/05).
      setSubmitError(err instanceof Error ? err.message : "Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  if (!step) return null;

  const headline = interpolateQuizCopy(step.headline, firstName);
  const subline = step.subline ? interpolateQuizCopy(step.subline, firstName) : null;
  const isInterstitial = step.type === "interstitial";

  const variants = {
    enter: (dir: number) =>
      reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 36 : -36 },
    center: { opacity: 1, x: 0 },
    exit: (dir: number) =>
      reduced ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? -36 : 36 },
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-12 pb-8 md:max-w-lg">
      <ProgressBar current={index} total={steps.length} />

      <div className="flex h-11 items-center">
        {index > 0 && !isInterstitial ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-paper-300 hover:text-paper-100"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {hydrated ? (
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <m.section
            key={step.key}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduced
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 400, damping: 36, mass: 0.7 }
            }
            className="flex flex-1 flex-col"
          >
            <h1
              ref={headlineRef}
              tabIndex={-1}
              className="mt-2 mb-2 text-balance text-center font-display text-[1.9rem] leading-[1.15] outline-none"
            >
              {headline}
            </h1>
            {subline ? (
              <p className="mx-auto mb-8 max-w-sm text-center text-sm text-paper-300">{subline}</p>
            ) : (
              <div className="mb-8" />
            )}

            <StepBody
              step={step}
              answers={answers}
              submitting={submitting}
              submitError={submitError}
              onAnswer={(value) => {
                if (value !== null) setAnswer(step.key, value);
                goForward(index);
              }}
              onSubmit={submitLead}
            />
          </m.section>
        </AnimatePresence>
      ) : null}
    </main>
  );
}

function StepBody({
  step,
  answers,
  submitting,
  submitError,
  onAnswer,
  onSubmit,
}: {
  step: QuizStepData;
  answers: Record<string, string>;
  submitting: boolean;
  submitError: string | null;
  onAnswer: (value: string | null) => void;
  onSubmit: (data: { email: string; consent: boolean; website: string }) => void;
}) {
  const firstName = deriveFirstName(answers.full_name);

  switch (step.type) {
    case "date_input":
      return (
        <DateWheelStep
          value={answers[step.key]}
          rules={step.validation as { min_year?: number; max_year?: number }}
          onAdvance={onAnswer}
        />
      );
    case "text_input":
      return (
        <TextInputStep
          value={answers[step.key]}
          placeholder={(step.settings.placeholder as string) ?? "e.g. Maria Louise Carter"}
          rules={step.validation as { min_words?: number; max_length?: number }}
          onAdvance={onAnswer}
        />
      );
    case "single_choice":
      return (
        <ChoiceStep
          choices={step.choices}
          value={answers[step.key]}
          optional={Boolean(step.validation.optional)}
          skipLabel={(step.validation.skip_label as string) ?? "Skip this question"}
          onAdvance={onAnswer}
        />
      );
    case "interstitial":
      return (
        <InterstitialStep
          dob={answers.dob}
          durationMs={(step.settings.duration_ms as number) ?? 3500}
          rotatingTexts={((step.settings.rotating_texts as string[]) ?? ["Reading your numbers…"]).map(
            (t) => interpolateQuizCopy(t, firstName),
          )}
          onDone={() => onAnswer(null)}
        />
      );
    case "email_capture":
      return (
        <EmailStep
          settings={step.settings}
          submitting={submitting}
          submitError={submitError}
          onSubmit={onSubmit}
        />
      );
    default:
      return null;
  }
}
