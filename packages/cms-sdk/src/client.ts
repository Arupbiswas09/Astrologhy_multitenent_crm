/**
 * Thin typed Directus REST client.
 *
 * DECISION: hand-rolled fetch wrapper instead of @directus/sdk — the funnel
 * only needs filtered reads + lead writes; zero dependencies keeps the quiz
 * route bundle small and removes SDK-version churn. The REST surface used
 * here (/items, query params) is stable across Directus 11.
 */

export interface CmsClientOptions {
  /** Directus base URL, e.g. https://cms.example.com (no trailing slash needed). */
  url: string;
  /** Static token; omit for public-role access. */
  token?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export interface ItemsQuery {
  filter?: Record<string, unknown>;
  fields?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Cache hints forwarded to fetch. Inside Next.js these drive the data cache /
 * ISR (docs/02-ARCHITECTURE.md §5); outside Next.js they are ignored.
 * `revalidate: false` maps to `cache: "no-store"`.
 */
export interface CacheOptions {
  revalidate?: number | false;
  tags?: string[];
}

export class CmsError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "CmsError";
    this.status = status;
    this.url = url;
  }
}

export interface CmsClient {
  readonly baseUrl: string;
  items<T>(collection: string, query?: ItemsQuery, cache?: CacheOptions): Promise<T[]>;
  item<T>(collection: string, id: string, query?: ItemsQuery, cache?: CacheOptions): Promise<T>;
  createItem<T>(collection: string, payload: unknown): Promise<T>;
  /** Absolute URL for a Directus file asset (tenant logos, offer images). */
  assetUrl(fileId: string, params?: Record<string, string>): string;
}

function buildQueryString(query: ItemsQuery): string {
  const params = new URLSearchParams();
  if (query.filter && Object.keys(query.filter).length > 0) {
    params.set("filter", JSON.stringify(query.filter));
  }
  if (query.fields?.length) params.set("fields", query.fields.join(","));
  if (query.sort?.length) params.set("sort", query.sort.join(","));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createCmsClient(options: CmsClientOptions): CmsClient {
  const baseUrl = options.url.replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;

  // `next` (ISR hints) and `cache` are consumed by Next's patched fetch;
  // plain runtimes ignore them. Typed locally — Node's lib lacks `cache`.
  type FetchInit = RequestInit & { next?: unknown; cache?: "no-store" | "force-cache" };

  async function request<T>(path: string, init: FetchInit = {}, cache?: CacheOptions): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    };

    const nextInit: FetchInit = { ...init, headers };
    if (cache) {
      if (cache.revalidate === false) {
        nextInit.cache = "no-store";
      } else {
        nextInit.next = { revalidate: cache.revalidate, tags: cache.tags };
      }
    }

    const res = await fetchImpl(url, nextInit);
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 500);
      } catch {
        /* body unavailable — status alone is enough */
      }
      throw new CmsError(
        `Directus request failed (${res.status}) for ${path}${detail ? `: ${detail}` : ""}`,
        res.status,
        url,
      );
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  return {
    baseUrl,

    items<T>(collection: string, query: ItemsQuery = {}, cache?: CacheOptions) {
      return request<T[]>(`/items/${collection}${buildQueryString(query)}`, {}, cache);
    },

    item<T>(collection: string, id: string, query: ItemsQuery = {}, cache?: CacheOptions) {
      return request<T>(
        `/items/${collection}/${encodeURIComponent(id)}${buildQueryString(query)}`,
        {},
        cache,
      );
    },

    createItem<T>(collection: string, payload: unknown) {
      return request<T>(`/items/${collection}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    assetUrl(fileId: string, params?: Record<string, string>) {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return `${baseUrl}/assets/${fileId}${qs}`;
    },
  };
}
