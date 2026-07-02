import { NextResponse, type NextRequest } from "next/server";
import {
  createCmsClient,
  listTenantDomains,
  matchTenantSlug,
  type TenantDomains,
} from "@astro-note/cms-sdk";

/**
 * Host → tenant resolution (docs/02 §3). Every request resolves its tenant
 * from the Host header via an in-memory map refreshed every 5 minutes from
 * Directus. Pages are rewritten to /t/<slug>/… (per-tenant ISR); /api/* only
 * receives the x-tenant header.
 */

const MAP_TTL_MS = 5 * 60_000;
let cachedMap: TenantDomains[] | null = null;
let cachedAt = 0;

async function getDomainMap(): Promise<TenantDomains[] | null> {
  if (cachedMap && Date.now() - cachedAt < MAP_TTL_MS) return cachedMap;
  try {
    const client = createCmsClient({
      url: process.env.DIRECTUS_URL ?? "http://localhost:8055",
      token: process.env.DIRECTUS_STATIC_TOKEN,
    });
    // Middleware keeps its own TTL; bypass the framework data cache here.
    const map = await listTenantDomains(client, { revalidate: false });
    cachedMap = map;
    cachedAt = Date.now();
    return map;
  } catch {
    // Stale-if-error: an unreachable CMS must not take the funnel down.
    return cachedMap;
  }
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Never expose internal tenant paths on public hostnames.
  if (pathname.startsWith("/t/") || pathname === "/t") {
    return NextResponse.rewrite(new URL("/__tenant-404", request.url));
  }

  // Local dev convenience (docs/02 §3): ?tenant= override, sticky via cookie.
  const devOverride =
    process.env.NODE_ENV !== "production"
      ? (nextUrl.searchParams.get("tenant") ?? request.cookies.get("an_tenant")?.value ?? null)
      : null;

  let slug = devOverride;
  if (!slug) {
    const map = await getDomainMap();
    const host = request.headers.get("host") ?? "";
    if (map && map.length > 0) {
      slug = matchTenantSlug(host, map);
    } else {
      // DECISION: map unavailable (CMS down before first successful fetch) —
      // fall back to the default tenant instead of 404ing the whole network.
      slug = process.env.DEFAULT_TENANT ?? null;
    }
  }

  if (!slug) {
    // /__tenant-404 has no route — Next renders not-found with a 404 status.
    return NextResponse.rewrite(new URL("/__tenant-404", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", slug);

  // API routes: pass through with tenant header only.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const rewritten = new URL(
    `/t/${slug}${pathname === "/" ? "" : pathname}${nextUrl.search}`,
    request.url,
  );
  const response = NextResponse.rewrite(rewritten, { request: { headers: requestHeaders } });
  if (devOverride) {
    response.cookies.set("an_tenant", devOverride, { path: "/", sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets with extensions
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|txt|xml|woff2?)$).*)",
  ],
};
