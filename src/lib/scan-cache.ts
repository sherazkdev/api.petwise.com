import { createHash } from "crypto";
import env from "@/lib/env";
import { redis } from "@/lib/UpstashRedis";
import type { ScanResult } from "@/schema/scan-result";
import type { FoodPetContext } from "@/services/scan-prompts";

export function scanCacheKey(input: {
  image: File;
  wantFood: boolean;
  outputLanguage: string;
  pet?: FoodPetContext;
}) {
  return input.image
    .arrayBuffer()
    .then((buffer) => {
      const hash = createHash("sha256")
        .update(Buffer.from(buffer))
        .update(
          JSON.stringify({
            wantFood: input.wantFood,
            outputLanguage: input.outputLanguage,
            pet: input.pet ?? {},
          })
        )
        .digest("hex");
      return `petwise:scan:cache:${hash}`;
    });
}

export async function getScanCache(key: string): Promise<ScanResult | null> {
  const raw = await redis.get<ScanResult | string>(key);
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ScanResult;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && raw && "type" in raw && "analysis" in raw) {
    return raw;
  }
  return null;
}

export async function setScanCache(key: string, result: ScanResult) {
  await redis.set(key, result, { ex: env.SCAN_CACHE_TTL_SECONDS });
}
