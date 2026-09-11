import type { FoodAnalysis, PetAnalysis } from "./analysis";

export type ScanResult =
  | { type: "food"; analysis: FoodAnalysis }
  | { type: "pet"; analysis: PetAnalysis };
