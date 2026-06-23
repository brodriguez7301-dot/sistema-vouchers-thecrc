"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import Navbar from "./Navbar";

export default function AppShell({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/login"); return; }
    if (roles && !roles.includes(user.role)) { router.replace("/login"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-52 flex-shrink-0">
        <Navbar />
      </div>
      <main className="flex-1 overflow-auto bg-gray-50 p-8">{children}</main>
    </div>
  );
}
