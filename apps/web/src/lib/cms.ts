import "server-only";
import { cache } from "react";
import {
  createCmsClient,
  getBlocks,
  getOffers,
  getQuizFlow,
  getSettings,
  getTenantBySlug,
  type CmsClient,
} from "@astro-note/cms-sdk";

/** Read-only client (published content; cannot touch leads). */
export function cmsRead(): CmsClient {
  return createCmsClient({
    url: process.env.DIRECTUS_URL ?? "http://localhost:8055",
    token: process.env.DIRECTUS_STATIC_TOKEN,
  });
}

/** Server-only client for lead create/read (never import in client components). */
export function cmsLeads(): CmsClient {
  return createCmsClient({
    url: process.env.DIRECTUS_URL ?? "http://localhost:8055",
    token: process.env.DIRECTUS_LEADS_TOKEN,
  });
}

/** Per-request-deduped tenant fetch (layout + page both call it). */
export const getTenant = cache(async (slug: string) => {
  return getTenantBySlug(cmsRead(), slug, { revalidate: 300, tags: [`tenant:${slug}`] });
});

export const getTenantSettings = cache(async (tenantId: string) => {
  return getSettings(cmsRead(), tenantId, { revalidate: 300, tags: [`settings:${tenantId}`] });
});

export const getTenantQuizFlow = cache(async (tenantId: string) => {
  return getQuizFlow(cmsRead(), tenantId, undefined, {
    revalidate: 300,
    tags: [`quiz:${tenantId}`],
  });
});

export const getTenantBlocks = cache(async (tenantId: string) => {
  return getBlocks(cmsRead(), tenantId, { revalidate: 300, tags: [`blocks:${tenantId}`] });
});

export const getTenantOffers = cache(async (tenantId: string) => {
  return getOffers(cmsRead(), tenantId, "report_end", {
    revalidate: 300,
    tags: [`offers:${tenantId}`],
  });
});
