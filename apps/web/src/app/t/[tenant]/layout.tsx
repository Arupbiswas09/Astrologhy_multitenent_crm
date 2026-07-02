import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { createCmsClient, listTenantDomains } from "@astro-note/cms-sdk";
import { getTenant } from "@/lib/cms";
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
  return {
    title: {
      default: `${tenant.name} — your personalized numerology reading`,
      template: `%s · ${tenant.name}`,
    },
    description: "A free, personalized numerology reading — from your name and birth date.",
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

  const cssVars = themeToCssVars(tenant.theme);

  return (
    <>
      {cssVars ? <style>{cssVars}</style> : null}
      {children}
      {tenant.plausible_domain ? (
        <Script
          defer
          data-domain={tenant.plausible_domain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
