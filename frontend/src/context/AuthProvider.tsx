"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  apiFetch,
  initializeAuth,
  setAccessToken,
  setOnAuthLost,
  type AuthResponse,
  type User,
} from "@/lib/api";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthContextType {
  user: User | null;
  status: AuthStatus;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [status, setStatus] =
    useState<AuthStatus>("loading");

  /**
   * Recover existing session on application startup.
   */
  useEffect(() => {
    async function recoverSession() {
      const auth = await initializeAuth();

      if (auth) {
        setUser(auth.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    recoverSession();
  }, []);

  /**
   * Handle a background session loss: a request refreshed, the refresh failed,
   * and the session is gone. Flip local state so guards redirect to /login.
   */
  useEffect(() => {
    setOnAuthLost(() => {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    });

    return () => setOnAuthLost(null);
  }, []);

  /**
   * Shared helper for login/register.
   */
  async function authenticate(
    endpoint: string,
    body: object,
    errorMessage: string
  ): Promise<void> {
    const response = await apiFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(errorMessage);
    }

    const auth: AuthResponse = await response.json();

    setAccessToken(auth.accessToken);
    setUser(auth.user);
    setStatus("authenticated");
  }

  async function login(
    email: string,
    password: string
  ): Promise<void> {
    return authenticate(
      "/auth/login",
      {
        email,
        password,
      },
      "Invalid email or password"
    );
  }

  async function register(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    return authenticate(
      "/auth/register",
      {
        name,
        email,
        password,
      },
      "Registration failed"
    );
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}