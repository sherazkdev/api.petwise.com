import env from "@/lib/env";
import { redis } from "@/lib/UpstashRedis";

const INFLIGHT_KEY = "petwise:scan:inflight";
const STALE_MS = 90_000;

export class ScanBusyError extends Error {
  constructor(message = "Too many scans in progress. Try again shortly.") {
    super(message);
    this.name = "ScanBusyError";
  }
}

export async function withScanSlot<T>(fn: () => Promise<T>): Promise<T> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = Date.now();

  await redis.zremrangebyscore(INFLIGHT_KEY, 0, now - STALE_MS);
  await redis.zadd(INFLIGHT_KEY, { score: now, member: id });
  const count = await redis.zcard(INFLIGHT_KEY);

  if (count > env.SCAN_WORKER_CONCURRENCY) {
    await redis.zrem(INFLIGHT_KEY, id);
    throw new ScanBusyError();
  }

  try {
    return await fn();
  } finally {
    await redis.zrem(INFLIGHT_KEY, id);
  }
}
