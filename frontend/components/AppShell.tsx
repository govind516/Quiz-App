"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login" || pathname === "/auth";
  const isPlay = pathname?.startsWith("/play") || pathname?.startsWith("/results") || pathname?.startsWith("/take") || pathname?.startsWith("/result");
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="grain relative min-h-screen">
      {!isAuth && <Nav />}
      <div>{children}</div>
      {!isAuth && !isPlay && !isAdmin && <Footer />}
    </div>
  );
}
