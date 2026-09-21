import sharp from "sharp";

export class InvalidScanImageError extends Error {
  constructor(message = "Error: Invalid or unsupported image.") {
    super(message);
    this.name = "InvalidScanImageError";
  }
}

function sniffMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (
      brand.startsWith("hei") ||
      brand === "mif1" ||
      brand === "msf1" ||
      brand === "avif"
    ) {
      return "image/heic";
    }
  }
  return null;
}

function decodeBase64Image(text: string): Buffer | null {
  const trimmed = text.replace(/\s/g, "");
  if (trimmed.length < 32 || trimmed.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return null;
  try {
    const decoded = Buffer.from(trimmed, "base64");
    return sniffMime(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function normalizeImageBuffer(buffer: Buffer): Buffer {
  if (sniffMime(buffer)) return buffer;

  const text = buffer.toString("utf8").trim();
  if (text.startsWith("data:image/")) {
    const comma = text.indexOf(",");
    if (comma !== -1) {
      const decoded = decodeBase64Image(text.slice(comma + 1));
      if (decoded) return decoded;
    }
  }

  if (text.startsWith("/9j/") || text.startsWith("iVBORw0KGgo") || text.startsWith("UklGR")) {
    const decoded = decodeBase64Image(text);
    if (decoded) return decoded;
  }

  return buffer;
}

async function toJpeg(buffer: Buffer): Promise<Buffer> {
  const pipeline = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize(1280, 1280, { fit: "inside", withoutEnlargement: true });

  try {
    return await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  } catch {
    return pipeline.jpeg({ quality: 78 }).toBuffer();
  }
}

export async function compressScanImage(file: File): Promise<File> {
  const raw = Buffer.from(await file.arrayBuffer());
  if (raw.length === 0) {
    throw new InvalidScanImageError("Error: Image is empty.");
  }

  const input = normalizeImageBuffer(raw);
  const sniffed = sniffMime(input);
  if (!sniffed) {
    console.error(
      "compressScanImage unsupported:",
      `declared=${file.type || "unknown"}`,
      `bytes=${raw.length}`,
      `head=${raw.subarray(0, 16).toString("hex")}`,
    );
    throw new InvalidScanImageError();
  }

  try {
    const output = await toJpeg(input);
    if (output.length < 100 || !sniffMime(output)) {
      throw new InvalidScanImageError();
    }

    return new File([new Uint8Array(output)], "scan.jpg", {
      type: "image/jpeg",
    });
  } catch (error) {
    if (error instanceof InvalidScanImageError) throw error;
    console.error(
      "compressScanImage failed:",
      `declared=${file.type || "unknown"}`,
      `sniffed=${sniffed}`,
      `bytes=${input.length}`,
      error instanceof Error ? error.message.slice(0, 160) : String(error),
    );
    throw new InvalidScanImageError();
  }
}
