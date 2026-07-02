import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TenantSettings } from "@astro-note/cms-sdk";
import { InkGlyph } from "@/components/ink/InkGlyph";
import { LivingNumber } from "@/components/landing/LivingNumber";
import { SiteFooter } from "@/components/site-footer";
import { getTenant, getTenantSettings } from "@/lib/cms";
import { safeLogoSrc } from "@/lib/theme";

/** Landing — docs/05 "Landing (pre-quiz)" + docs/07 tokens. ISR per tenant
 *  (static params come from the tenant layout). */

export const revalidate = 300;

interface LandingCopy {
  headline: string;
  subline: string;
  ctaLabel: string;
  trustRow: string;
  discover: Array<{ title: string; body: string }>;
}

/** CMS-driven copy with doc-05 fallbacks (served if fields are empty). */
function landingCopy(settings: TenantSettings | null): LandingCopy {
  const s = (settings ?? {}) as TenantSettings & {
    landing_headline?: string | null;
    landing_subline?: string | null;
    landing_cta_label?: string | null;
    landing_trust_row?: string | null;
    landing_discover?: Array<{ title: string; body: string }> | null;
  };
  return {
    headline: s.landing_headline ?? "Your numbers have been waiting for you.",
    subline:
      s.landing_subline ?? "A free, personalized numerology reading — from your name and birth date.",
    ctaLabel: s.landing_cta_label ?? "Begin my reading",
    trustRow: s.landing_trust_row ?? "2-minute reading · 100% free · No signup to start",
    discover: s.landing_discover ?? [
      {
        title: "Your Life Path, decoded",
        body: "The single number your birth date reduces to — and what it says about the direction your life keeps pulling toward.",
      },
      {
        title: "Every letter, weighed",
        body: "Your birth name carries values. Watch them turn into your Expression, Soul Urge, and Personality numbers.",
      },
      {
        title: "The year you're in",
        body: "Your Personal Year sets the season's tempo. Learn what this cycle rewards — and what it quietly resists.",
      },
    ],
  };
}

export default async function LandingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const settings = await getTenantSettings(tenant.id);
  const copy = landingCopy(settings);
  const logo = safeLogoSrc(tenant.theme?.logoLight);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-lg">
      {/* Hero — thumb-zone CTA, ink glow, living number */}
      <section className="ink-glow relative flex flex-1 flex-col items-center px-6 pt-8 text-center">
        {logo ? (
          <Image src={logo} alt={tenant.name} width={132} height={36} priority className="h-8 w-auto opacity-90" />
        ) : (
          <p className="font-annotation text-xl text-gold-400">{tenant.name}</p>
        )}

        <div className="mt-8 mb-2">
          <LivingNumber size={185} />
        </div>

        <h1 className="mt-4 text-balance font-display text-[2.35rem] leading-[1.12] font-medium">
          {copy.headline}
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-paper-300">{copy.subline}</p>

        <div className="mt-auto w-full pt-10 pb-6">
          <Link
            href="/quiz"
            className="block w-full rounded-card bg-gold-400 px-6 py-4 text-center text-lg font-medium text-ink-950 transition-transform duration-150 hover:bg-gold-200 active:scale-[0.98]"
          >
            {copy.ctaLabel}
          </Link>
          <p className="mt-4 text-sm text-paper-300/90">{copy.trustRow}</p>
        </div>
      </section>

      {/* Below the fold — what you'll discover */}
      <section className="px-6 pt-10">
        <h2 className="mb-5 text-center font-annotation text-2xl text-gold-400">
          What you&apos;ll discover
        </h2>
        <div className="space-y-4">
          {copy.discover.map((card, i) => (
            <article
              key={card.title}
              className="flex gap-4 rounded-card border border-ink-700 bg-ink-900 p-5"
            >
              <div className="mt-1 shrink-0 text-gold-400">
                <InkGlyph value={i + 1} size={26} />
              </div>
              <div>
                <h3 className="font-display text-lg text-paper-100">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-paper-300">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter settings={settings} tenantName={tenant.name} />
    </main>
  );
}
