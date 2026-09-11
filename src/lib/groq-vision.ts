import Groq from "./Groq";
import { parseModelJson } from "./parse-json";

const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.6-27b";

export async function generateJsonFromImage(input: {
  image: File;
  prompt: string;
}): Promise<Record<string, unknown>> {
  const buffer = Buffer.from(await input.image.arrayBuffer());
  const mimeType = input.image.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

  let completion;
  try {
    completion = await Groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: input.prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });
  } catch {
    throw new Error("Scan failed.");
  }

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Scan failed.");
  }

  try {
    return parseModelJson(text);
  } catch {
    throw new Error("Scan failed.");
  }
}
