import { generateJsonFromImage } from "@/lib/groq-vision";
import { compressScanImage } from "@/lib/compress-image";
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

export async function scanImage(input: {
  wantFood: boolean;
  image: File;
  outputLanguage: string;
  pet?: FoodPetContext;
}): Promise<ScanResult> {
  const image = await compressScanImage(input.image);
  const json = await generateJsonFromImage({
    image,
    prompt: scanPrompt(
      input.wantFood,
      input.pet,
      input.outputLanguage
    ),
  });
  return toResult(json, input.wantFood ? "animal_food" : "animal");
}
