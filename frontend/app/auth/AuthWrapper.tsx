"use client";

import dynamic from "next/dynamic";

const AuthClient = dynamic(() => import("./AuthClient"), {
  ssr: false,
  loading: () => (
    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:block overflow-hidden">
        <div className="relative h-full flex flex-col p-10">
          <div className="skeleton h-10 w-40" />
        </div>
      </div>
      <div className="relative flex flex-col justify-center p-8 md:p-16 bg-[color:var(--bg-2)]">
        <div className="skeleton h-64 w-full rounded-[18px]" />
      </div>
    </div>
  ),
});

export default function AuthWrapper() {
  return <AuthClient />;
}