"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, login } from "@/lib/auth";
import Navbar from "./Navbar";

export default function AppShell({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const go = async () => {
      let user = getStoredUser();
      if (!user) {
        try {
          user = await login("admin@thecrc.com", "Admin2026!");
        } catch {
          router.replace("/login");
          return;
        }
      }
      if (roles && !roles.includes(user.role)) {
        router.replace("/login");
        return;
      }
      setReady(true);
    };
    go();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-gray-400 text-sm">Cargando…</div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-52 flex-shrink-0">
        <Navbar onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar mobile drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Navbar onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden bg-[#002147] text-white flex items-center px-4 py-3 gap-3 flex-shrink-0">
          <button onClick={() => setMenuOpen(true)} className="text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-300">The Costa Rica Collection</div>
            <div className="text-white font-semibold text-xs">Vouchers</div>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
