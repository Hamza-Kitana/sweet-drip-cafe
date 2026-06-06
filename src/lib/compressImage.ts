const MAX_INPUT_BYTES = 3 * 1024 * 1024;
/** Stay under nginx default 1 MB (multipart + base64 fallback) */
const MAX_OUTPUT_BYTES = 480 * 1024;
const MAX_DIMENSION = 1400;

function blobToFile(blob: Blob, file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Resize and re-encode as JPEG so uploads pass nginx 1 MB limit. */
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
    const { width, height } = bitmap;
    let dimension = MAX_DIMENSION;
    let quality = 0.82;
    let blob: Blob | null = null;

    for (let pass = 0; pass < 12; pass += 1) {
      const scale = Math.min(1, dimension / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not compress image");
      ctx.drawImage(bitmap, 0, 0, w, h);

      blob = await canvasToBlob(canvas, quality);
      if (blob.size <= MAX_OUTPUT_BYTES) {
        return blobToFile(blob, file);
      }

      if (quality > 0.45) {
        quality = Math.max(0.45, quality - 0.07);
        continue;
      }
      dimension = Math.round(dimension * 0.82);
      quality = 0.78;
    }

    if (!blob) throw new Error("Could not compress image");
    return blobToFile(blob, file);
  } finally {
    bitmap.close();
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}
