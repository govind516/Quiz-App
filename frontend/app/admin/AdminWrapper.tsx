"use client";

import dynamic from "next/dynamic";

const AdminClient = dynamic(() => import("./AdminClient"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-24 text-center">
      <div className="skeleton h-64 w-full rounded-[18px]" />
    </div>
  ),
});

export default function AdminWrapper() {
  return <AdminClient />;
}