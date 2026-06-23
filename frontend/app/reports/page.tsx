"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Tab = "ingresos" | "proveedor" | "propiedad" | "anomalias" | "trazabilidad";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("ingresos");
  const [ingresos, setIngresos] = useState<{ provider: string; total: number; count: number }[]>([]);
  const [propiedad, setPropiedad] = useState<{ property: string; total: number; count: number }[]>([]);
  const [anomalias, setAnomalias] = useState<unknown[]>([]);
  const [traceId, setTraceId] = useState("");
  const [traceResult, setTraceResult] = useState<unknown>(null);
  const [traceError, setTraceError] = useState("");

  useEffect(() => {
    api.getIngresosValidados().then(d => setIngresos(d as typeof ingresos)).catch(console.error);
    api.getPorPropiedad().then(d => setPropiedad(d as typeof propiedad)).catch(console.error);
    api.getAnomalias().then(d => setAnomalias(d as unknown[])).catch(console.error);
  }, []);

  async function searchTrace(e: React.FormEvent) {
    e.preventDefault();
    setTraceError("");
    setTraceResult(null);
    try {
      const r = await api.getTrazabilidad(Number(traceId));
      setTraceResult(r);
    } catch (err: unknown) {
      setTraceError(err instanceof Error ? err.message : "No encontrado");
    }
  }

  const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const TABS: { id: Tab; label: string }[] = [
    { id: "ingresos", label: "Ingresos Validados" },
    { id: "proveedor", label: "Por Proveedor" },
    { id: "propiedad", label: "Por Propiedad" },
    { id: "anomalias", label: "Anomalías" },
    { id: "trazabilidad", label: "Trazabilidad" },
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-[#0066CC] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.label}</button>
        ))}
      </div>

      {(tab === "ingresos" || tab === "proveedor") && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Ingresos Validados por Proveedor</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ingresos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${v.toLocaleString()}`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total" fill="#0066CC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b">
              <tr><th className="table-th">Proveedor</th><th className="table-th">Total Validado</th><th className="table-th">Facturas</th></tr>
            </thead>
            <tbody className="divide-y">
              {ingresos.map(r => (
                <tr key={r.provider} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{r.provider}</td>
                  <td className="table-td font-semibold text-green-700">{fmt(r.total)}</td>
                  <td className="table-td">{r.count}</td>
                </tr>
              ))}
              {ingresos.length === 0 && <tr><td colSpan={3} className="table-td text-center text-gray-400 py-6">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "propiedad" && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Ingresos Validados por Propiedad</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={propiedad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="property" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${v.toLocaleString()}`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total" fill="#002147" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b">
              <tr><th className="table-th">Propiedad</th><th className="table-th">Total</th><th className="table-th">Facturas</th></tr>
            </thead>
            <tbody className="divide-y">
              {propiedad.map(r => (
                <tr key={r.property}><td className="table-td font-medium">{r.property}</td><td className="table-td font-semibold text-green-700">{fmt(r.total)}</td><td className="table-td">{r.count}</td></tr>
              ))}
              {propiedad.length === 0 && <tr><td colSpan={3} className="table-td text-center text-gray-400 py-6">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "anomalias" && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Anomalías — Montos con diferencia &gt;5%</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Consecutivo</th>
                <th className="table-th">Precio Voucher</th>
                <th className="table-th">Monto Factura</th>
                <th className="table-th">Diferencia</th>
                <th className="table-th">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(anomalias as { usage_id: number; consecutive_number: string; voucher_price: number; invoice_amount: number; diff_pct: number; status: string }[]).map(a => (
                <tr key={a.usage_id} className="hover:bg-gray-50">
                  <td className="table-td font-bold text-[#FF0000]">{a.consecutive_number}</td>
                  <td className="table-td">{fmt(a.voucher_price)}</td>
                  <td className="table-td">{fmt(a.invoice_amount)}</td>
                  <td className="table-td font-semibold text-red-600">{a.diff_pct}%</td>
                  <td className="table-td">{a.status}</td>
                </tr>
              ))}
              {anomalias.length === 0 && <tr><td colSpan={5} className="table-td text-center text-gray-400 py-6">Sin anomalías detectadas ✓</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "trazabilidad" && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Trazabilidad — Buscar por ID de Voucher</h2>
          <form onSubmit={searchTrace} className="flex gap-2 mb-6">
            <input value={traceId} onChange={e => setTraceId(e.target.value)} placeholder="Voucher ID (número)" className="border rounded-lg px-3 py-2 text-sm w-48" />
            <button type="submit" className="btn-primary">Buscar</button>
          </form>
          {traceError && <p className="text-red-600 text-sm mb-4">{traceError}</p>}
          {traceResult && (() => {
            const r = traceResult as { voucher: { consecutive_number: string; guest_name: string; room_number: string; status: string; unit_price: number; property_name: string }; usages: { usage_id: number; invoice_number: string; invoice_amount: number; status: string; usage_date: string; audits: { validation_status: string; auditor_name: string; findings: string }[] }[] };
            return (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="font-bold text-[#FF0000] text-lg mb-2">{r.voucher.consecutive_number}</div>
                  <div className="text-sm grid grid-cols-2 gap-1">
                    <span className="font-medium">Huésped:</span><span>{r.voucher.guest_name}</span>
                    <span className="font-medium">Habitación:</span><span>{r.voucher.room_number}</span>
                    <span className="font-medium">Precio:</span><span>{fmt(r.voucher.unit_price)}</span>
                    <span className="font-medium">Estado:</span><span>{r.voucher.status}</span>
                    <span className="font-medium">Propiedad:</span><span>{r.voucher.property_name}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-700">Historial de uso</h3>
                {r.usages.map(u => (
                  <div key={u.usage_id} className="border rounded-xl p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Factura {u.invoice_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "VALIDATED" ? "bg-green-100 text-green-700" : u.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{u.status}</span>
                    </div>
                    <div className="text-gray-500">Monto: {fmt(u.invoice_amount)} · {new Date(u.usage_date).toLocaleDateString("es-CR")}</div>
                    {u.audits.map((a, i) => (
                      <div key={i} className="mt-2 pl-3 border-l-2 border-blue-200 text-xs text-gray-600">
                        <span className="font-medium">{a.auditor_name}:</span> {a.validation_status} — {a.findings}
                      </div>
                    ))}
                  </div>
                ))}
                {r.usages.length === 0 && <p className="text-gray-400 text-sm">Sin usos registrados</p>}
              </div>
            );
          })()}
        </div>
      )}
    </AppShell>
  );
}
