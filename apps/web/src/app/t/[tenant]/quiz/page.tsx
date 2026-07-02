import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { QuizChoiceOption } from "@astro-note/cms-sdk";
import { QuizMachine } from "@/components/quiz/QuizMachine";
import type { QuizStepData } from "@/components/quiz/types";
import { getTenant, getTenantQuizFlow } from "@/lib/cms";

/** Quiz shell — statically generated per tenant; steps come from the CMS. */

export const revalidate = 300;

export const metadata: Metadata = { title: "Your reading" };

export default async function QuizPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const flow = await getTenantQuizFlow(tenant.id);
  if (!flow || flow.steps.length === 0) notFound();

  // Serialize only what the client machine needs (keep the RSC payload lean).
  const steps: QuizStepData[] = flow.steps.map((step) => {
    const options = step.options;
    const isChoices = Array.isArray(options);
    return {
      key: step.step_key,
      type: step.type,
      headline: step.headline,
      subline: step.subline,
      choices: isChoices ? (options as QuizChoiceOption[]) : [],
      settings: !isChoices && options ? (options as Record<string, unknown>) : {},
      validation: step.validation ?? {},
      animationKey: step.animation_key,
    };
  });

  return <QuizMachine tenantSlug={slug} steps={steps} />;
}
