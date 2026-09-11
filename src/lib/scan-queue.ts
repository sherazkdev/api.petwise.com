import { randomUUID } from "crypto";
import env from "@/lib/env";
import { redis } from "@/lib/UpstashRedis";
import { withScanSlot, ScanBusyError } from "@/lib/scan-slot";
import {
  runPreparedScan,
  ScanUnsupportedError,
  type PreparedScan,
} from "@/services/scan-service";
import type { ScanResult } from "@/schema/scan-result";
import type { FoodPetContext } from "@/services/scan-prompts";

const QUEUE_KEY = "petwise:scan:queue";
const JOB_PREFIX = "petwise:scan:job:";

export type ScanJobStatus = "queued" | "running" | "done" | "failed";

export type ScanJobPublic = {
  jobId: string;
  status: ScanJobStatus;
  result?: ScanResult;
  error?: { message: string; statusCode: number };
  createdAt: number;
};

type ScanJobRecord = ScanJobPublic & {
  wantFood: boolean;
  outputLanguage: string;
  pet?: FoodPetContext;
  cacheKey: string;
  imageBase64: string;
  mimeType: string;
};

function jobKey(id: string) {
  return `${JOB_PREFIX}${id}`;
}

function toPublic(job: ScanJobRecord): ScanJobPublic {
  return {
    jobId: job.jobId,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
  };
}

async function saveJob(job: ScanJobRecord) {
  await redis.set(jobKey(job.jobId), job, { ex: env.SCAN_JOB_TTL_SECONDS });
}

export async function enqueueScanJob(input: {
  wantFood: boolean;
  outputLanguage: string;
  pet?: FoodPetContext;
  cacheKey: string;
  image: File;
}): Promise<ScanJobPublic> {
  const queued = await redis.llen(QUEUE_KEY);
  if ((queued ?? 0) >= env.SCAN_QUEUE_MAX) {
    throw new Error("QUEUE_FULL");
  }

  const buffer = Buffer.from(await input.image.arrayBuffer());
  const job: ScanJobRecord = {
    jobId: randomUUID(),
    status: "queued",
    createdAt: Date.now(),
    wantFood: input.wantFood,
    outputLanguage: input.outputLanguage,
    pet: input.pet,
    cacheKey: input.cacheKey,
    imageBase64: buffer.toString("base64"),
    mimeType: input.image.type || "image/jpeg",
  };

  await saveJob(job);
  await redis.rpush(QUEUE_KEY, job.jobId);
  return toPublic(job);
}

export async function getScanJob(jobId: string): Promise<ScanJobPublic | null> {
  const job = await redis.get<ScanJobRecord>(jobKey(jobId));
  if (!job) return null;
  return toPublic(job);
}

export async function waitForScanJob(
  jobId: string,
  timeoutMs: number
): Promise<ScanJobPublic | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await getScanJob(jobId);
    if (!job) return null;
    if (job.status === "done" || job.status === "failed") return job;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return getScanJob(jobId);
}

export async function claimScanJob(): Promise<ScanJobRecord | null> {
  const jobId = await redis.lpop<string>(QUEUE_KEY);
  if (!jobId) return null;
  const job = await redis.get<ScanJobRecord>(jobKey(jobId));
  if (!job) return null;
  job.status = "running";
  await saveJob(job);
  return job;
}

export async function processScanJob(job: ScanJobRecord): Promise<void> {
  const bytes = Buffer.from(job.imageBase64, "base64");
  const image = new File([new Uint8Array(bytes)], "scan.jpg", {
    type: job.mimeType,
  });
  const prepared: PreparedScan = {
    wantFood: job.wantFood,
    image,
    outputLanguage: job.outputLanguage,
    pet: job.pet,
    cacheKey: job.cacheKey,
    cached: null,
  };

  try {
    const result = await withScanSlot(() => runPreparedScan(prepared));
    job.status = "done";
    job.result = result;
    delete (job as { imageBase64?: string }).imageBase64;
    await saveJob(job);
  } catch (e: unknown) {
    if (e instanceof ScanBusyError) {
      job.status = "queued";
      await saveJob(job);
      await redis.rpush(QUEUE_KEY, job.jobId);
      return;
    }
    job.status = "failed";
    if (e instanceof ScanUnsupportedError) {
      job.error = { message: e.message, statusCode: 400 };
    } else {
      job.error = { message: "Scan failed.", statusCode: 502 };
    }
    delete (job as { imageBase64?: string }).imageBase64;
    await saveJob(job);
  }
}

export { toPublic };
export type { ScanJobRecord };
