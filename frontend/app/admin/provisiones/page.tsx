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

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
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

// Build first/last day of a month
function monthRange(year: number, month: number): [string, string] {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return [from, to];
}

export default function ProvisionesPage() {
  const today   = new Date();
  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1); // 1-12
  const [propFilter, setPropFilter] = useState("");
  const [provFilter, setProvFilter] = useState("");
  // PENDIENTE + EN_DISPUTA by default; allow toggling
  const [inclPendiente,  setInclPendiente]  = useState(true);
  const [inclDisputa,    setInclDisputa]    = useState(true);

  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [providers, setProviders]     = useState<Provider[]>([]);
  const [loading, setLoading]         = useState(true);

  const [dateFrom, dateTo] = monthRange(selYear, selMonth);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo };
    if (propFilter) params.property_name = propFilter;
    api.getVouchers(params).then(setAllVouchers).catch(console.error).finally(() => setLoading(false));
  }, [dateFrom, dateTo, propFilter]);

  useEffect(() => {
    api.getProviders(false).then(setProviders).catch(console.error);
  }, []);

  // Client-side: status filter + provider
  const vouchers = useMemo(() => {
    const allowed = new Set<string>();
    if (inclPendiente) allowed.add("PENDIENTE");
    if (inclDisputa)   allowed.add("EN_DISPUTA");
    let v = allVouchers.filter(x => allowed.has(x.audit_status ?? "PENDIENTE"));
    if (provFilter) v = v.filter(x => String(x.provider_id ?? 0) === provFilter);
    return v;
  }, [allVouchers, provFilter, inclPendiente, inclDisputa]);

  // Same hierarchy as AP: provider → invoice → vouchers
  type InvoiceGroup  = { invoice: string; items: Voucher[]; subtotal: number };
  type ProviderGroup = { provider_id: string; name: string; invoices: InvoiceGroup[]; total: number; hasDispute: boolean };

  const groups: ProviderGroup[] = useMemo(() => {
    const m: Record<string, ProviderGroup> = {};
    for (const v of vouchers) {
      const pid   = String(v.provider_id ?? 0);
      const pname = v.provider?.name ?? "Servicio Propio CWL";
      const inv   = v.invoice_number ?? "(Sin factura)";
      const amt   = Number(v.unit_price) * v.quantity;
      if (!m[pid]) m[pid] = { provider_id: pid, name: pname, invoices: [], total: 0, hasDispute: false };
      m[pid].total += amt;
      if ((v.audit_status ?? "PENDIENTE") === "EN_DISPUTA") m[pid].hasDispute = true;
      let ig = m[pid].invoices.find(i => i.invoice === inv);
      if (!ig) { ig = { invoice: inv, items: [], subtotal: 0 }; m[pid].invoices.push(ig); }
      ig.items.push(v);
      ig.subtotal += amt;
    }
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [vouchers]);

  const grandTotal    = vouchers.reduce((s, v) => s + Number(v.unit_price) * v.quantity, 0);
  const cntPendiente  = allVouchers.filter(v => (v.audit_status ?? "PENDIENTE") === "PENDIENTE").length;
  const cntDisputa    = allVouchers.filter(v => v.audit_status === "EN_DISPUTA").length;
  const cntAprobado   = allVouchers.filter(v => v.audit_status === "APROBADO").length;

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <AppShell roles={["admin"]}>

      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Provisiones Contables</h1>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
            Contabilidad
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Costos de servicios pendientes o en disputa al cierre del mes. El ingreso ya fue reconocido — provisione el costo para cuadrar el período.
        </p>
      </div>

      {/* ── Selector de corte de mes ─────────────────────────────────────────── */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Mes / Año */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-semibold uppercase tracking-wide">Corte de Mes</label>
            <div className="flex gap-2">
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm font-semibold">
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm font-semibold">
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">{dateFrom} → {dateTo}</p>
          </div>

          {/* Propiedad */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Propiedad</label>
            <select value={propFilter} onChange={e => setPropFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Todas las propiedades</option>
              {PROPERTIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Proveedor */}
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

          {/* Toggle estados */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Incluir en provisión</label>
            <div className="flex gap-2">
              <button onClick={() => setInclPendiente(v => !v)}
                className={`text-xs px-3 py-2 rounded-lg border-2 font-semibold transition-all ${inclPendiente ? "border-gray-500 bg-gray-100 text-gray-700" : "border-gray-200 text-gray-300"}`}>
                ⏳ Pendientes {cntPendiente > 0 ? `(${cntPendiente})` : ""}
              </button>
              <button onClick={() => setInclDisputa(v => !v)}
                className={`text-xs px-3 py-2 rounded-lg border-2 font-semibold transition-all ${inclDisputa ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-300"}`}>
                ⚠ En Disputa {cntDisputa > 0 ? `(${cntDisputa})` : ""}
              </button>
            </div>
          </div>
        </div>

        {/* Info de aprobados en el mes (no entran en provisión) */}
        {cntAprobado > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <span className="font-semibold">✓ {cntAprobado} voucher{cntAprobado !== 1 ? "s" : ""} ya aprobados</span>
            <span className="text-green-500">— no entran en esta provisión, van a Cuentas por Pagar.</span>
          </div>
        )}
      </div>

      {/* ── Resumen provisión ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="card py-4 text-center border-2 border-purple-200 bg-purple-50">
          <div className="text-2xl font-bold text-purple-700">{fmt(grandTotal)}</div>
          <div className="text-xs text-purple-600 mt-1 font-semibold">Total a provisionar</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{vouchers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Vouchers en provisión</div>
        </div>
        <div className="card py-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{groups.length}</div>
          <div className="text-xs text-gray-500 mt-1">Proveedores</div>
        </div>
      </div>

      {/* ── Asiento contable sugerido ─────────────────────────────────────────── */}
      {grandTotal > 0 && (
        <div className="card mb-6 bg-purple-50 border border-purple-200">
          <h3 className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2">Asiento sugerido — Cierre {MONTHS[selMonth-1]} {selYear}</h3>
          <div className="font-mono text-xs space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>Dr. Gasto de Servicios (Costo de Ventas)</span>
              <span className="font-bold">{fmt(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 pl-8">
              <span>Cr. Cuentas por Pagar — Proveedores</span>
              <span className="font-bold">{fmt(grandTotal)}</span>
            </div>
          </div>
          <p className="text-xs text-purple-500 mt-2">* Detallar por proveedor según el desglose abajo. Reversión al mes siguiente al recibir factura y aprobar.</p>
        </div>
      )}

      {loading && <div className="text-center text-gray-400 py-12">Cargando…</div>}

      {!loading && groups.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          No hay costos pendientes de provisionar para {MONTHS[selMonth-1]} {selYear}.
        </div>
      )}

      {/* ── Detalle por proveedor → factura ─────────────────────────────────── */}
      {!loading && groups.map(group => (
        <div key={group.provider_id} className="mb-6">

          {/* Header proveedor */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-t-xl text-white ${group.hasDispute ? "bg-orange-700" : "bg-purple-800"}`}>
            <div className="flex items-center gap-3">
              <span className="font-bold">{group.name}</span>
              {group.hasDispute && (
                <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-semibold">⚠ En disputa</span>
              )}
              <span className="text-xs text-purple-200">
                {group.invoices.length} factura{group.invoices.length !== 1 ? "s" : ""} · {group.invoices.reduce((s,i)=>s+i.items.length,0)} voucher{group.invoices.reduce((s,i)=>s+i.items.length,0)!==1?"s":""}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{fmt(group.total)}</div>
              <div className="text-xs text-purple-200">a provisionar</div>
            </div>
          </div>

          {/* Por factura */}
          {group.invoices.map((ig, idx) => (
            <div key={ig.invoice} className={`border-l-4 ${ig.invoice === "(Sin factura)" ? "border-orange-400" : "border-purple-400"} ${idx === group.invoices.length - 1 ? "rounded-b-xl" : ""} overflow-hidden`}>

              {/* Sub-header factura */}
              <div className="flex items-center justify-between px-5 py-2 bg-gray-100 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Factura</span>
                  {ig.invoice === "(Sin factura)"
                    ? <span className="text-xs text-orange-600 font-bold">Sin número de factura</span>
                    : <span className="font-mono font-bold text-purple-800">{ig.invoice}</span>}
                  <span className="text-xs text-gray-400">({ig.items.length} voucher{ig.items.length !== 1 ? "s" : ""})</span>
                </div>
                <span className="font-bold text-purple-800">{fmt(ig.subtotal)}</span>
              </div>

              {/* Detalle */}
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
                        <td className="table-td font-mono text-xs font-bold text-purple-800">{v.consecutive_number}</td>
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
                        <td className="table-td text-right font-bold text-purple-800">
                          {fmt(Number(v.unit_price) * v.quantity)}
                        </td>
                        <td className="table-td text-center"><AuditBadge status={v.audit_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-purple-50 border-t border-purple-200">
                    <tr>
                      <td colSpan={7} className="table-td text-right text-xs font-semibold text-purple-800">
                        Subtotal Factura {ig.invoice}
                      </td>
                      <td className="table-td text-right font-bold text-purple-700">{fmt(ig.subtotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {group.invoices.length > 1 && (
            <div className="flex justify-end bg-purple-800 rounded-b-xl px-5 py-2">
              <span className="text-white text-sm font-semibold mr-4">Total {group.name}</span>
              <span className="text-white font-bold text-lg">{fmt(group.total)}</span>
            </div>
          )}
        </div>
      ))}

      {/* ── Total provisión ──────────────────────────────────────────────────── */}
      {!loading && groups.length > 0 && (
        <div className="flex justify-end mt-2 mb-8">
          <div className="card px-8 py-5 border-2 border-purple-400 bg-purple-50">
            <div className="text-xs text-purple-600 uppercase tracking-wide font-semibold mb-1 text-center">
              Provisión Total — {MONTHS[selMonth-1]} {selYear}
            </div>
            <div className="text-3xl font-bold text-purple-700 text-center">{fmt(grandTotal)}</div>
            <div className="text-xs text-gray-400 mt-1 text-center">
              {vouchers.length} vouchers · {groups.length} proveedores
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
