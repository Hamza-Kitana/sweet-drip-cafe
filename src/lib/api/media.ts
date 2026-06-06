import { apiFetch, API_URL, ApiError } from "./client";
import { fileToDataUrl } from "@/lib/compressImage";

export function isStoredMediaUrl(value: string | undefined | null) {
  if (!value) return false;
  if (value.includes("/api/media/")) return true;
  if (API_URL && value.startsWith(`${API_URL}/api/media/`)) return true;
  return false;
}

export function extractMediaId(value: string | undefined | null) {
  if (!value) return null;
  const match = value.match(/\/api\/media\/([a-zA-Z0-9]+)/i);
  return match?.[1] ?? null;
}

export async function uploadSiteImage(dataUrl: string, fileName?: string) {
  return apiFetch<{ id: string; url: string }>("/api/admin/media", {
    method: "POST",
    body: JSON.stringify({ dataUrl, fileName }),
  });
}

export async function uploadSiteImageFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<{ id: string; url: string }>("/api/admin/media/upload", {
    method: "POST",
    body: form,
  });
}

/** Multipart first; JSON base64 fallback when nginx blocks the request body. */
export async function uploadPreparedImage(file: File) {
  try {
    return await uploadSiteImageFile(file);
  } catch (err) {
    const fallback =
      err instanceof ApiError &&
      (err.status === 0 || err.status === 413 || err.message.toLowerCase().includes("nginx"));
    if (!fallback) throw err;
    const dataUrl = await fileToDataUrl(file);
    return uploadSiteImage(dataUrl, file.name);
  }
}

export async function deleteSiteImage(id: string) {
  return apiFetch<void>(`/api/admin/media/${id}`, { method: "DELETE" });
}

export async function removeStoredMedia(value: string | undefined | null) {
  const id = extractMediaId(value);
  if (!id) return;
  try {
    await deleteSiteImage(id);
  } catch {
    /* ignore if already removed */
  }
}
