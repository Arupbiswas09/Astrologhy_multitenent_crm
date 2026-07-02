import { describe, expect, it, vi } from "vitest";
import { CmsError, createCmsClient } from "./client";
import { hostCandidates, matchTenantSlug } from "./fetchers";

function mockFetch(response: unknown, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify(response), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("createCmsClient", () => {
  it("builds /items URLs with encoded filter, fields, sort, and limit", async () => {
    const fetchImpl = mockFetch({ data: [] });
    const client = createCmsClient({
      url: "http://cms.local/",
      token: "tok",
      fetchImpl,
    });

    await client.items("tenants", {
      filter: { slug: { _eq: "astro-note" } },
      fields: ["slug", "domains"],
      sort: ["sort"],
      limit: 5,
    });

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/items/tenants");
    expect(JSON.parse(parsed.searchParams.get("filter") as string)).toEqual({
      slug: { _eq: "astro-note" },
    });
    expect(parsed.searchParams.get("fields")).toBe("slug,domains");
    expect(parsed.searchParams.get("sort")).toBe("sort");
    expect(parsed.searchParams.get("limit")).toBe("5");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("unwraps the Directus data envelope", async () => {
    const client = createCmsClient({
      url: "http://cms.local",
      fetchImpl: mockFetch({ data: [{ slug: "astro-note" }] }),
    });
    await expect(client.items("tenants")).resolves.toEqual([{ slug: "astro-note" }]);
  });

  it("throws CmsError with status on non-2xx", async () => {
    const client = createCmsClient({
      url: "http://cms.local",
      fetchImpl: mockFetch({ errors: [{ message: "nope" }] }, 403),
    });
    const err = await client.items("leads").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(CmsError);
    expect((err as CmsError).status).toBe(403);
  });

  it("POSTs JSON payloads for createItem", async () => {
    const fetchImpl = mockFetch({ data: { id: "1" } });
    const client = createCmsClient({ url: "http://cms.local", fetchImpl });
    await client.createItem("leads", { email: "a@b.co" });

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("http://cms.local/items/leads");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ email: "a@b.co" });
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("maps revalidate:false to no-store and forwards ISR hints otherwise", async () => {
    const fetchImpl = mockFetch({ data: [] });
    const client = createCmsClient({ url: "http://cms.local", fetchImpl });

    await client.items("tenants", {}, { revalidate: false });
    await client.items("tenants", {}, { revalidate: 300, tags: ["tenant"] });

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, RequestInit & { next?: unknown; cache?: string }]
    >;
    expect(calls[0]?.[1].cache).toBe("no-store");
    expect(calls[1]?.[1].next).toEqual({ revalidate: 300, tags: ["tenant"] });
  });

  it("builds asset URLs", () => {
    const client = createCmsClient({ url: "http://cms.local" });
    expect(client.assetUrl("abc", { width: "320" })).toBe(
      "http://cms.local/assets/abc?width=320",
    );
  });
});

describe("host → tenant matching", () => {
  const tenants = [
    { slug: "astro-note", domains: ["astronote.com", "www.astronote.com", "localhost"] },
    { slug: "moon-letter", domains: ["moonletter.com"] },
  ];

  it("normalizes case and port", () => {
    expect(hostCandidates("Localhost:3000")).toEqual(["localhost:3000", "localhost"]);
    expect(matchTenantSlug("WWW.ASTRONOTE.COM", tenants)).toBe("astro-note");
    expect(matchTenantSlug("localhost:3000", tenants)).toBe("astro-note");
  });

  it("matches exactly — no substring leakage between domains", () => {
    expect(matchTenantSlug("astronote.com.evil.io", tenants)).toBeNull();
    expect(matchTenantSlug("moonletter.com", tenants)).toBe("moon-letter");
    expect(matchTenantSlug("unknown.example", tenants)).toBeNull();
  });
});
