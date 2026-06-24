"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Voucher } from "@/lib/types";
import { CHANNEL_LABELS } from "@/lib/types";

const PROPERTIES = ["", "Corcovado Wilderness Lodge", "Ojochal Garden", "Amarena Canvas Beach Hotel", "Oxigen"];
const STATUSES   = ["", "PENDING", "ISSUED", "INVOICED", "PAID", "CANCELLED"];

export default function AuditoriaPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading]   = useState(true);
  const [propFilter, setPropFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (propFilter)   params.property_name = propFilter;
    if (dateFrom)     params.date_from = dateFrom;
    if (dateTo)       params.date_to   = dateTo;
    api.getVouchers(Object.keys(params).length ? params : undefined)
      .then(setVouchers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, propFilter, dateFrom, dateTo]);

  const fmt = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toFixed(2)}` : "—";

  // Summary stats
  const withBothPrices = vouchers.filter(v => v.guest_price != null);
  const totalGross   = withBothPrices.reduce((s, v) => s + (v.guest_price ?? 0) * v.quantity, 0);
  const totalCost    = withBothPrices.reduce((s, v) => s + v.unit_price * v.quantity, 0);
  const totalMargin  = totalGross - totalCost;
  const marginPct    = totalGross > 0 ? (totalMargin / totalGross) * 100 : 0;
  const anomalies    = vouchers.filter(v =>
    v.guest_price != null && v.unit_price > (v.guest_price ?? 0)
  ).length;

  return (
    <AppShell roles={["admin", "auditor"]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Auditoría de Vouchers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verifique que el proveedor cobró correctamente y que el huésped fue cobrado según el tarifario.
        </p>
      </div>

      {/* ── Resumen ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-[#0066CC]">{vouchers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Vouchers</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-[#0066CC]">{fmt(totalGross)}</div>
          <div className="text-xs text-gray-500 mt-1">Total cobrado huéspedes</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{fmt(totalCost)}</div>
          <div className="text-xs text-gray-500 mt-1">Total costo proveedores</div>
        </div>
        <div className={`card py-4 text-center ${anomalies > 0 ? "border-red-300 bg-red-50" : ""}`}>
          <div className={`text-2xl font-bold ${anomalies > 0 ? "text-red-600" : "text-green-600"}`}>
            {anomalies > 0 ? `⚠ ${anomalies}` : "0"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Anomalías (costo &gt; precio)</div>
        </div>
      </div>

      {/* Margen global */}
      {withBothPrices.length > 0 && (
        <div className="card mb-6 flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-xs text-gray-500">Margen bruto total</span>
            <div className={`text-xl font-bold ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(totalMargin)}</div>
          </div>
          <div>
            <span className="text-xs text-gray-500">Margen %</span>
            <div className={`text-xl font-bold ${marginPct >= 0 ? "text-green-600" : "text-red-600"}`}>{marginPct.toFixed(1)}%</div>
          </div>
          <div className="text-xs text-gray-400 ml-auto">Basado en {withBothPrices.length} voucher(s) con precio al huésped registrado</div>
        </div>
      )}

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Fecha desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Fecha hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Propiedad</label>
          <select value={propFilter} onChange={e => setPropFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todas</option>
            {PROPERTIES.filter(Boolean).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Estado</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos</option>
            {STATUSES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {(dateFrom || dateTo || propFilter || statusFilter) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setPropFilter(""); setStatusFilter(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline self-end pb-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Servicio</th>
                <th className="table-th">Proveedor</th>
                <th className="table-th">Huésped</th>
                <th className="table-th">Prop.</th>
                <th className="table-th">Canal</th>
                <th className="table-th">PAX</th>
                <th className="table-th text-[#0066CC]">P. Huésped</th>
                <th className="table-th text-gray-600">Costo Prov.</th>
                <th className="table-th">Margen</th>
                <th className="table-th">Margen %</th>
                <th className="table-th">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={13} className="table-td text-center text-gray-400 py-8">Cargando…</td></tr>
              )}
              {!loading && vouchers.map(v => {
                const gp = v.guest_price ?? null;
                const cp = v.unit_price;
                const margin = gp != null ? (gp - cp) : null;
                const marginPctRow = gp != null && gp > 0 ? ((gp - cp) / gp) * 100 : null;
                const isAnomaly = gp != null && cp > gp;
                return (
                  <tr key={v.voucher_id} className={`hover:bg-gray-50 ${isAnomaly ? "bg-red-50" : ""}`}>
                    <td className="table-td font-mono text-xs font-bold text-red-600">{v.consecutive_number}</td>
                    <td className="table-td text-xs text-gray-500">
                      {v.service_date ?? v.assigned_date?.slice(0, 10)}
                    </td>
                    <td className="table-td max-w-[160px]">
                      {v.service?.pricing_code && (
                        <span className="font-mono text-xs text-gray-400 mr-1">[{v.service.pricing_code}]</span>
                      )}
                      <span className="truncate block">{v.service?.service_name ?? "—"}</span>
                    </td>
                    <td className="table-td text-xs text-gray-600">{v.provider?.name ?? <span className="text-gray-300">Propio</span>}</td>
                    <td className="table-td">
                      <div className="font-medium">{v.guest_name}</div>
                      <div className="text-xs text-gray-400">Hab. {v.room_number}</div>
                    </td>
                    <td className="table-td text-xs text-gray-500 max-w-[100px] truncate">{v.property_name}</td>
                    <td className="table-td">
                      {v.sales_channel
                        ? <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">{CHANNEL_LABELS[v.sales_channel] ?? v.sales_channel}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td text-center font-semibold">{v.quantity}</td>
                    <td className="table-td font-semibold text-[#0066CC]">
                      {gp != null ? fmt(gp) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td font-semibold text-gray-700">{fmt(cp)}</td>
                    <td className={`table-td font-semibold ${isAnomaly ? "text-red-600" : margin != null && margin >= 0 ? "text-green-600" : "text-gray-300"}`}>
                      {margin != null ? fmt(margin) : "—"}
                      {isAnomaly && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className={`table-td font-semibold ${isAnomaly ? "text-red-600" : marginPctRow != null && marginPctRow >= 0 ? "text-green-600" : "text-gray-300"}`}>
                      {marginPctRow != null ? `${marginPctRow.toFixed(1)}%` : "—"}
                    </td>
                    <td className="table-td"><StatusBadge status={v.status} /></td>
                  </tr>
                );
              })}
              {!loading && vouchers.length === 0 && (
                <tr><td colSpan={13} className="table-td text-center text-gray-400 py-8">Sin vouchers para los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded mr-1"></span>
        Filas en rojo: costo del proveedor supera el precio cobrado al huésped — revisar.
      </p>
    </AppShell>
  );
}
