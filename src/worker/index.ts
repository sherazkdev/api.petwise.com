import { createServer } from "http";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const workerPort = Number(process.env.WORKER_PORT || 2020);

createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "petwise-worker" }));
}).listen(workerPort, "127.0.0.1", () => {
  console.log(`Petwise worker health on 127.0.0.1:${workerPort}`);
});

async function main() {
  const { claimScanJob, processScanJob } = await import("@/lib/scan-queue");
  const env = (await import("@/lib/env")).default;

  let inflight = 0;
  console.log(
    `Petwise scan worker started (concurrency ${env.SCAN_WORKER_CONCURRENCY}, queue max ${env.SCAN_QUEUE_MAX})`
  );

  const tick = async () => {
    while (inflight < env.SCAN_WORKER_CONCURRENCY) {
      const job = await claimScanJob();
      if (!job) break;
      inflight += 1;
      console.log(`scan job ${job.jobId} running`);
      void processScanJob(job)
        .catch((error: unknown) => {
          console.error(`scan job ${job.jobId} failed`, error);
        })
        .finally(() => {
          inflight -= 1;
        });
    }
  };

  for (;;) {
    try {
      await tick();
    } catch (error) {
      console.error("worker tick failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
