import Groq from "./Groq";
import { parseModelJson } from "./parse-json";

const DEFAULT_VISION_MODELS = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"];

function visionModels(): string[] {
  const fromEnv = process.env.GROQ_VISION_MODEL?.trim();
  const list = fromEnv
    ? [fromEnv, ...DEFAULT_VISION_MODELS]
    : DEFAULT_VISION_MODELS;
  return [...new Set(list)];
}

const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groqErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableGroqError(message: string): boolean {
  return (
    message.includes("503") ||
    message.includes("over capacity") ||
    message.includes("429")
  );
}

function shouldTryNextModel(message: string): boolean {
  return (
    message.includes("model_not_found") ||
    message.includes("does not exist") ||
    message.includes("decommissioned")
  );
}

async function requestVisionJson(
  model: string,
  dataUrl: string,
  prompt: string,
): Promise<Record<string, unknown>> {
  const completion = await Groq.chat.completions.create({
    model,
    temperature: 0.2,
    max_completion_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty model response.");
  }
  return parseModelJson(text);
}

export async function generateJsonFromImage(input: {
  image: File;
  prompt: string;
}): Promise<Record<string, unknown>> {
  const buffer = Buffer.from(await input.image.arrayBuffer());
  const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;

  const models = visionModels();
  let lastError = "Scan failed.";

  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await requestVisionJson(model, dataUrl, input.prompt);
      } catch (error: unknown) {
        const message = groqErrorMessage(error);
        lastError = message;
        console.error(
          `Groq vision failed model=${model} attempt=${attempt}/${MAX_ATTEMPTS}:`,
          message.slice(0, 300),
        );

        if (shouldTryNextModel(message)) {
          break;
        }
        if (attempt < MAX_ATTEMPTS && isRetryableGroqError(message)) {
          await sleep(1000 * attempt);
          continue;
        }
        if (
          message.includes("invalid JSON") ||
          message.includes("JSON was not an object")
        ) {
          if (attempt < MAX_ATTEMPTS) {
            await sleep(500 * attempt);
            continue;
          }
        }
        break;
      }
    }
  }

  console.error("Groq vision failed after all models:", lastError.slice(0, 300));
  throw new Error("Scan failed.");
}
