import { redirect } from "next/navigation";

// Root has no content of its own — send visitors to the dashboard. If they're
// not authenticated, ProtectedRoute bounces them on to /login.
export default function Home() {
  redirect("/dashboard");
}
