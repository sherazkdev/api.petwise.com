import * as z from "zod";

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/octet-stream",
  "",
] as const;

const imageSchema = z
  .instanceof(File, { message: "Error: Image is required." })
  .refine((file) => file.size > 0, { message: "Error: Image is empty." })
  .refine((file) => allowedImageTypes.includes(file.type as (typeof allowedImageTypes)[number]), {
    message: "Error: Validation failed, only jpg, png, webp, or heic.",
  })
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: "Error: Validation failed, max 10MB.",
  });

const emptyToUndef = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const outputLanguageSchema = emptyToUndef.transform(
  (value) => value ?? "English"
);
const petNameSchema = emptyToUndef;
const speciesSchema = emptyToUndef.pipe(
  z.enum(["dog", "cat", "other", "unknown"]).optional()
);
const allergiesSchema = emptyToUndef;

export {
  imageSchema,
  petNameSchema,
  speciesSchema,
  allergiesSchema,
  outputLanguageSchema,
};
