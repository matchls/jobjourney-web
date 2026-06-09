const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Erreur API");
  }

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
