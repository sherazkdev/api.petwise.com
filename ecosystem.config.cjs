const fs = require("fs");
const path = require("path");

/** Load .env so PM2 children always get current values (not stale saved PM2 env). */
function loadDotEnv(cwd) {
  const file = path.join(cwd, ".env");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const cwd = __dirname;
const sharedEnv = loadDotEnv(cwd);

module.exports = {
  apps: [
    {
      name: "petwise-api",
      cwd,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "2019",
        ...sharedEnv,
      },
    },
  ],
};
