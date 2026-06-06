export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const isApiMode = Boolean(API_URL);

const TOKEN_KEY = "sweetdrip-admin-token";

export function getAdminToken() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof sessionStorage === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError("API URL is not configured", 0);

  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAdminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch (err) {
    const isUpload = path.includes("/media");
    const detail = err instanceof Error ? err.message : "";
    throw new ApiError(
      isUpload
        ? `Upload failed (network blocked). The server nginx limit is 1 MB — ask your host to add client_max_body_size 50m on api.sweetdrip.cafe, or use a smaller photo (under 700 KB).${detail ? ` (${detail})` : ""}`
        : `Could not reach the server. Check your connection or sign in to admin again.${detail ? ` (${detail})` : ""}`,
      0,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new ApiError(text || res.statusText || "Request failed", res.status);
      }
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : res.status === 401
          ? "Please sign in to admin again"
          : res.status === 413
            ? "Image too large for server (nginx 1 MB limit). Use a smaller photo or fix nginx: client_max_body_size 50m on api.sweetdrip.cafe"
            : res.statusText || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
