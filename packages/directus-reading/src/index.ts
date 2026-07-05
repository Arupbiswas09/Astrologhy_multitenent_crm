import { randomUUID } from "node:crypto";
import { defineEndpoint } from "@directus/extensions-sdk";
import { computeProfile } from "@astro-note/numerology";
import {
  composeReport,
  interpolate,
  type ComposerBlock,
} from "@astro-note/report-composer";
import { deriveFirstName, leadSchema, validateDob, validateFullName } from "./validation";
import { hasMxRecords, isDisposableEmail } from "./email-checks";
import { allowRequest } from "./rate-limit";
import { signReportToken, verifyReportToken } from "./token";

/**
 * Astro Note backend as a Directus endpoint (mounted at /reading).
 * Consolidates lead capture + the numerology engine + report composition
 * into the CMS, so the frontend can be fully static (R2 + Cloudflare CDN).
 *
 *   POST /reading/lead          → validate, compute, persist, return {token}
 *   GET  /reading/report/:token → verified, recomposed reading JSON (no PII)
 *   GET  /reading/tenant/:host  → public tenant config for the static shell
 */

const COREG_COUNTRIES = new Set(["US", "GB", "CA"]);

const SECTION_LABELS: Record<string, string> = {
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

function clientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim() || "unknown";
  return req.ip || "unknown";
}

function publicTheme(tenant: Record<string, unknown>) {
  return {
    slug: tenant.slug,
    name: tenant.name,
    theme: tenant.theme ?? null,
    plausible_domain: tenant.plausible_domain ?? null,
    meta_pixel_id: tenant.meta_pixel_id ?? null,
  };
}

export default defineEndpoint({
  id: "reading",
  handler: (router, context) => {
  const { services, getSchema, env, logger } = context as {
    services: { ItemsService: new (c: string, o: unknown) => AnyItems };
    getSchema: () => Promise<unknown>;
    env: Record<string, string | undefined>;
    logger: { error: (...a: unknown[]) => void };
  };
  const { ItemsService } = services;

  interface AnyItems {
    readByQuery(q: unknown): Promise<Record<string, unknown>[]>;
    readOne(id: string, q?: unknown): Promise<Record<string, unknown>>;
    createOne(data: unknown): Promise<string>;
  }

  const secret = env.REPORT_TOKEN_SECRET ?? "";

  async function svc(collection: string): Promise<AnyItems> {
    const schema = await getSchema();
    return new ItemsService(collection, { schema, accountability: null });
  }

  async function loadTenantBySlug(slug: string) {
    const rows = await (await svc("tenants")).readByQuery({
      filter: { _and: [{ slug: { _eq: slug } }, { status: { _eq: "live" } }] },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async function loadTenantByHost(host: string) {
    const normalized = host.toLowerCase().replace(/:\d+$/, "");
    const rows = await (await svc("tenants")).readByQuery({
      filter: { status: { _eq: "live" } },
      limit: -1,
      fields: ["*"],
    });
    return (
      rows.find((t) => Array.isArray(t.domains) && (t.domains as string[]).includes(normalized)) ??
      rows.find((t) => Array.isArray(t.domains) && (t.domains as string[]).includes(host)) ??
      null
    );
  }

  async function loadFocusLabel(tenantId: string, focusValue: string): Promise<string> {
    const flows = await (await svc("quiz_flows")).readByQuery({
      filter: { tenant: { _eq: tenantId } },
      limit: 1,
    });
    const flow = flows[0];
    if (!flow) return "what matters most";
    const steps = await (await svc("quiz_steps")).readByQuery({
      filter: { _and: [{ flow: { _eq: flow.id } }, { step_key: { _eq: "focus_area" } }] },
      limit: 1,
    });
    const options = steps[0]?.options;
    if (Array.isArray(options)) {
      const found = (options as { value: string; label: string }[]).find(
        (o) => o.value === focusValue,
      );
      if (found) return found.label;
    }
    return "what matters most";
  }

  async function loadBlocks(tenantId: string): Promise<ComposerBlock[]> {
    const rows = await (await svc("content_blocks")).readByQuery({
      filter: { _and: [{ tenant: { _eq: tenantId } }, { status: { _eq: "published" } }] },
      limit: -1,
      fields: ["id", "section", "match", "priority", "body", "visual_key"],
    });
    return rows as unknown as ComposerBlock[];
  }

  // ── POST /reading/lead ───────────────────────────────────────────────────
  router.post("/lead", async (req, res) => {
    try {
      if (!allowRequest(clientIp(req as never))) {
        return res.status(429).json({ error: "Too many attempts — give it a minute." });
      }
      const parsed = leadSchema.safeParse((req as { body: unknown }).body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Please check your details and try again." });
      }
      const { tenant: slug, email, consent_marketing, answers, utm } = parsed.data;

      const dob = answers.dob ?? "";
      const fullName = answers.full_name ?? "";
      const dobErr = validateDob(dob);
      const nameErr = validateFullName(fullName);
      if (dobErr || nameErr) return res.status(400).json({ error: dobErr ?? nameErr });

      if (isDisposableEmail(email)) {
        return res.status(400).json({ error: "Disposable email addresses can't receive the reading." });
      }
      if (!(await hasMxRecords(email))) {
        return res.status(400).json({ error: "That email domain doesn't seem to exist." });
      }

      const tenant = await loadTenantBySlug(slug);
      if (!tenant) return res.status(400).json({ error: "Unknown site." });

      const now = new Date();
      const profile = computeProfile({ fullBirthName: fullName, dob, now });
      const firstName = deriveFirstName(fullName) ?? "Friend";
      const [blocks, focusAreaLabel] = await Promise.all([
        loadBlocks(tenant.id as string),
        loadFocusLabel(tenant.id as string, answers.focus_area ?? ""),
      ]);
      const report = composeReport({ blocks, profile, answers, firstName, focusAreaLabel, now });

      const leadId = randomUUID();
      const token = await signReportToken(leadId, slug, secret);

      const domains = Array.isArray(tenant.domains) ? (tenant.domains as string[]) : [];
      const primary = domains.find((d) => !d.includes("localhost") && !d.includes("127.0.0.1"));
      const reportUrl = primary ? `https://${primary}/report/${token}` : `/report/${token}`;

      await (await svc("leads")).createOne({
        id: leadId,
        tenant: tenant.id,
        email,
        first_name: firstName,
        full_birth_name: fullName.trim(),
        dob,
        gender: answers.gender ?? null,
        answers,
        numbers: profile,
        selected_blocks: report.sections.flatMap((s) => (s.blockId ? [s.blockId] : [])),
        utm: Object.keys(utm).length > 0 ? utm : null,
        consent_marketing,
        consent_ts: consent_marketing ? now.toISOString() : null,
        report_token_issued_at: now.toISOString(),
        report_url: reportUrl,
      });

      return res.json({ token, event_id: leadId });
    } catch (err) {
      logger.error("[reading/lead] " + (err instanceof Error ? err.message : String(err)));
      return res.status(500).json({ error: "We couldn't save your reading. Please try again." });
    }
  });

  // ── GET /reading/report/:token ───────────────────────────────────────────
  router.get("/report/:token", async (req, res) => {
    try {
      const token = (req as { params: { token: string } }).params.token;
      const country = String((req as { query: Record<string, unknown> }).query.country ?? "");
      const payload = await verifyReportToken(token, secret);
      if (!payload) return res.status(404).json({ error: "Invalid or expired link." });

      const lead = await (await svc("leads")).readOne(payload.leadId).catch(() => null);
      if (!lead) return res.status(404).json({ error: "Reading not found." });

      const tenant = await loadTenantBySlug(payload.tenantSlug);
      if (!tenant || lead.tenant !== tenant.id) {
        return res.status(404).json({ error: "Reading not found." });
      }

      const now = new Date();
      const answers = (lead.answers ?? {}) as Record<string, string>;
      const profile = computeProfile({
        fullBirthName: lead.full_birth_name as string,
        dob: lead.dob as string,
        now,
      });
      const firstName = (lead.first_name as string) ?? "Friend";
      const [blocks, focusAreaLabel, offers, settingsRows] = await Promise.all([
        loadBlocks(tenant.id as string),
        loadFocusLabel(tenant.id as string, answers.focus_area ?? ""),
        (await svc("offers")).readByQuery({
          filter: {
            _and: [
              { tenant: { _eq: tenant.id } },
              { status: { _eq: "published" } },
              { placement: { _eq: "report_end" } },
            ],
          },
          sort: ["sort"],
          limit: -1,
        }),
        (await svc("settings")).readByQuery({ filter: { tenant: { _eq: tenant.id } }, limit: 1 }),
      ]);

      const report = composeReport({ blocks, profile, answers, firstName, focusAreaLabel, now });

      // Persisted blocks win except the intentionally time-varying personal_year.
      const persisted = new Set((lead.selected_blocks as string[]) ?? []);
      const sections = report.sections.map((section) => {
        if (section.section === "personal_year") return section;
        const pinned = blocks.find((b) => b.section === section.section && persisted.has(b.id));
        if (!pinned || pinned.id === section.blockId) return section;
        return {
          ...section,
          blockId: pinned.id,
          body: interpolate(pinned.body, report.context),
          visualKey: pinned.visual_key ?? null,
        };
      });

      const showCoreg =
        tenant.coreg_provider !== "none" &&
        Boolean(tenant.coreg_embed_code) &&
        COREG_COUNTRIES.has(country.toUpperCase());

      const settings = settingsRows[0] ?? null;
      const sub = (url: string) => url.replaceAll("{{sub_id}}", lead.id as string);

      return res.json({
        tenant: publicTheme(tenant),
        firstName,
        numbers: {
          lifePath: profile.lifePath,
          lifePathIsMaster: profile.lifePathIsMaster,
          expression: profile.expression,
          soulUrge: profile.soulUrge,
          personality: profile.personality,
          personalYear: profile.personalYear,
          birthday: profile.birthday,
          nameLetters: profile.breakdown.nameLetters,
        },
        sectionLabels: SECTION_LABELS,
        sections: sections.map((s) => ({
          section: s.section,
          body: s.body,
          visualKey: s.visualKey,
        })),
        coreg: showCoreg ? { embedCode: tenant.coreg_embed_code } : null,
        offers: (offers as Record<string, unknown>[]).map((o) => ({
          id: o.id,
          title: o.title,
          body: o.body,
          cta_label: o.cta_label,
          cta_url: sub(o.cta_url as string),
        })),
        settings: settings
          ? {
              footer_links: settings.footer_links ?? null,
              support_email: settings.support_email ?? null,
            }
          : null,
      });
    } catch (err) {
      logger.error("[reading/report] " + (err instanceof Error ? err.message : String(err)));
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  // ── GET /reading/tenant/:host ────────────────────────────────────────────
  // Public tenant config for the static shell to theme + drive the quiz.
  router.get("/tenant/:host", async (req, res) => {
    try {
      const host = (req as { params: { host: string } }).params.host;
      const tenant = await loadTenantByHost(host);
      if (!tenant) return res.status(404).json({ error: "Unknown site." });

      const flows = await (await svc("quiz_flows")).readByQuery({
        filter: { _and: [{ tenant: { _eq: tenant.id } }, { status: { _eq: "published" } }] },
        limit: 1,
      });
      const flow = flows[0];
      const steps = flow
        ? await (await svc("quiz_steps")).readByQuery({
            filter: { flow: { _eq: flow.id } },
            sort: ["sort"],
            limit: -1,
          })
        : [];
      const settingsRows = await (await svc("settings")).readByQuery({
        filter: { tenant: { _eq: tenant.id } },
        limit: 1,
      });

      return res.json({
        tenant: publicTheme(tenant),
        flow: flow ? { email_step_index: flow.email_step_index, settings: flow.settings } : null,
        steps: steps.map((s) => ({
          key: s.step_key,
          type: s.type,
          headline: s.headline,
          subline: s.subline,
          options: s.options,
          validation: s.validation,
          animationKey: s.animation_key,
        })),
        settings: settingsRows[0] ?? null,
      });
    } catch (err) {
      logger.error("[reading/tenant] " + (err instanceof Error ? err.message : String(err)));
      return res.status(500).json({ error: "Something went wrong." });
    }
  });
  },
});
