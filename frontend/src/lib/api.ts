// src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

/**
 * Lives only for the lifetime of the application.
 */
let accessToken: string | null = null;

/**
 * Ensures only one refresh request is in-flight.
 */
let refreshPromise: Promise<AuthResponse | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Registered by the AuthProvider. Fired when a *background* refresh fails
 * (the refresh cookie expired/was revoked while the app was open), so the
 * provider can flip status to unauthenticated instead of leaving the UI
 * thinking it's still logged in while every request 401s.
 */
let onAuthLost: (() => void) | null = null;

export function setOnAuthLost(handler: (() => void) | null): void {
  onAuthLost = handler;
}

/**
 * Actually calls the backend refresh endpoint.
 *
 * This function MUST use plain fetch().
 * Never call apiFetch() from here.
 */
async function refreshAccessToken(): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const auth: AuthResponse = await response.json();

    setAccessToken(auth.accessToken);

    return auth;
  } catch (error) {
    console.error("Refresh failed:", error);

    setAccessToken(null);

    return null;
  }
}

/**
 * Makes sure only ONE refresh request is executed,
 * even if many requests fail together.
 */
function ensureRefreshed(): Promise<AuthResponse | null> {
  // Attach the clearing `.finally` exactly once, at creation. Because we only
  // create when the slot is null (and only this `.finally` sets it back to
  // null), a straggler from an earlier batch can never null out a newer
  // in-flight refresh — so at most one /auth/refresh runs per burst.
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Called once when the application boots.
 */
export async function initializeAuth(): Promise<AuthResponse | null> {
  return ensureRefreshed();
}

/**
 * Central API wrapper.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${path}`;

  const makeRequest = () => {
    const headers = new Headers(options.headers);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  const response = await makeRequest();

  // Not a 401, or a 401 from an auth endpoint (bad credentials / missing
  // cookie, not an expired access token) — nothing to refresh, return as-is.
  if (response.status !== 401 || path.startsWith("/auth/")) {
    return response;
  }

  // Access token expired
  const auth = await ensureRefreshed();

  // Refresh failed: the session is gone. Signal the provider once so the UI
  // stops believing it's authenticated, then return the original 401.
  if (!auth) {
    onAuthLost?.();
    return response;
  }

  // Retry once
  return makeRequest();
}

/**
 * apiFetch + JSON parse for GET reads. Throws on a non-2xx response so callers
 * can handle failure in one catch.
 */
export async function getJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function postJson<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}