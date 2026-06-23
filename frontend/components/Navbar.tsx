"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, logout } from "@/lib/auth";
import clsx from "clsx";

const NAV: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Proveedores", href: "/admin/providers" },
    { label: "Servicios", href: "/admin/services" },
    { label: "Vouchers", href: "/admin/vouchers" },
    { label: "Reportes", href: "/reports" },
  ],
  front_desk: [
    { label: "Registrar Uso", href: "/front-desk" },
  ],
  auditor: [
    { label: "Auditoría", href: "/audit" },
    { label: "Reportes", href: "/reports" },
  ],
};

export default function Navbar() {
  const user = getStoredUser();
  const pathname = usePathname();
  const items = user ? (NAV[user.role] ?? []) : [];

  return (
    <nav className="bg-[#002147] text-white h-full flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-300">The Costa Rica Collection</div>
        <div className="text-white font-semibold text-sm mt-0.5">Vouchers</div>
      </div>
      <div className="flex-1 py-4 space-y-1 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-[#0066CC] text-white"
                : "text-blue-100 hover:bg-white/10"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-blue-300 truncate">{user.name}</div>
          <div className="text-xs text-white/50 capitalize">{user.role.replace("_", " ")}</div>
          <button
            onClick={logout}
            className="mt-2 text-xs text-red-300 hover:text-red-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}
