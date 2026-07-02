import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { createCmsClient, listTenantDomains } from "@astro-note/cms-sdk";
import { ConsentBanner } from "@/components/ConsentBanner";
import { MetaPixel } from "@/components/MetaPixel";
import { getTenant, getTenantSettings } from "@/lib/cms";
import { themeToCssVars } from "@/lib/theme";

/**
 * Tenant shell: resolves the [tenant] segment (set by middleware rewrite),
 * injects the tenant's design-token overrides, and mounts per-tenant
 * analytics. Pages below revalidate on a 300s ISR window (docs/02 §5).
 */

export const dynamicParams = true;

/** Pre-render every live tenant's funnel pages (SSG + ISR). */
export async function generateStaticParams() {
  try {
    const client = createCmsClient({
      url: process.env.DIRECTUS_URL ?? "http://localhost:8055",
      token: process.env.DIRECTUS_STATIC_TOKEN,
    });
    const tenants = await listTenantDomains(client, { revalidate: 300 });
    return tenants.map((t) => ({ tenant: t.slug }));
  } catch {
    // CMS unreachable at build — tenants render on first request instead.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return {};
  const description = "A free, personalized numerology reading — from your name and birth date.";
  return {
    title: {
      default: `${tenant.name} — your personalized numerology reading`,
      template: `%s · ${tenant.name}`,
    },
    description,
    openGraph: {
      siteName: tenant.name,
      title: `${tenant.name} — your personalized numerology reading`,
      description,
      type: "website",
    },
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const settings = await getTenantSettings(tenant.id);
  const cssVars = themeToCssVars(tenant.theme);
  const bannerCopy =
    settings?.cookie_banner ??
    "We use one lightweight, cookie-free analytics tool. Marketing pixels load only if you accept.";

  return (
    <>
      {cssVars ? <style>{cssVars}</style> : null}
      {children}
      <ConsentBanner copy={bannerCopy} />
      {tenant.plausible_domain ? (
        <Script
          defer
          data-domain={tenant.plausible_domain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
      {tenant.meta_pixel_id ? <MetaPixel pixelId={tenant.meta_pixel_id} /> : null}
    </>
  );
}
