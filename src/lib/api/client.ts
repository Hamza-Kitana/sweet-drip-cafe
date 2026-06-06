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
  } catch {
    throw new ApiError(
      "Could not reach the server (fetch failed). Check your connection, sign in to admin again, or use an image under 3 MB.",
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
            ? "Image is too large — use a file under 3 MB"
            : res.statusText || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
