"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthProvider";

/**
 * Gate for authenticated routes. Renders children only once the session is
 * confirmed; otherwise shows a fallback and (when unauthenticated) redirects
 * to /login.
 *
 * The redirect lives in an effect, never in render: calling router.replace()
 * during render triggers React's "cannot update a component while rendering"
 * warning. While unauthenticated we render the fallback (not the children) so
 * protected content never flashes before the redirect lands.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
