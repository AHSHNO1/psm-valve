const buckets = new Map();

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return request.headers.get("x-real-ip") ||
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    "unknown";
}

export function consumeRateLimit(request, scope, limit, windowMs) {
  const now = Date.now();
  const key = scope + ":" + clientKey(request);
  const current = buckets.get(key);
  if (!current || current.expiresAt <= now) {
    if (buckets.size >= 5000) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.expiresAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size >= 5000) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) buckets.delete(oldestKey);
      }
    }
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000))
    };
  }
  current.count += 1;
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.expiresAt <= now) buckets.delete(bucketKey);
    }
  }
  return { allowed: true, retryAfter: 0 };
}
