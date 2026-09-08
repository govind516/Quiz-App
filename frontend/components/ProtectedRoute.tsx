"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    // Wait for localStorage hydration: on first render user is always null,
    // redirecting here would bounce valid stored sessions back to /login.
    if (!hydrated) return;
    // If a logout was initiated from the Nav, redirect to login without the
    // ``from`` param so it is not carried over as an admin return-path.
    if (typeof window !== "undefined" && localStorage.getItem("quiz_userJustLoggedOut") === "true") {
      localStorage.removeItem("quiz_userJustLoggedOut");
      router.replace("/login");
      return;
    }
    if (requireAdmin && !isAdmin) {
      // Land on the plain login page (it serves everyone — no admin-only
      // messaging there). `from` lets admins resume where they were headed.
      // Use the actual current pathname so the ``from`` param reflects where
      // the user is going, not a hard‑coded ``/admin``.  This prevents the
      // logout flow from re‑injecting ``from=/admin`` into the login URL.
      const params = new URLSearchParams({ from: pathname });
      router.replace(`/login?${params.toString()}`);
      return;
    }
    if (!requireAdmin && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [requireAdmin, isAdmin, isAuthenticated, hydrated, router, pathname]);

  if (!checked) return null;
  if (requireAdmin && !isAdmin) return null;
  if (!requireAdmin && !isAuthenticated) return null;
  return <>{children}</>;
}
