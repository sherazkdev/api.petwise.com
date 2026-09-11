function getEnv(name: string) {
  const variable = process.env[name];
  if (!variable) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return variable;
}

function getEnvInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
  return value;
}

const env = {
  GROQ_API_KEY: getEnv("GROQ_API_KEY"),
  X_API_KEY: getEnv("X_API_KEY"),
  PUBLIC_BASE_URL: getEnv("PUBLIC_BASE_URL"),
  RATE_LIMIT_IP_PER_MIN: getEnvInt("RATE_LIMIT_IP_PER_MIN", 30),
  RATE_LIMIT_GLOBAL_PER_MIN: getEnvInt("RATE_LIMIT_GLOBAL_PER_MIN", 120),
  SCAN_WORKER_CONCURRENCY: getEnvInt("SCAN_WORKER_CONCURRENCY", 8),
  SCAN_QUEUE_MAX: getEnvInt("SCAN_QUEUE_MAX", 100),
  SCAN_CACHE_TTL_SECONDS: getEnvInt("SCAN_CACHE_TTL_SECONDS", 21600),
  SCAN_WAIT_MS: getEnvInt("SCAN_WAIT_MS", 45000),
  SCAN_JOB_TTL_SECONDS: getEnvInt("SCAN_JOB_TTL_SECONDS", 900),
};

export default env;
