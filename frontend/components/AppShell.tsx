"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login";
  const isPlay = pathname?.startsWith("/play") || pathname?.startsWith("/results");
  const isAdmin = pathname?.startsWith("/admin");
  const isLive = pathname?.startsWith("/live");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="grain relative min-h-screen">
      {!isAuth && !isPlay && <Nav />}
      <div>{children}</div>
      {!isAuth && !isPlay && !isAdmin && !isLive && <Footer />}
    </div>
  );
}
