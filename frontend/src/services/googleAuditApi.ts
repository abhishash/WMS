export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  authUrl?: string;
  connected?: boolean;
  account?: {
    email?: string;
    connectedAt?: string;
    lastConnectedAt?: string;
  } | null;
  error?: {
    message?: string;
  };
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = window.localStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.success) {
    throw new Error(
      result.error?.message ??
        result.message ??
        "Google Business Profile request failed",
    );
  }

  return result;
}

const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

export default api;
