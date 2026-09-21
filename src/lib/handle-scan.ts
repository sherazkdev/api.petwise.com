import ApiResponse from "@/lib/ApiResponse";
import { jsonError } from "@/lib/json-error";
import { scanImage, ScanUnsupportedError } from "@/services/scan-service";
import { NextRequest } from "next/server";
import type { ZodType } from "zod";
import type { FoodPetContext } from "@/services/scan-prompts";

type ScanBody = {
  image: File;
  outputLanguage: string;
  petName?: string;
  species?: FoodPetContext["species"];
  allergies?: string;
};

export async function handleScan(
  request: NextRequest,
  schema: ZodType<ScanBody>,
  wantFood: boolean
) {
  try {
    const form = await request.formData();
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return jsonError("Error: Validation failed.", 400, parsed.error.issues);
    }

    const { image, outputLanguage, petName, species, allergies } = parsed.data;
    const result = await scanImage({
      wantFood,
      image,
      outputLanguage,
      pet: { petName, species, allergies },
    });

    return Response.json(
      new ApiResponse(result, "Scan complete.", 200, true),
      { status: 200 }
    );
  } catch (e: unknown) {
    if (e instanceof ScanUnsupportedError) {
      return jsonError(e.message, 400);
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error("handleScan failed:", message.slice(0, 300));
    return jsonError("Scan failed.", 502);
  }
}
