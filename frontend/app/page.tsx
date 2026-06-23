"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
    } else if (user.role === "admin") {
      router.replace("/admin");
    } else if (user.role === "front_desk") {
      router.replace("/front-desk");
    } else {
      router.replace("/audit");
    }
  }, [router]);
  return <div className="flex items-center justify-center h-screen text-gray-400">Redirigiendo…</div>;
}
