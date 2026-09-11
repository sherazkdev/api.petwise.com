import ApiResponse from "@/lib/ApiResponse";
import env from "@/lib/env";
import { jsonError } from "@/lib/json-error";
import {
  enqueueScanJob,
  waitForScanJob,
} from "@/lib/scan-queue";
import { ScanBusyError } from "@/lib/scan-slot";
import { prepareScan, ScanUnsupportedError } from "@/services/scan-service";
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
    const prepared = await prepareScan({
      wantFood,
      image,
      outputLanguage,
      pet: { petName, species, allergies },
    });

    if (prepared.cached) {
      return Response.json(
        new ApiResponse(prepared.cached, "Scan complete.", 200, true),
        { status: 200 }
      );
    }

    const queued = await enqueueScanJob({
      wantFood,
      outputLanguage,
      pet: { petName, species, allergies },
      cacheKey: prepared.cacheKey,
      image: prepared.image,
    });

    const finished = await waitForScanJob(queued.jobId, env.SCAN_WAIT_MS);
    if (finished?.status === "done" && finished.result) {
      return Response.json(
        new ApiResponse(finished.result, "Scan complete.", 200, true),
        { status: 200 }
      );
    }
    if (finished?.status === "failed" && finished.error) {
      return jsonError(finished.error.message, finished.error.statusCode);
    }

    return Response.json(
      new ApiResponse(
        { jobId: queued.jobId, status: finished?.status ?? "queued" },
        "Scan queued. Poll GET /api/v1/scan/jobs/{jobId}.",
        202,
        true
      ),
      { status: 202 }
    );
  } catch (e: unknown) {
    if (e instanceof ScanUnsupportedError) {
      return jsonError(e.message, 400);
    }
    if (e instanceof ScanBusyError || (e instanceof Error && e.message === "QUEUE_FULL")) {
      return jsonError(
        "Queue is full (100 jobs). Try again shortly.",
        503,
        undefined,
        { "Retry-After": "8" }
      );
    }
    return jsonError("Scan failed.", 502);
  }
}
