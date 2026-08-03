const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    let message = "Erreur API";
    if (body?.message) {
      message = body.message;
    } else if (body?.error?.fieldErrors) {
      const fieldErrors = body.error.fieldErrors as Record<string, string[]>;
      const first = Object.entries(fieldErrors)[0];
      if (first) message = `${first[0]} : ${first[1][0]}`;
    } else if (typeof body?.error === "string") {
      message = body.error;
    }

    const code: string | undefined =
      typeof body?.error?.code === "string" ? body.error.code : body?.code;

    throw new ApiError(message, res.status, code);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),

  post: <T>(path: string, body: unknown) =>
    api<T>(path, { method: "POST", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    api<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => api<T>(path, { method: "DELETE" }),
};
