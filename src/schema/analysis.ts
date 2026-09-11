import * as z from "zod";

const codedString = (values: readonly [string, ...string[]]) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.enum(values));

const nutrientSchema = z.object({
  label: z.string().min(1),
  percent: z.union([z.string(), z.number()]).transform((value) => String(value)),
  status: codedString(["Good", "Fair", "Poor", "Caution"]),
});

const careGuideSchema = z.object({
  issueTitle: z.string().min(1),
  issueDescription: z.string().min(1),
  signsTitle: z.string().min(1),
  signs: z.array(z.string().min(1)).min(1),
  caution: z.string().min(1),
  important: z.string().min(1),
});

export const foodAnalysisSchema = z.object({
  imageKind: z.literal("animal_food"),
  supported: z.boolean(),
  productName: z.string().min(1),
  recipe: z.string().min(1),
  brand: z.string().min(1),
  safety: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.enum(["safe", "caution", "unsafe", "toxic"])),
  choiceLabel: codedString([
    "Good Choice",
    "Use Caution",
    "Not Recommended",
    "Unsafe",
  ]),
  overview: z.string().min(1),
  nutrients: z.array(nutrientSchema).min(1),
  ingredientPoints: z.array(z.string().min(1)).min(1),
  feedingTips: z.array(z.string().min(1)).min(1),
  warnings: z.array(z.string().min(1)).min(1),
});

export const petAnalysisSchema = z
  .object({
    imageKind: z.literal("animal"),
    supported: z.boolean(),
    species: z
      .string()
      .transform((value) => value.trim().toLowerCase())
      .pipe(z.enum(["dog", "cat", "other", "unknown"])),
    breedGuess: z.string().min(1),
    confidence: z.coerce.number().min(0).max(1),
    overallStatus: z
      .string()
      .transform((value) => value.trim().toLowerCase())
      .pipe(z.enum(["healthy", "monitor", "concern", "urgent"])),
    conditionLabel: codedString([
      "Good",
      "Fair",
      "Needs Attention",
      "Urgent",
    ]),
    summary: z.string().min(1),
    observations: z.array(z.string().min(1)).min(1),
    careTip: z.string().min(1),
    careGuide: z.union([careGuideSchema, z.null()]).optional(),
  })
  .transform((data) => ({
    ...data,
    careGuide: data.overallStatus === "healthy" ? null : data.careGuide ?? null,
  }));

export type FoodAnalysis = z.infer<typeof foodAnalysisSchema>;
export type PetAnalysis = z.infer<typeof petAnalysisSchema>;

export function parseFoodAnalysis(json: Record<string, unknown>): FoodAnalysis {
  const parsed = foodAnalysisSchema.safeParse({
    ...json,
    imageKind: "animal_food",
    supported: json.supported !== false,
  });
  if (!parsed.success) {
    throw new Error("Food analysis from the model was incomplete.");
  }
  return parsed.data;
}

export function parsePetAnalysis(json: Record<string, unknown>): PetAnalysis {
  const parsed = petAnalysisSchema.safeParse({
    ...json,
    imageKind: "animal",
    supported: json.supported !== false,
  });
  if (!parsed.success) {
    throw new Error("Pet analysis from the model was incomplete.");
  }
  return parsed.data;
}
