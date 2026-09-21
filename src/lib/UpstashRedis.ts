import { Redis } from "@upstash/redis";

function upstashRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  }
  if (!/^https:\/\/[^/]+\.upstash\.io\/?$/i.test(url)) {
    throw new Error(
      `Invalid UPSTASH_REDIS_REST_URL (expected https://….upstash.io): ${url}`,
    );
  }
  return new Redis({ url, token });
}

const redis = upstashRedis();

export { redis };
