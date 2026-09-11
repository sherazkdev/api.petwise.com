import { generateJsonFromImage } from "@/lib/groq-vision";
import { compressScanImage } from "@/lib/compress-image";
import { getScanCache, scanCacheKey, setScanCache } from "@/lib/scan-cache";
import {
  parseFoodAnalysis,
  parsePetAnalysis,
} from "@/schema/analysis";
import type { ScanResult } from "@/schema/scan-result";
import { scanPrompt, type FoodPetContext } from "./scan-prompts";

export class ScanUnsupportedError extends Error {
  constructor() {
    super("This photo is not a pet or pet food.");
    this.name = "ScanUnsupportedError";
  }
}

export type ScanKind = "animal" | "animal_food" | "other";

export type { ScanResult };

export type PreparedScan = {
  wantFood: boolean;
  image: File;
  outputLanguage: string;
  pet?: FoodPetContext;
  cacheKey: string;
  cached: ScanResult | null;
};

function kindFromJson(
  json: Record<string, unknown>,
  fallback: ScanKind
): ScanKind {
  if (json.supported === false) {
    const hinted = kindFromString(json.imageKind);
    if (hinted === "animal" || hinted === "animal_food") return hinted;
    return "other";
  }
  return kindFromString(json.imageKind) ?? fallback;
}

function kindFromString(raw: unknown): ScanKind | null {
  switch (String(raw ?? "").toLowerCase().trim()) {
    case "animal":
    case "pet":
      return "animal";
    case "animal_food":
    case "pet_food":
    case "food":
      return "animal_food";
    case "other":
    case "unsupported":
      return "other";
    default:
      return null;
  }
}

function toResult(
  json: Record<string, unknown>,
  fallback: ScanKind
): ScanResult {
  const kind = kindFromJson(json, fallback);
  if (kind === "other") throw new ScanUnsupportedError();
  if (kind === "animal") {
    return { type: "pet", analysis: parsePetAnalysis(json) };
  }
  return { type: "food", analysis: parseFoodAnalysis(json) };
}

export async function prepareScan(input: {
  wantFood: boolean;
  image: File;
  outputLanguage: string;
  pet?: FoodPetContext;
}): Promise<PreparedScan> {
  const image = await compressScanImage(input.image);
  const cacheKey = await scanCacheKey({
    image,
    wantFood: input.wantFood,
    outputLanguage: input.outputLanguage,
    pet: input.pet,
  });
  const cached = await getScanCache(cacheKey);
  return {
    ...input,
    image,
    cacheKey,
    cached,
  };
}

export async function runPreparedScan(
  prepared: PreparedScan
): Promise<ScanResult> {
  const json = await generateJsonFromImage({
    image: prepared.image,
    prompt: scanPrompt(
      prepared.wantFood,
      prepared.pet,
      prepared.outputLanguage
    ),
  });
  const result = toResult(
    json,
    prepared.wantFood ? "animal_food" : "animal"
  );
  await setScanCache(prepared.cacheKey, result);
  return result;
}

export async function scanImage(input: {
  wantFood: boolean;
  image: File;
  outputLanguage: string;
  pet?: FoodPetContext;
}): Promise<ScanResult> {
  const prepared = await prepareScan(input);
  if (prepared.cached) return prepared.cached;
  return runPreparedScan(prepared);
}
