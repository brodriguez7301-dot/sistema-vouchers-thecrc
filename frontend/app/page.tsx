"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, login } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      redirect(user.role, router);
    } else {
      login("admin@thecrc.com", "Admin2026!")
        .then(u => redirect(u.role, router))
        .catch(() => router.replace("/login"));
    }
  }, [router]);
  return <div className="flex items-center justify-center h-screen text-gray-400">Cargando…</div>;
}

function redirect(role: string, router: ReturnType<typeof useRouter>) {
  if (role === "admin") router.replace("/admin");
  else if (role === "front_desk") router.replace("/front-desk");
  else router.replace("/audit");
}
