import * as z from "zod";
import {
  allergiesSchema,
  imageSchema,
  outputLanguageSchema,
  petNameSchema,
  speciesSchema,
} from "./common";

export const VALIDATE_SCAN_FOOD = z.object({
  image: imageSchema,
  outputLanguage: outputLanguageSchema,
  petName: petNameSchema,
  species: speciesSchema,
  allergies: allergiesSchema,
});

export type ScanFoodInput = z.infer<typeof VALIDATE_SCAN_FOOD>;
