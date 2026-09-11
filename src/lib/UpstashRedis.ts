import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import env from "./env";

const redis = Redis.fromEnv();

const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_IP_PER_MIN, "1 m"),
  prefix: "petwise:rl:ip",
});

const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_GLOBAL_PER_MIN, "1 m"),
  prefix: "petwise:rl:global",
});

export { redis, ipRatelimit, globalRatelimit };
