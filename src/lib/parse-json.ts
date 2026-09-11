export function parseModelJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const decoded = JSON.parse(text) as unknown;
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
    throw new Error("Groq JSON was not an object.");
  }
  return decoded as Record<string, unknown>;
}
