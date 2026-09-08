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
    if (requireAdmin && !isAdmin) {
      // Land on the plain login page (it serves everyone — no admin-only
      // messaging there). `from` lets admins resume where they were headed.
      const params = new URLSearchParams({ from: pathname || "/admin" });
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
