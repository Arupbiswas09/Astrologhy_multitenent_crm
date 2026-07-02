import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { computeProfile } from "@astro-note/numerology";
import { composeReport } from "@astro-note/report-composer";
import { createLead, type QuizChoiceOption } from "@astro-note/cms-sdk";
import { cmsLeads, getTenant, getTenantBlocks, getTenantQuizFlow } from "@/lib/cms";
import { hasMxRecords, isDisposableEmail } from "@/lib/email-checks";
import { sendCapiLead } from "@/lib/meta-capi";
import { deriveFirstName } from "@/lib/interpolate";
import { validateDob, validateFullName } from "@/lib/quiz-validation";
import { allowRequest } from "@/lib/rate-limit";
import { signReportToken } from "@/lib/report-token";

/**
 * POST /api/lead — docs/02 §4 + docs/08 §5.
 * validate → numerology engine → composer → persist lead (Directus, leads
 * token) → signed report token. The beehiiv subscribe is the Directus Flow's
 * job (docs/08 §1 — exactly ONE path, never double-subscribe).
 */

const leadSchema = z.object({
  tenant: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  consent_marketing: z.boolean().default(false),
  website: z.string().max(0, "spam"), // honeypot — must be empty
  answers: z
    .record(z.string().max(64), z.string().max(200))
    .refine((a) => Object.keys(a).length <= 24, "too many answers"),
  utm: z.record(z.string().max(64), z.string().max(200)).optional().default({}),
});

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!allowRequest(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many attempts — give it a minute and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { tenant: tenantSlug, email, consent_marketing, answers, utm } = parsed.data;

  // Answers the engine depends on — server-side authoritative validation.
  const dob = answers.dob ?? "";
  const fullName = answers.full_name ?? "";
  const dobMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const dobError = dobMatch
    ? validateDob({
        year: Number(dobMatch[1]),
        month: Number(dobMatch[2]),
        day: Number(dobMatch[3]),
      })
    : "Missing birth date.";
  const nameError = validateFullName(fullName);
  if (dobError || nameError) {
    return NextResponse.json({ error: dobError ?? nameError }, { status: 400 });
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: "Disposable email addresses can't receive the reading — use your real inbox." },
      { status: 400 },
    );
  }
  if (!(await hasMxRecords(email))) {
    return NextResponse.json(
      { error: "That email domain doesn't seem to exist — check for typos." },
      { status: 400 },
    );
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Unknown site." }, { status: 400 });
  }

  try {
    const now = new Date();
    const profile = computeProfile({ fullBirthName: fullName, dob, now });
    const firstName = deriveFirstName(fullName) ?? "Friend";

    const [blocks, flow] = await Promise.all([
      getTenantBlocks(tenant.id),
      getTenantQuizFlow(tenant.id),
    ]);
    const focusStep = flow?.steps.find((s) => s.step_key === "focus_area");
    const focusChoices = Array.isArray(focusStep?.options)
      ? (focusStep.options as QuizChoiceOption[])
      : [];
    const focusAreaLabel =
      focusChoices.find((c) => c.value === answers.focus_area)?.label ?? "what matters most";

    const report = composeReport({ blocks, profile, answers, firstName, focusAreaLabel, now });

    const leadId = randomUUID();
    const token = await signReportToken(leadId, tenantSlug);

    // Canonical link for the beehiiv Day-0 email; request origin in dev.
    const primaryDomain = tenant.domains?.find((d) => !d.includes("localhost") && !d.includes("127.0.0.1"));
    const base = primaryDomain ? `https://${primaryDomain}` : new URL(request.url).origin;
    const reportUrl = `${base}/report/${token}`;

    await createLead(cmsLeads(), {
      id: leadId,
      tenant: tenant.id,
      email,
      first_name: firstName,
      full_birth_name: fullName.trim(),
      dob,
      gender: answers.gender ?? null,
      answers,
      numbers: profile as unknown as Record<string, unknown>,
      selected_blocks: report.sections.flatMap((s) => (s.blockId ? [s.blockId] : [])),
      utm: Object.keys(utm).length > 0 ? utm : null,
      consent_marketing,
      consent_ts: consent_marketing ? now.toISOString() : null,
      report_token_issued_at: now.toISOString(),
      report_url: reportUrl,
    });

    // Server CAPI Lead (dedup: event_id = lead id, mirrored by the browser
    // pixel). Only with explicit marketing consent; never blocks the response.
    if (consent_marketing && tenant.meta_pixel_id) {
      void sendCapiLead({
        pixelId: tenant.meta_pixel_id,
        email,
        eventId: leadId,
        sourceUrl: reportUrl,
        clientIp: clientIp(request),
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
    }

    return NextResponse.json({ token, event_id: leadId });
  } catch (err) {
    console.error("[/api/lead] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "We couldn't save your reading. Please try again." },
      { status: 500 },
    );
  }
}
