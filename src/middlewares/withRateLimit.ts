import { jsonError, retryAfterSeconds } from "@/lib/json-error";
import { globalRatelimit, ipRatelimit } from "@/lib/UpstashRedis";
import { NextRequest } from "next/server";

const withRatLimit = async (request: NextRequest) => {
  const global = await globalRatelimit.limit("all");
  if (!global.success) {
    return jsonError("Error: Too many requests.", 429, undefined, {
      "Retry-After": retryAfterSeconds(global.reset),
    });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const perIp = await ipRatelimit.limit(ip);
  if (!perIp.success) {
    return jsonError("Error: Too many requests.", 429, undefined, {
      "Retry-After": retryAfterSeconds(perIp.reset),
    });
  }

  return null;
};

export default withRatLimit;
