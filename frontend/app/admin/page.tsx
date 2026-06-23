"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card">
      <div className="text-sm text-gray-500 font-medium">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <AppShell roles={["admin"]}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard — Administración</h1>
      {data ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <KpiCard label="Total Vouchers" value={data.total_vouchers} color="text-[#002147]" />
          <KpiCard label="Emitidos (ISSUED)" value={data.total_issued} color="text-[#0066CC]" />
          <KpiCard label="Facturados" value={data.total_invoiced} color="text-purple-600" />
          <KpiCard label="Validados" value={data.total_validated} color="text-green-600" />
          <KpiCard label="Ingreso Validado" value={fmt(data.total_amount_validated)} color="text-green-700" />
          <KpiCard label="Proveedores Activos" value={data.total_providers} color="text-[#002147]" />
        </div>
      ) : (
        <div className="text-gray-400">Cargando métricas…</div>
      )}
      <div className="grid grid-cols-3 gap-5">
        {[
          { href: "/admin/providers", label: "Gestionar Proveedores", icon: "🏢" },
          { href: "/admin/services", label: "Gestionar Servicios", icon: "🎯" },
          { href: "/admin/vouchers", label: "Crear / Ver Vouchers", icon: "🎫" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="card hover:border-[#0066CC] hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
            <span className="text-3xl">{item.icon}</span>
            <span className="font-semibold text-gray-700">{item.label}</span>
          </a>
        ))}
      </div>
    </AppShell>
  );
}
