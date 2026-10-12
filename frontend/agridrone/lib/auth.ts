
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

async function authRequest<T>(
  path: string,
  data: RegisterData | LoginData
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = result?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item: { msg?: string }) => item.msg)
              .join(", ")
          : "Authentication request failed.";

    throw new Error(message);
  }

  return result as T;
}

export async function registerUser(
  data: RegisterData
): Promise<AuthResponse> {
  return authRequest<AuthResponse>(
    "/api/v1/auth/register",
    data
  );
}

export async function loginUser(
  data: LoginData
): Promise<AuthResponse> {
  return authRequest<AuthResponse>(
    "/api/v1/auth/login",
    data
  );
}

export class AuthSessionError extends Error {
  status: number;

  constructor(status: number) {
    super("Session verification failed.");
    this.name = "AuthSessionError";
    this.status = status;
  }
}

export async function getCurrentUser(
  token: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthSessionError(response.status);
  }

  return response.json();
}
