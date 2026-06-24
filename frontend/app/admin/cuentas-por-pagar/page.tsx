"use client";
import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Voucher, Provider, AuditStatus } from "@/lib/types";
import { AUDIT_STATUS_LABELS, AUDIT_STATUS_COLORS } from "@/lib/types";

const PROPERTIES = [
  "Corcovado Wilderness Lodge",
  "Ojochal Garden",
  "Amarena Canvas Beach Hotel",
  "Oxigen",
];

const AUDIT_OPTIONS: { value: string; label: string }[] = [
  { value: "",            label: "Todos los estados" },
  { value: "APROBADO",   label: "Aprobado" },
  { value: "PENDIENTE",  label: "Pendiente" },
  { value: "EN_DISPUTA", label: "En Disputa" },
];

function AuditBadge({ status }: { status?: AuditStatus | null }) {
  const s = status ?? "PENDIENTE";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${AUDIT_STATUS_COLORS[s]}`}>
      {AUDIT_STATUS_LABELS[s]}
    </span>
  );
}

const fmt = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CuentasPorPagarPage() {
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [providers, setProviders]     = useState<Provider[]>([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [propFilter,   setPropFilter]   = useState("");
  const [provFilter,   setProvFilter]   = useState("");
  const [auditFilter,  setAuditFilter]  = useState("");

  // Fetch all vouchers (server filters: date + property)
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (dateFrom)   params.date_from     = dateFrom;
    if (dateTo)     params.date_to       = dateTo;
    if (propFilter) params.property_name = propFilter;
    api.getVouchers(Object.keys(params).length ? params : undefined)
      .then(setAllVouchers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, propFilter]);

  useEffect(() => {
    api.getProviders(false).then(setProviders).catch(console.error);
  }, []);

  // Client-side filters: provider + audit_status
  const vouchers = useMemo(() => {
    let v = allVouchers;
    if (provFilter)  v = v.filter(x => String(x.provider_id ?? 0) === provFilter);
    if (auditFilter) v = v.filter(x => (x.audit_status ?? "PENDIENTE") === auditFilter);
    return v;
  }, [allVouchers, provFilter, auditFilter]);

  // Build hierarchy: provider → invoice → vouchers
  type InvoiceGroup = { invoice: string; items: Voucher[]; subtotal: number };
  type ProviderGroup = {
    provider_id: string;
    name: string;
    invoices: InvoiceGroup[];
    total: number;
    hasDispute: boolean;
  };

  const groups: ProviderGroup[] = useMemo(() => {
    const provMap: Record<string, ProviderGroup> = {};
    for (const v of vouchers) {
      const pid    = String(v.provider_id ?? 0);
      const pname  = v.provider?.name ?? "Servicio Propio CWL";
      const inv    = v.invoice_number ?? "(Sin factura)";
      const amount = Number(v.unit_price) * v.quantity;
      if (!provMap[pid]) provMap[pid] = { provider_id: pid, name: pname, invoices: [], total: 0, hasDispute: false };
      provMap[pid].total += amount;
      if ((v.audit_status ?? "PENDIENTE") === "EN_DISPUTA") provMap[pid].hasDispute = true;
      let ig = provMap[pid].invoices.find(i => i.invoice === inv);
      if (!ig) { ig = { invoice: inv, items: [], subtotal: 0 }; provMap[pid].invoices.push(ig); }
      ig.items.push(v);
      ig.subtotal += amount;
    }
    return Object.values(provMap).sort((a, b) => b.total - a.total);
  }, [vouchers]);

  const grandTotal   = vouchers.reduce((s, v) => s + Number(v.unit_price) * v.quantity, 0);
  const countApproved = vouchers.filter(v => v.audit_status === "APROBADO").length;
  const countDispute  = vouchers.filter(v => v.audit_status === "EN_DISPUTA").length;
  const countPending  = vouchers.filter(v => (v.audit_status ?? "PENDIENTE") === "PENDIENTE").length;

  const clearFilters = () => {
    setDateFrom(""); setDateTo(""); setPropFilter(""); setProvFilter(""); setAuditFilter("");
  };
  const hasFilters = dateFrom || dateTo || propFilter || provFilter || auditFilter;

  return (
    <AppShell roles={["admin"]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cuentas por Pagar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Detalle por proveedor y factura. Use los filtros para buscar por estado, propiedad o proveedor.
        </p>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
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
              <option value="">Todas las propiedades</option>
              {PROPERTIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Proveedor</label>
            <select value={provFilter} onChange={e => setProvFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Todos los proveedores</option>
              {providers.map(p => (
                <option key={p.provider_id} value={String(p.provider_id)}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Estado auditoría</label>
            <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              {AUDIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="self-end text-xs text-gray-400 hover:text-gray-600 underline pb-2">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Resumen ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-[#0066CC]">{fmt(grandTotal)}</div>
          <div className="text-xs text-gray-500 mt-1">Total en vista</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-green-600">{countApproved}</div>
          <div className="text-xs text-gray-500 mt-1">Aprobados</div>
        </div>
        <div className="card py-4 text-center">
          <div className={`text-2xl font-bold ${countDispute > 0 ? "text-orange-600" : "text-gray-300"}`}>{countDispute}</div>
          <div className="text-xs text-gray-500 mt-1">En Disputa</div>
        </div>
        <div className="card py-4 text-center">
          <div className={`text-2xl font-bold ${countPending > 0 ? "text-gray-500" : "text-gray-300"}`}>{countPending}</div>
          <div className="text-xs text-gray-500 mt-1">Pendientes</div>
        </div>
      </div>

      {loading && <div className="text-center text-gray-400 py-12">Cargando…</div>}

      {!loading && groups.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          No hay registros para los filtros seleccionados.
        </div>
      )}

      {/* ── Por proveedor ────────────────────────────────────────────────────── */}
      {!loading && groups.map(group => (
        <div key={group.provider_id} className="mb-6">

          {/* Header proveedor */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-t-xl text-white ${group.hasDispute ? "bg-orange-700" : "bg-[#002147]"}`}>
            <div className="flex items-center gap-3">
              <span className="font-bold">{group.name}</span>
              {group.hasDispute && (
                <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-semibold">⚠ Tiene disputa</span>
              )}
              <span className="text-xs text-blue-300">{group.invoices.length} factura{group.invoices.length !== 1 ? "s" : ""} · {group.invoices.reduce((s, i) => s + i.items.length, 0)} voucher{group.invoices.reduce((s, i) => s + i.items.length, 0) !== 1 ? "s" : ""}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{fmt(group.total)}</div>
              <div className="text-xs text-blue-300">total proveedor</div>
            </div>
          </div>

          {/* Por factura */}
          {group.invoices.map((ig, idx) => (
            <div key={ig.invoice} className={`border-l-4 ${ig.invoice === "(Sin factura)" ? "border-orange-400" : "border-[#0066CC]"} ${idx === group.invoices.length - 1 ? "rounded-b-xl" : ""} overflow-hidden`}>

              {/* Sub-header factura */}
              <div className="flex items-center justify-between px-5 py-2 bg-gray-100 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Factura</span>
                  {ig.invoice === "(Sin factura)"
                    ? <span className="text-xs text-orange-600 font-bold">Sin número de factura</span>
                    : <span className="font-mono font-bold text-[#002147]">{ig.invoice}</span>}
                  <span className="text-xs text-gray-400">({ig.items.length} voucher{ig.items.length !== 1 ? "s" : ""})</span>
                </div>
                <span className="font-bold text-[#002147]">{fmt(ig.subtotal)}</span>
              </div>

              {/* Detalle vouchers */}
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b text-xs">
                    <tr>
                      <th className="table-th">N° Voucher</th>
                      <th className="table-th">Fecha</th>
                      <th className="table-th">Servicio</th>
                      <th className="table-th">Huésped</th>
                      <th className="table-th">Propiedad</th>
                      <th className="table-th text-center">PAX</th>
                      <th className="table-th text-right">Costo Unit.</th>
                      <th className="table-th text-right">Total</th>
                      <th className="table-th text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ig.items.map(v => (
                      <tr key={v.voucher_id} className={`hover:bg-gray-50 ${v.audit_status === "EN_DISPUTA" ? "bg-orange-50" : ""}`}>
                        <td className="table-td font-mono text-xs font-bold text-[#002147]">{v.consecutive_number}</td>
                        <td className="table-td text-xs text-gray-500 whitespace-nowrap">
                          {v.service_date ?? v.assigned_date?.slice(0, 10) ?? "—"}
                        </td>
                        <td className="table-td max-w-[160px]">
                          {v.service?.pricing_code && (
                            <span className="font-mono text-xs text-gray-400 mr-1">[{v.service.pricing_code}]</span>
                          )}
                          <span className="truncate block">{v.service?.service_name ?? "—"}</span>
                        </td>
                        <td className="table-td">
                          <div className="font-medium">{v.guest_name}</div>
                          <div className="text-xs text-gray-400">Hab. {v.room_number}</div>
                        </td>
                        <td className="table-td text-xs text-gray-500 whitespace-nowrap">{v.property_name}</td>
                        <td className="table-td text-center font-semibold">{v.quantity}</td>
                        <td className="table-td text-right text-gray-700">{fmt(Number(v.unit_price))}</td>
                        <td className="table-td text-right font-bold text-[#002147]">
                          {fmt(Number(v.unit_price) * v.quantity)}
                        </td>
                        <td className="table-td text-center">
                          <AuditBadge status={v.audit_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t border-blue-200">
                    <tr>
                      <td colSpan={7} className="table-td text-right text-xs font-semibold text-[#002147]">
                        Subtotal Factura {ig.invoice}
                      </td>
                      <td className="table-td text-right font-bold text-[#0066CC]">{fmt(ig.subtotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {/* Total proveedor (solo si tiene más de 1 factura) */}
          {group.invoices.length > 1 && (
            <div className="flex justify-end bg-[#002147] rounded-b-xl px-5 py-2">
              <span className="text-white text-sm font-semibold mr-4">Total {group.name}</span>
              <span className="text-white font-bold text-lg">{fmt(group.total)}</span>
            </div>
          )}
        </div>
      ))}

      {/* ── Gran total ───────────────────────────────────────────────────────── */}
      {!loading && groups.length > 0 && (
        <div className="flex justify-end mt-2 mb-8">
          <div className="card px-8 py-4 flex items-center gap-6 border-2 border-[#0066CC]">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Gran Total a Pagar</div>
              <div className="text-3xl font-bold text-[#0066CC]">{fmt(grandTotal)}</div>
              <div className="text-xs text-gray-400 mt-0.5">{vouchers.length} vouchers · {groups.length} proveedores</div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
