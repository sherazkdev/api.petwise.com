module.exports = {
  apps: [
    {
      name: "petwise-api",
      cwd: __dirname,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "2019",
      },
    },
    {
      name: "petwise-worker",
      cwd: __dirname,
      script: "npm",
      args: "run worker",
      env: {
        NODE_ENV: "production",
        WORKER_PORT: "2020",
      },
    },
  ],
};
