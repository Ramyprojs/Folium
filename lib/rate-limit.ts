type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type HeaderBag = Headers | Record<string, string | string[] | undefined>;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __foliumRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalRateLimitStore.__foliumRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalRateLimitStore.__foliumRateLimitStore) {
  globalRateLimitStore.__foliumRateLimitStore = rateLimitStore;
}

function pruneExpiredEntries(now: number): void {
  if (rateLimitStore.size < 2_000) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function readHeader(headers: HeaderBag, name: string): string | null {
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(name);
  }

  const headerMap = headers as Record<string, string | string[] | undefined>;
  const direct = headerMap[name];
  if (typeof direct === "string") {
    return direct;
  }

  if (Array.isArray(direct) && direct.length > 0) {
    return direct[0] ?? null;
  }

  const matchedKey = Object.keys(headerMap).find((headerName) => headerName.toLowerCase() === name.toLowerCase());
  if (!matchedKey) {
    return null;
  }

  const matchedValue = headerMap[matchedKey];
  if (typeof matchedValue === "string") {
    return matchedValue;
  }

  if (Array.isArray(matchedValue) && matchedValue.length > 0) {
    return matchedValue[0] ?? null;
  }

  return null;
}

export function getRequestIp(headers: HeaderBag): string {
  const forwardedFor = readHeader(headers, "x-forwarded-for");
  const realIp = readHeader(headers, "x-real-ip");
  const cfIp = readHeader(headers, "cf-connecting-ip");
  const rawIp = forwardedFor?.split(",")[0] || realIp || cfIp || "unknown";
  return rawIp.trim().slice(0, 128) || "unknown";
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  pruneExpiredEntries(now);

  const existing = rateLimitStore.get(key);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + windowMs,
        };

  entry.count += 1;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(limit - entry.count, 0);
  return {
    allowed: entry.count <= limit,
    remaining,
    retryAfterSeconds: Math.max(Math.ceil((entry.resetAt - now) / 1_000), 1),
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
