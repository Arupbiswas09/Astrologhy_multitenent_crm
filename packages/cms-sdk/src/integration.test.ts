/**
 * Integration test against a LOCAL seeded Directus (docs/09 Phase 2 checklist).
 * Run: pnpm cms:up && pnpm cms:seed && pnpm --filter @astro-note/cms-sdk test:integration
 * Skipped unless RUN_CMS_INTEGRATION=1 (CI has no Directus).
 */
import { describe, expect, it } from "vitest";
import { createCmsClient } from "./client";
import {
  getBlocks,
  getOffers,
  getQuizFlow,
  getSettings,
  getTenantByHost,
  getTenantBySlug,
  listTenantDomains,
} from "./fetchers";

const RUN = process.env.RUN_CMS_INTEGRATION === "1";
const url = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const token = process.env.DIRECTUS_WEB_TOKEN ?? "astro-note-web-read-token";

const REPORT_SECTIONS = [
  "opening",
  "life_path_core",
  "expression",
  "soul_urge",
  "personality",
  "focus_bridge",
  "feeling_mirror",
  "relationship_lens",
  "personal_year",
  "strengths",
  "challenges",
  "teaser_locked",
  "closing_cta",
] as const;

describe.runIf(RUN)("cms-sdk ↔ local Directus", () => {
  const client = createCmsClient({ url, token });

  it("resolves the astro-note tenant by slug with its theme", async () => {
    const tenant = await getTenantBySlug(client, "astro-note");
    expect(tenant).not.toBeNull();
    expect(tenant?.name).toBe("Astro Note");
    expect(tenant?.status).toBe("live");
    expect(tenant?.theme?.colors?.["gold-400"]).toBe("#E4B85C");
    expect(tenant?.domains).toContain("astronote.com");
  });

  it("resolves tenants by host (both seeded tenants, different themes)", async () => {
    const astro = await getTenantByHost(client, "www.astronote.com");
    const moon = await getTenantByHost(client, "moonletter.local");
    expect(astro?.slug).toBe("astro-note");
    expect(moon?.slug).toBe("moon-letter");
    expect(astro?.theme?.colors?.["gold-400"]).not.toBe(moon?.theme?.colors?.["gold-400"]);
    await expect(getTenantByHost(client, "unknown.example")).resolves.toBeNull();
  });

  it("lists live tenant domains for the middleware map", async () => {
    const domains = await listTenantDomains(client);
    const slugs = domains.map((d) => d.slug);
    expect(slugs).toContain("astro-note");
    expect(slugs).toContain("moon-letter");
  });

  it("loads the published quiz flow with 9 ordered steps and doc-05 copy", async () => {
    const tenant = await getTenantBySlug(client, "astro-note");
    const flow = await getQuizFlow(client, tenant!.id);
    expect(flow).not.toBeNull();
    expect(flow?.email_step_index).toBe(9);
    expect(flow?.steps).toHaveLength(9);
    expect(flow?.steps.map((s) => s.step_key)).toEqual([
      "dob",
      "full_name",
      "gender",
      "focus_area",
      "current_feeling",
      "relationship_status",
      "belief_level",
      "calculating",
      "email",
    ]);
    const dob = flow?.steps[0];
    expect(dob?.headline).toBe("First — when were you born?");
    expect(dob?.type).toBe("date_input");
  });

  it("has a published wildcard block for every report section (composer fallback contract)", async () => {
    const tenant = await getTenantBySlug(client, "astro-note");
    const blocks = await getBlocks(client, tenant!.id);
    for (const section of REPORT_SECTIONS) {
      const wildcard = blocks.find(
        (b) => b.section === section && (!b.match || Object.keys(b.match).length === 0),
      );
      expect(wildcard, `wildcard for ${section}`).toBeDefined();
    }
    // demonstration variants exist
    expect(blocks.some((b) => b.section === "life_path_core" && b.match?.life_path)).toBe(true);
  });

  it("loads offers and settings", async () => {
    const tenant = await getTenantBySlug(client, "astro-note");
    const offers = await getOffers(client, tenant!.id, "report_end");
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0]?.cta_url).toContain("{{sub_id}}");

    const settings = await getSettings(client, tenant!.id);
    expect(settings?.support_email).toContain("@");
    expect(settings?.footer_links?.map((l) => l.url)).toContain("/privacy");
  });

  it("web-read token CANNOT read leads (docs/02 §7)", async () => {
    await expect(client.items("leads")).rejects.toMatchObject({ status: 403 });
  });
});
