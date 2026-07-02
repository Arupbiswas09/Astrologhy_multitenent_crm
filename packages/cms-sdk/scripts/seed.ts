/**
 * Idempotent Directus seed — docs/03-CMS-SCHEMA.md + docs/09 Phase 2.
 *
 * Creates (only if missing — existing rows/collections are never overwritten,
 * so owner edits in the CMS always win):
 *   1. Collections, fields, relations (seed-schema.ts)
 *   2. Roles/policies/users: "Web Read" (published content only, NO leads) and
 *      "Leads Writer" (create/read leads) with static tokens from env
 *   3. Flows 1–3 (beehiiv subscribe w/ 3 attempts, notify stub, nightly export stub)
 *   4. Content: tenants, quiz flow + 9 steps, wildcard + variant blocks, offer, settings
 *
 * Usage: pnpm cms:seed   (env: DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN,
 *                              DIRECTUS_WEB_TOKEN, DIRECTUS_LEADS_TOKEN)
 */

import { COLLECTIONS, RELATIONS } from "./seed-schema";
import {
  OFFERS,
  QUIZ_FLOW,
  QUIZ_STEPS,
  SETTINGS,
  TENANTS,
  VARIANT_BLOCKS,
  WILDCARD_BLOCKS,
} from "./seed-data";

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "");
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? "astro-note-admin-token";
const WEB_TOKEN = process.env.DIRECTUS_WEB_TOKEN ?? "astro-note-web-read-token";
const LEADS_TOKEN = process.env.DIRECTUS_LEADS_TOKEN ?? "astro-note-leads-token";

let created = 0;
let skipped = 0;

async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; allow404?: boolean } = {},
): Promise<T | null> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 404 || res.status === 403) {
    // Directus answers 403 for unknown collections/fields even as admin
    if (init.allow404) return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}\n${text.slice(0, 800)}`);
  }
  if (res.status === 204) return null;
  const json = (await res.json()) as { data: T };
  return json.data;
}

function log(action: "create" | "skip", what: string) {
  if (action === "create") {
    created++;
    console.log(`  + ${what}`);
  } else {
    skipped++;
    console.log(`  = ${what} (exists)`);
  }
}

// ── schema ───────────────────────────────────────────────────────────────────

async function ensureCollections() {
  console.log("Collections:");
  for (const def of COLLECTIONS) {
    const existing = await api(`/collections/${def.collection}`, { allow404: true });
    if (existing) {
      log("skip", `collection ${def.collection}`);
      // additive: create any missing fields on existing collections
      for (const field of def.fields) {
        const f = await api(`/fields/${def.collection}/${field.field}`, { allow404: true });
        if (!f) {
          await api(`/fields/${def.collection}`, { method: "POST", body: field });
          log("create", `field ${def.collection}.${field.field}`);
        }
      }
      continue;
    }
    await api("/collections", { method: "POST", body: def });
    log("create", `collection ${def.collection}`);
  }
}

async function ensureRelations() {
  console.log("Relations:");
  for (const rel of RELATIONS) {
    const existing = await api(`/relations/${rel.collection}/${rel.field}`, { allow404: true });
    if (existing) {
      log("skip", `relation ${rel.collection}.${rel.field}`);
      continue;
    }
    await api("/relations", {
      method: "POST",
      body: {
        collection: rel.collection,
        field: rel.field,
        related_collection: rel.related_collection,
        schema: { on_delete: "SET NULL", ...(rel.schema ?? {}) },
      },
    });
    log("create", `relation ${rel.collection}.${rel.field} → ${rel.related_collection}`);
  }
}

// ── access control ───────────────────────────────────────────────────────────

type Row = { id: string } & Record<string, unknown>;

async function findOne(path: string, filter: Record<string, unknown>): Promise<Row | null> {
  const rows = await api<Row[]>(
    `${path}?filter=${encodeURIComponent(JSON.stringify(filter))}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function ensurePolicy(name: string): Promise<string> {
  const existing = await findOne("/policies", { name: { _eq: name } });
  if (existing) {
    log("skip", `policy ${name}`);
    return existing.id;
  }
  const row = await api<Row>("/policies", {
    method: "POST",
    body: { name, icon: "badge", admin_access: false, app_access: false },
  });
  log("create", `policy ${name}`);
  return (row as Row).id;
}

async function ensurePermission(
  policy: string,
  collection: string,
  action: string,
  permissions: Record<string, unknown> | null = null,
) {
  const existing = await findOne("/permissions", {
    _and: [
      { policy: { _eq: policy } },
      { collection: { _eq: collection } },
      { action: { _eq: action } },
    ],
  });
  if (existing) {
    log("skip", `permission ${collection}.${action}`);
    return;
  }
  await api("/permissions", {
    method: "POST",
    body: { policy, collection, action, permissions, validation: null, presets: null, fields: ["*"] },
  });
  log("create", `permission ${collection}.${action}`);
}

async function ensureRole(name: string): Promise<string> {
  const existing = await findOne("/roles", { name: { _eq: name } });
  if (existing) {
    log("skip", `role ${name}`);
    return existing.id;
  }
  const row = await api<Row>("/roles", {
    method: "POST",
    body: { name, icon: "public", description: "Created by cms seed" },
  });
  log("create", `role ${name}`);
  return (row as Row).id;
}

async function ensureAccess(policyId: string, target: { role?: string; user?: string }) {
  const filter: Record<string, unknown> = { policy: { _eq: policyId } };
  if (target.role) filter.role = { _eq: target.role };
  if (target.user) filter.user = { _eq: target.user };
  const existing = await findOne("/access", { _and: [filter] });
  if (existing) {
    log("skip", `access policy↔${target.role ? "role" : "user"}`);
    return;
  }
  await api("/access", { method: "POST", body: { policy: policyId, ...target } });
  log("create", `access policy↔${target.role ? "role" : "user"}`);
}

async function ensureUser(email: string, role: string, token: string): Promise<string> {
  const existing = await findOne("/users", { email: { _eq: email } });
  if (existing) {
    log("skip", `user ${email}`);
    return existing.id;
  }
  const row = await api<Row>("/users", {
    method: "POST",
    body: {
      email,
      role,
      token,
      first_name: "Service",
      last_name: email.split("@")[0],
      status: "active",
    },
  });
  log("create", `user ${email}`);
  return (row as Row).id;
}

async function ensureAccessControl() {
  console.log("Access control:");

  // Web Read — published content only, zero access to leads (docs/02 §7)
  const webPolicy = await ensurePolicy("Web Read");
  await ensurePermission(webPolicy, "tenants", "read", { status: { _eq: "live" } });
  await ensurePermission(webPolicy, "quiz_flows", "read", { status: { _eq: "published" } });
  await ensurePermission(webPolicy, "quiz_steps", "read", {
    flow: { status: { _eq: "published" } },
  });
  await ensurePermission(webPolicy, "content_blocks", "read", {
    status: { _eq: "published" },
  });
  await ensurePermission(webPolicy, "offers", "read", { status: { _eq: "published" } });
  await ensurePermission(webPolicy, "settings", "read");
  await ensurePermission(webPolicy, "directus_files", "read");
  const webRole = await ensureRole("Web");
  await ensureAccess(webPolicy, { role: webRole });
  await ensureUser("web-service@astronote.com", webRole, WEB_TOKEN);

  // Leads Writer — server-only token used by /api/lead + report page
  const leadsPolicy = await ensurePolicy("Leads Writer");
  await ensurePermission(leadsPolicy, "leads", "create");
  await ensurePermission(leadsPolicy, "leads", "read");
  const leadsRole = await ensureRole("Leads API");
  await ensureAccess(leadsPolicy, { role: leadsRole });
  await ensureUser("leads-service@astronote.com", leadsRole, LEADS_TOKEN);
}

// ── flows ────────────────────────────────────────────────────────────────────

type OpDef = {
  key: string;
  type: string;
  name: string;
  options: Record<string, unknown>;
  resolve?: string;
  reject?: string;
  x: number;
  y: number;
};

async function ensureFlow(
  flow: { name: string; status: string; trigger: string; options: Record<string, unknown> },
  ops: OpDef[],
  rootKey: string,
) {
  const existing = await findOne("/flows", { name: { _eq: flow.name } });
  if (existing) {
    log("skip", `flow ${flow.name}`);
    return;
  }
  const row = await api<Row>("/flows", {
    method: "POST",
    body: { ...flow, icon: "bolt", accountability: "all" },
  });
  const flowId = (row as Row).id;

  // create ops without edges, then wire resolve/reject by key
  const ids = new Map<string, string>();
  for (const op of ops) {
    const opRow = await api<Row>("/operations", {
      method: "POST",
      body: {
        flow: flowId,
        key: op.key,
        name: op.name,
        type: op.type,
        position_x: op.x,
        position_y: op.y,
        options: op.options,
      },
    });
    ids.set(op.key, (opRow as Row).id);
  }
  for (const op of ops) {
    if (!op.resolve && !op.reject) continue;
    await api(`/operations/${ids.get(op.key)}`, {
      method: "PATCH",
      body: {
        resolve: op.resolve ? ids.get(op.resolve) : null,
        reject: op.reject ? ids.get(op.reject) : null,
      },
    });
  }
  await api(`/flows/${flowId}`, { method: "PATCH", body: { operation: ids.get(rootKey) } });
  log("create", `flow ${flow.name} (${ops.length} ops)`);
}

const BEEHIIV_BODY = JSON.stringify({
  email: "{{$trigger.payload.email}}",
  reactivate_existing: true,
  send_welcome_email: true,
  utm_source: "{{$trigger.payload.utm.source}}",
  utm_medium: "{{$trigger.payload.utm.medium}}",
  utm_campaign: "{{$trigger.payload.utm.campaign}}",
  custom_fields: [
    { name: "first_name", value: "{{$trigger.payload.first_name}}" },
    { name: "life_path", value: "{{$trigger.payload.numbers.lifePath}}" },
    { name: "focus_area", value: "{{$trigger.payload.answers.focus_area}}" },
    { name: "report_url", value: "{{$trigger.payload.report_url}}" },
  ],
});

function beehiivRequestOp(key: string, next: string, fail: string, attempt: number): OpDef {
  return {
    key,
    type: "request",
    name: `beehiiv subscribe (attempt ${attempt})`,
    x: 19 + attempt * 18,
    y: 1,
    options: {
      url: "https://api.beehiiv.com/v2/publications/{{read_tenant.beehiiv_publication_id}}/subscriptions",
      method: "POST",
      headers: [
        { header: "Authorization", value: "Bearer {{$env.BEEHIIV_API_KEY}}" },
        { header: "Content-Type", value: "application/json" },
      ],
      body: BEEHIIV_BODY,
    },
    resolve: next,
    reject: fail,
  };
}

// Directus operations form a TREE (resolve/reject targets are unique per op),
// so each retry attempt needs its own success-marker op.
function markStatusOp(key: string, status: "subscribed" | "failed", x: number, y: number): OpDef {
  return {
    key,
    type: "item-update",
    name: status === "subscribed" ? "Mark subscribed" : "Mark failed",
    x,
    y,
    options: {
      collection: "leads",
      key: ["{{$trigger.key}}"],
      payload: { beehiiv_status: status },
      emitEvents: false,
    },
  };
}

async function ensureFlows() {
  console.log("Flows:");

  // Flow 1 — On leads.create → beehiiv subscribe (3 attempts) → status update.
  // This is THE single subscribe path (docs/08 §1: pick one, never double-subscribe).
  await ensureFlow(
    {
      name: "Lead → beehiiv subscribe",
      status: "active",
      trigger: "event",
      options: { type: "action", scope: ["items.create"], collections: ["leads"] },
    },
    [
      {
        key: "cond_email",
        type: "condition",
        name: "Has email?",
        x: 1,
        y: 1,
        options: { filter: { $trigger: { payload: { email: { _nnull: true } } } } },
        resolve: "read_tenant",
      },
      {
        key: "read_tenant",
        type: "item-read",
        name: "Read tenant",
        x: 19,
        y: 1,
        options: { collection: "tenants", key: ["{{$trigger.payload.tenant}}"] },
        resolve: "cond_pub",
      },
      {
        key: "cond_pub",
        type: "condition",
        name: "Tenant has beehiiv publication?",
        x: 37,
        y: 1,
        options: { filter: { read_tenant: { beehiiv_publication_id: { _nnull: true } } } },
        resolve: "subscribe_1",
      },
      beehiivRequestOp("subscribe_1", "mark_subscribed_1", "subscribe_2", 1),
      beehiivRequestOp("subscribe_2", "mark_subscribed_2", "subscribe_3", 2),
      beehiivRequestOp("subscribe_3", "mark_subscribed_3", "mark_failed", 3),
      markStatusOp("mark_subscribed_1", "subscribed", 37, 19),
      markStatusOp("mark_subscribed_2", "subscribed", 55, 19),
      markStatusOp("mark_subscribed_3", "subscribed", 73, 19),
      markStatusOp("mark_failed", "failed", 91, 19),
    ],
    "cond_email",
  );

  // Flow 2 — ops notification (stub, inactive until owner sets webhook URL env
  // + adds it to FLOWS_ENV_ALLOW_LIST in cms/docker-compose.yml)
  await ensureFlow(
    {
      name: "Lead → ops notification",
      status: "inactive",
      trigger: "event",
      options: { type: "action", scope: ["items.create"], collections: ["leads"] },
    },
    [
      {
        key: "notify",
        type: "request",
        name: "Webhook (Slack/Telegram)",
        x: 1,
        y: 1,
        options: {
          url: "{{$env.LEAD_NOTIFY_WEBHOOK_URL}}",
          method: "POST",
          headers: [{ header: "Content-Type", value: "application/json" }],
          body: JSON.stringify({
            text: "New lead · tenant {{$trigger.payload.tenant}} · source {{$trigger.payload.utm.source}}",
          }),
        },
      },
    ],
    "notify",
  );

  // Flow 3 — nightly export (stub, inactive; owner completes CSV/file step)
  await ensureFlow(
    {
      name: "Nightly leads export",
      status: "inactive",
      trigger: "schedule",
      options: { cron: "30 2 * * *" },
    },
    [
      {
        key: "read_leads",
        type: "item-read",
        name: "Read yesterday's leads",
        x: 1,
        y: 1,
        options: {
          collection: "leads",
          query: { filter: { created_at: { _gte: "$NOW(-1 day)" } }, limit: -1 },
        },
        resolve: "log_count",
      },
      {
        key: "log_count",
        type: "log",
        name: "Log export (stub — attach CSV/file step)",
        x: 19,
        y: 1,
        options: { message: "Nightly export stub — leads read: {{read_leads}}" },
      },
    ],
    "read_leads",
  );
}

// ── content ──────────────────────────────────────────────────────────────────

async function ensureItem(
  collection: string,
  filter: Record<string, unknown>,
  payload: Record<string, unknown>,
  label: string,
): Promise<string> {
  const existing = await findOne(`/items/${collection}`, filter);
  if (existing) {
    log("skip", label);
    return existing.id;
  }
  const row = await api<Row>(`/items/${collection}`, { method: "POST", body: payload });
  log("create", label);
  return (row as Row).id;
}

async function seedContent() {
  console.log("Content:");
  for (const tenant of TENANTS) {
    const tenantId = await ensureItem(
      "tenants",
      { slug: { _eq: tenant.slug } },
      tenant as unknown as Record<string, unknown>,
      `tenant ${tenant.slug}`,
    );

    const flowId = await ensureItem(
      "quiz_flows",
      { _and: [{ tenant: { _eq: tenantId } }, { slug: { _eq: QUIZ_FLOW.slug } }] },
      { ...QUIZ_FLOW, tenant: tenantId },
      `quiz_flow ${tenant.slug}/${QUIZ_FLOW.slug}`,
    );

    for (const step of QUIZ_STEPS) {
      await ensureItem(
        "quiz_steps",
        { _and: [{ flow: { _eq: flowId } }, { step_key: { _eq: step.step_key } }] },
        { ...step, flow: flowId },
        `quiz_step ${tenant.slug}/${step.step_key}`,
      );
    }

    const blocks =
      tenant.slug === "astro-note" ? [...WILDCARD_BLOCKS, ...VARIANT_BLOCKS] : WILDCARD_BLOCKS;
    for (const block of blocks) {
      await ensureItem(
        "content_blocks",
        { _and: [{ tenant: { _eq: tenantId } }, { label: { _eq: block.label } }] },
        { ...block, tenant: tenantId, status: "published" },
        `block ${tenant.slug}/${block.label}`,
      );
    }

    for (const offer of OFFERS) {
      await ensureItem(
        "offers",
        { _and: [{ tenant: { _eq: tenantId } }, { title: { _eq: offer.title } }] },
        { ...offer, tenant: tenantId },
        `offer ${tenant.slug}/${offer.title.slice(0, 30)}…`,
      );
    }

    await ensureItem(
      "settings",
      { tenant: { _eq: tenantId } },
      { ...SETTINGS, tenant: tenantId },
      `settings ${tenant.slug}`,
    );
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding Directus at ${DIRECTUS_URL}\n`);
  const health = await fetch(`${DIRECTUS_URL}/server/health`).catch(() => null);
  if (!health?.ok) {
    console.error(`Directus is not reachable at ${DIRECTUS_URL} — start it with: pnpm cms:up`);
    process.exit(1);
  }

  await ensureCollections();
  await ensureRelations();
  await ensureAccessControl();
  await ensureFlows();
  await seedContent();

  console.log(`\nDone: ${created} created, ${skipped} already existed.`);
}

main().catch((err) => {
  console.error("\nSeed failed:\n", err);
  process.exit(1);
});
