function getEnv(name: string) {
  const variable = process.env[name];
  if (!variable) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return variable;
}

const env = {
  GROQ_API_KEY: getEnv("GROQ_API_KEY"),
  X_API_KEY: getEnv("X_API_KEY"),
  PUBLIC_BASE_URL: getEnv("PUBLIC_BASE_URL"),
};

export default env;
