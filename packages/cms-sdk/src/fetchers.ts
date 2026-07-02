import type { CacheOptions, CmsClient } from "./client";
import type {
  ContentBlock,
  Lead,
  LeadCreate,
  Offer,
  QuizFlow,
  QuizStep,
  Tenant,
  TenantSettings,
} from "./types";

/** Default ISR window for content reads (docs/02-ARCHITECTURE.md §5: 300s). */
export const CONTENT_CACHE: CacheOptions = { revalidate: 300 };

export interface TenantDomains {
  slug: string;
  domains: string[];
}

/** Live tenants' domain lists — the middleware host→tenant map source. */
export async function listTenantDomains(
  client: CmsClient,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<TenantDomains[]> {
  return client.items<TenantDomains>(
    "tenants",
    {
      filter: { status: { _eq: "live" } },
      fields: ["slug", "domains"],
      limit: -1,
    },
    cache,
  );
}

/** Lowercases and returns host candidates with and without port. */
export function hostCandidates(host: string): string[] {
  const lower = host.trim().toLowerCase();
  const withoutPort = lower.replace(/:\d+$/, "");
  return lower === withoutPort ? [lower] : [lower, withoutPort];
}

/** Exact host→slug match against tenant domain lists (case/port tolerant). */
export function matchTenantSlug(host: string, tenants: TenantDomains[]): string | null {
  const candidates = hostCandidates(host);
  for (const tenant of tenants) {
    const domains = (tenant.domains ?? []).map((d) => d.toLowerCase());
    if (candidates.some((c) => domains.includes(c))) return tenant.slug;
  }
  return null;
}

export async function getTenantBySlug(
  client: CmsClient,
  slug: string,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<Tenant | null> {
  const rows = await client.items<Tenant>(
    "tenants",
    { filter: { slug: { _eq: slug } }, limit: 1 },
    cache,
  );
  return rows[0] ?? null;
}

export async function getTenantByHost(
  client: CmsClient,
  host: string,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<Tenant | null> {
  const slug = matchTenantSlug(host, await listTenantDomains(client, cache));
  return slug ? getTenantBySlug(client, slug, cache) : null;
}

export interface QuizFlowWithSteps extends QuizFlow {
  steps: QuizStep[];
}

/** Published quiz flow + ordered steps. `slug` defaults to the tenant's first flow. */
export async function getQuizFlow(
  client: CmsClient,
  tenantId: string,
  slug?: string,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<QuizFlowWithSteps | null> {
  const flows = await client.items<QuizFlow>(
    "quiz_flows",
    {
      filter: {
        tenant: { _eq: tenantId },
        status: { _eq: "published" },
        ...(slug ? { slug: { _eq: slug } } : {}),
      },
      limit: 1,
    },
    cache,
  );
  const flow = flows[0];
  if (!flow) return null;

  const steps = await client.items<QuizStep>(
    "quiz_steps",
    { filter: { flow: { _eq: flow.id } }, sort: ["sort"], limit: -1 },
    cache,
  );
  return { ...flow, steps };
}

/** All published content blocks for a tenant (composer input). */
export async function getBlocks(
  client: CmsClient,
  tenantId: string,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<ContentBlock[]> {
  return client.items<ContentBlock>(
    "content_blocks",
    {
      filter: { tenant: { _eq: tenantId }, status: { _eq: "published" } },
      limit: -1,
    },
    cache,
  );
}

export async function getOffers(
  client: CmsClient,
  tenantId: string,
  placement?: Offer["placement"],
  cache: CacheOptions = CONTENT_CACHE,
): Promise<Offer[]> {
  return client.items<Offer>(
    "offers",
    {
      filter: {
        tenant: { _eq: tenantId },
        status: { _eq: "published" },
        ...(placement ? { placement: { _eq: placement } } : {}),
      },
      sort: ["sort"],
      limit: -1,
    },
    cache,
  );
}

export async function getSettings(
  client: CmsClient,
  tenantId: string,
  cache: CacheOptions = CONTENT_CACHE,
): Promise<TenantSettings | null> {
  const rows = await client.items<TenantSettings>(
    "settings",
    { filter: { tenant: { _eq: tenantId } }, limit: 1 },
    cache,
  );
  return rows[0] ?? null;
}

// ── Leads (server-only token — never call from client components) ───────────

export async function createLead(client: CmsClient, lead: LeadCreate): Promise<Lead> {
  return client.createItem<Lead>("leads", lead);
}

export async function getLead(client: CmsClient, id: string): Promise<Lead | null> {
  const rows = await client.items<Lead>(
    "leads",
    { filter: { id: { _eq: id } }, limit: 1 },
    { revalidate: false },
  );
  return rows[0] ?? null;
}
