const MAX_INPUT_BYTES = 3 * 1024 * 1024;
/** nginx default is 1 MB — stay well under with multipart overhead */
const MAX_OUTPUT_BYTES = 700 * 1024;
const MAX_DIMENSION = 1600;

function pickOutputType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp") return file.type;
  return "image/jpeg";
}

function blobToFile(blob: Blob, file: File, type: string) {
  const ext = type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : ".jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}${ext}`, { type });
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image"))),
      type,
      quality,
    );
  });
}

/** Resize and re-encode so uploads pass nginx 1 MB default limit. */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WebP…)");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image must be under 3 MB");
  }
  if (file.size <= MAX_OUTPUT_BYTES && file.type === "image/jpeg") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    let dimension = MAX_DIMENSION;
    let type = pickOutputType(file);
    let quality = type === "image/png" ? 1 : 0.85;
    let blob: Blob | null = null;

    for (let pass = 0; pass < 10; pass += 1) {
      const scale = Math.min(1, dimension / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not compress image");
      ctx.drawImage(bitmap, 0, 0, w, h);

      blob = await canvasToBlob(canvas, type, quality);
      if (blob.size <= MAX_OUTPUT_BYTES) {
        return blobToFile(blob, file, type);
      }

      if (type !== "image/jpeg" && pass >= 1) {
        type = "image/jpeg";
        quality = 0.82;
        continue;
      }
      if (quality > 0.5) {
        quality = Math.max(0.5, quality - 0.08);
        continue;
      }
      dimension = Math.round(dimension * 0.85);
      quality = 0.82;
    }

    if (!blob || blob.size > MAX_INPUT_BYTES) {
      throw new Error("Image is too large — try a smaller photo");
    }

    return blobToFile(blob, file, type === "image/png" ? "image/jpeg" : type);
  } finally {
    bitmap.close();
  }
}
