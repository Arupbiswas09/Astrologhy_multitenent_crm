import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { computeProfile } from "@astro-note/numerology";
import { composeReport, interpolate, type ComposedSection } from "@astro-note/report-composer";
import { getLead, type QuizChoiceOption } from "@astro-note/cms-sdk";
import { InkGlyph } from "@/components/ink/InkGlyph";
import { InkNumber } from "@/components/ink/InkNumber";
import { MotionProvider } from "@/components/motion";
import { CalcMoment } from "@/components/report/CalcMoment";
import { CoRegSlot } from "@/components/report/CoRegSlot";
import { OfferCta, ReportAnalytics, ShareRow } from "@/components/report/ReportChrome";
import { RevealSection } from "@/components/report/RevealSection";
import { SiteFooter } from "@/components/site-footer";
import {
  cmsLeads,
  getTenant,
  getTenantBlocks,
  getTenantOffers,
  getTenantQuizFlow,
  getTenantSettings,
} from "@/lib/cms";
import { Markdown } from "@/lib/markdown";
import { verifyReportToken } from "@/lib/report-token";

/**
 * /report/[token] — the personalized reading (docs/06 §1). Server component:
 * verifies the signed token, loads the lead, re-composes deterministically
 * (persisted block IDs win; the personal_year section stays live so return
 * visits update with the calendar).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your reading",
  robots: { index: false, follow: false },
};

const COREG_COUNTRIES = new Set(["US", "GB", "CA"]);

const SECTION_LABELS: Partial<Record<ComposedSection["section"], string>> = {
  life_path_core: "Your Life Path",
  expression: "Expression",
  soul_urge: "Soul Urge",
  personality: "Personality",
  focus_bridge: "Where it points now",
  relationship_lens: "Your heart's lens",
  personal_year: "Your year",
  strengths: "Where you're strong",
  challenges: "Where it gets heavy",
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ tenant: string; token: string }>;
}) {
  const { tenant: slug, token } = await params;

  const payload = await verifyReportToken(token);
  if (!payload || payload.tenantSlug !== slug) notFound();

  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const lead = await getLead(cmsLeads(), payload.leadId).catch(() => null);
  if (!lead || lead.tenant !== tenant.id) notFound();

  const now = new Date();
  const profile = computeProfile({
    fullBirthName: lead.full_birth_name,
    dob: lead.dob,
    now,
  });

  const headerList = await headers();
  const [blocks, flow, offers, settings] = await Promise.all([
    getTenantBlocks(tenant.id),
    getTenantQuizFlow(tenant.id),
    getTenantOffers(tenant.id),
    getTenantSettings(tenant.id),
  ]);

  const focusStep = flow?.steps.find((s) => s.step_key === "focus_area");
  const focusChoices = Array.isArray(focusStep?.options)
    ? (focusStep.options as QuizChoiceOption[])
    : [];
  const focusAreaLabel =
    focusChoices.find((c) => c.value === lead.answers.focus_area)?.label ?? "what matters most";

  const firstName = lead.first_name ?? "Friend";
  const report = composeReport({
    blocks,
    profile,
    answers: lead.answers,
    firstName,
    focusAreaLabel,
    now,
  });

  // Reproducibility (docs/06 §3): persisted block IDs win over live selection
  // for every section except the intentionally time-varying personal_year.
  const persisted = new Set(lead.selected_blocks ?? []);
  const sections = report.sections.map((section) => {
    if (section.section === "personal_year") return section;
    const persistedBlock = blocks.find(
      (b) => b.section === section.section && persisted.has(b.id),
    );
    if (!persistedBlock || persistedBlock.id === section.blockId) return section;
    return {
      ...section,
      blockId: persistedBlock.id,
      body: interpolate(persistedBlock.body, report.context),
      visualKey: persistedBlock.visual_key ?? null,
    };
  });

  const bySection = new Map(sections.map((s) => [s.section, s]));
  const country =
    headerList.get("cf-ipcountry") ?? headerList.get("x-vercel-ip-country") ?? "";
  const showCoreg =
    tenant.coreg_provider !== "none" &&
    Boolean(tenant.coreg_embed_code) &&
    COREG_COUNTRIES.has(country.toUpperCase());

  const sub = (url: string) => url.replaceAll("{{sub_id}}", lead.id);

  function Section({
    name,
    accent = false,
  }: {
    name: ComposedSection["section"];
    accent?: boolean;
  }) {
    const data = bySection.get(name);
    if (!data?.body) return null;
    const label = SECTION_LABELS[name];
    return (
      <RevealSection className="mt-10">
        {label ? (
          <div className="mb-3 flex items-center gap-2.5">
            <span className={accent ? "text-violet-500" : "text-gold-400"} aria-hidden>
              <InkGlyph value={profile.lifePath} size={22} />
            </span>
            <h2 className={`font-annotation text-2xl ${accent ? "text-violet-500" : "text-gold-400"}`}>
              {label}
            </h2>
          </div>
        ) : null}
        <Markdown text={data.body} className="text-paper-100/90" />
      </RevealSection>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-10 pb-8 md:max-w-lg">
      <ReportAnalytics tenantSlug={slug} />

      {/* 1 — Hero reveal: finishes the open loop from the interstitial */}
      <MotionProvider>
        <section className="ink-glow flex flex-col items-center pt-6 pb-2 text-center">
          <p className="font-annotation text-2xl text-gold-400">{firstName}, you are a</p>
          <h1 className="sr-only">
            {firstName}, you are a Life Path {profile.lifePath}
          </h1>
          <div className="my-4">
            <InkNumber value={profile.lifePath} size={225} animate="mount" />
          </div>
          <p className="font-display text-3xl">
            Life Path {profile.lifePath}
            {profile.lifePathIsMaster ? (
              <span className="ml-2 align-middle font-annotation text-xl text-gold-200">
                master number
              </span>
            ) : null}
          </p>
        </section>
      </MotionProvider>

      <Section name="opening" />
      <Section name="feeling_mirror" />
      <Section name="life_path_core" />

      {/* 4 — Calculation moment */}
      <RevealSection className="mt-10">
        <CalcMoment letters={profile.breakdown.nameLetters} expression={profile.expression} />
      </RevealSection>

      {/* 5 — the three name numbers */}
      <div className="mt-2">
        <Section name="expression" />
        <Section name="soul_urge" />
        <Section name="personality" />
      </div>

      <Section name="focus_bridge" />
      <Section name="relationship_lens" />

      {/* 8 — Personal year (violet accent — the one allowed secondary color) */}
      <Section name="personal_year" accent />

      {/* 9 — co-registration (geo-gated server-side) */}
      {showCoreg ? (
        <RevealSection className="mt-12">
          <CoRegSlot embedCode={tenant.coreg_embed_code as string} tenantSlug={slug} />
        </RevealSection>
      ) : null}

      {/* 10 — locked teaser (open loop → email opens) */}
      {bySection.get("teaser_locked")?.body ? (
        <RevealSection className="mt-12">
          <div className="relative overflow-hidden rounded-card border border-ink-700 bg-ink-900 p-5">
            <div aria-hidden className="pointer-events-none select-none blur-[6px]">
              <Markdown text={bySection.get("teaser_locked")?.body ?? ""} className="text-paper-100/80" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/40 px-6 text-center">
              <span aria-hidden className="mb-2 text-2xl">
                🔒
              </span>
              <p className="font-display text-lg">One number stayed hidden.</p>
              <p className="mt-1 text-sm text-paper-300">
                It&apos;s waiting in your emailed full reading.
              </p>
            </div>
          </div>
        </RevealSection>
      ) : null}

      {/* 11 — twin cards */}
      <div className="mt-2 md:grid md:grid-cols-2 md:gap-4">
        <Section name="strengths" />
        <Section name="challenges" />
      </div>

      <Section name="closing_cta" />

      {/* 12 — offers */}
      {offers.length > 0 ? (
        <RevealSection className="mt-12">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-card border border-ink-700 bg-ink-900 p-5">
              <h2 className="font-display text-xl">{offer.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-paper-300">{offer.body}</p>
              <OfferCta href={sub(offer.cta_url)} label={offer.cta_label} tenantSlug={slug} />
            </div>
          ))}
        </RevealSection>
      ) : null}

      {/* 13 — share row */}
      <div className="mt-12">
        <ShareRow landingUrl="/" />
      </div>

      <SiteFooter settings={settings} tenantName={tenant.name} />
    </main>
  );
}
