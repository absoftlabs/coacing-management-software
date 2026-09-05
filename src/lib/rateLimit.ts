const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory fixed-window rate limiter (per Node process). Good enough
 *  for a single-instance deployment; swap for a shared store (Redis) if this
 *  app ever runs multi-instance. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (bucket.count >= limit) return false;

    bucket.count += 1;
    return true;
}

export function clientIp(req: Request): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return req.headers.get("x-real-ip") || "unknown";
}
