import ApiResponse from "@/lib/ApiResponse";
import { jsonError } from "@/lib/json-error";
import { getScanJob } from "@/lib/scan-queue";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const job = await getScanJob(id);
  if (!job) {
    return jsonError("Job not found.", 404);
  }

  if (job.status === "done" && job.result) {
    return Response.json(new ApiResponse(job.result, "Scan complete.", 200, true), {
      status: 200,
    });
  }

  if (job.status === "failed" && job.error) {
    return jsonError(job.error.message, job.error.statusCode);
  }

  return Response.json(
    new ApiResponse(
      { jobId: job.jobId, status: job.status },
      "Scan still running.",
      202,
      true
    ),
    { status: 202 }
  );
}
