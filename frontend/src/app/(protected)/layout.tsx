import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";

/**
 * Layout for the (protected) route group. Every page nested here — dashboard,
 * and future accounts/settings/reports — is gated by ProtectedRoute, so
 * individual pages never repeat the auth check.
 */
export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
