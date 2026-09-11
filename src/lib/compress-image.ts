import sharp from "sharp";

export async function compressScanImage(file: File): Promise<File> {
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    return new File([new Uint8Array(output)], "scan.jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}
