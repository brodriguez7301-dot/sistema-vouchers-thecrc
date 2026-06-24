"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Voucher, AuditStatus } from "@/lib/types";
import { CHANNEL_LABELS, AUDIT_STATUS_LABELS, AUDIT_STATUS_COLORS } from "@/lib/types";

const PROPERTIES = ["", "Corcovado Wilderness Lodge", "Ojochal Garden", "Amarena Canvas Beach Hotel", "Oxigen"];

type AuditFilter = "TODOS" | "PENDIENTE" | "APROBADO" | "EN_DISPUTA";

interface AuditModal {
  voucher: Voucher;
  audit_status: AuditStatus;
  invoice_number: string;
  audit_notes: string;
}

function AuditBadge({ status }: { status?: AuditStatus | null }) {
  const s = status ?? "PENDIENTE";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${AUDIT_STATUS_COLORS[s]}`}>
      {AUDIT_STATUS_LABELS[s]}
    </span>
  );
}

export default function AuditoriaPage() {
  const [vouchers, setVouchers]     = useState<Voucher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [propFilter, setPropFilter] = useState("");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("TODOS");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [modal, setModal]           = useState<AuditModal | null>(null);
  const [saving, setSaving]         = useState(false);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (propFilter) params.property_name = propFilter;
    if (dateFrom)   params.date_from = dateFrom;
    if (dateTo)     params.date_to   = dateTo;
    api.getVouchers(Object.keys(params).length ? params : undefined)
      .then(setVouchers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [propFilter, dateFrom, dateTo]);

  const displayed = auditFilter === "TODOS"
    ? vouchers
    : vouchers.filter(v => (v.audit_status ?? "PENDIENTE") === auditFilter);

  const fmt = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toFixed(2)}` : "—";

  // Summary counts
  const counts = {
    PENDIENTE:  vouchers.filter(v => (v.audit_status ?? "PENDIENTE") === "PENDIENTE").length,
    APROBADO:   vouchers.filter(v => v.audit_status === "APROBADO").length,
    EN_DISPUTA: vouchers.filter(v => v.audit_status === "EN_DISPUTA").length,
  };

  // Margin stats for displayed rows
  const withBoth = displayed.filter(v => v.guest_price != null);
  const totalGuest  = withBoth.reduce((s, v) => s + (v.guest_price ?? 0) * v.quantity, 0);
  const totalCost   = withBoth.reduce((s, v) => s + v.unit_price * v.quantity, 0);
  const totalMargin = totalGuest - totalCost;
  const anomalies   = displayed.filter(v => v.guest_price != null && v.unit_price > (v.guest_price ?? 0)).length;

  function openModal(v: Voucher) {
    setModal({
      voucher: v,
      audit_status: v.audit_status ?? "PENDIENTE",
      invoice_number: v.invoice_number ?? "",
      audit_notes: v.audit_notes ?? "",
    });
  }

  async function saveAudit() {
    if (!modal) return;
    setSaving(true);
    try {
      await api.auditVoucher(modal.voucher.voucher_id, {
        audit_status:   modal.audit_status,
        invoice_number: modal.invoice_number || undefined,
        audit_notes:    modal.audit_notes    || undefined,
      });
      setModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  return (
    <AppShell roles={["admin", "auditor"]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Auditoría de Vouchers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Valide que el proveedor cobró correctamente y que el precio al huésped coincide con el tarifario.
        </p>
      </div>

      {/* ── Resumen de estados ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(["PENDIENTE", "APROBADO", "EN_DISPUTA"] as AuditFilter[]).map(s => (
          <button key={s}
            onClick={() => setAuditFilter(auditFilter === s ? "TODOS" : s)}
            className={`card py-4 text-center transition-all border-2 ${auditFilter === s ? "border-[#0066CC] shadow-md" : "border-transparent"}`}>
            <div className={`text-2xl font-bold ${s === "APROBADO" ? "text-green-600" : s === "EN_DISPUTA" ? "text-orange-600" : "text-gray-500"}`}>
              {counts[s as keyof typeof counts]}
            </div>
            <div className="text-xs text-gray-500 mt-1">{AUDIT_STATUS_LABELS[s as AuditStatus]}</div>
          </button>
        ))}
        <div className={`card py-4 text-center ${anomalies > 0 ? "bg-red-50 border-red-200" : ""}`}>
          <div className={`text-2xl font-bold ${anomalies > 0 ? "text-red-600" : "text-green-600"}`}>
            {anomalies > 0 ? `⚠ ${anomalies}` : "0"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Anomalías de precio</div>
        </div>
      </div>

      {/* Margen */}
      {withBoth.length > 0 && (
        <div className="card mb-5 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs text-gray-500">Total cobrado huéspedes</div>
            <div className="text-lg font-bold text-[#0066CC]">{fmt(totalGuest)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total costo proveedores</div>
            <div className="text-lg font-bold text-gray-700">{fmt(totalCost)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Margen bruto</div>
            <div className={`text-lg font-bold ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(totalMargin)} ({totalGuest > 0 ? ((totalMargin / totalGuest) * 100).toFixed(1) : "0"}%)
            </div>
          </div>
          <div className="text-xs text-gray-400 ml-auto">
            {withBoth.length} de {displayed.length} voucher(s) con precio al huésped
          </div>
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
        {auditFilter !== "TODOS" && (
          <div className="self-end pb-0.5">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${AUDIT_STATUS_COLORS[auditFilter as AuditStatus]}`}>
              Filtro: {AUDIT_STATUS_LABELS[auditFilter as AuditStatus]}
            </span>
            <button onClick={() => setAuditFilter("TODOS")} className="ml-2 text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
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
                <th className="table-th">Huésped / Hab.</th>
                <th className="table-th">Canal</th>
                <th className="table-th">PAX</th>
                <th className="table-th text-[#0066CC]">P. Huésped</th>
                <th className="table-th">Costo Prov.</th>
                <th className="table-th">Margen</th>
                <th className="table-th">Factura</th>
                <th className="table-th">Auditoría</th>
                <th className="table-th">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={13} className="table-td text-center text-gray-400 py-8">Cargando…</td></tr>
              )}
              {!loading && displayed.map(v => {
                const gp = v.guest_price ?? null;
                const cp = v.unit_price;
                const margin = gp != null ? gp - cp : null;
                const isAnomaly = gp != null && cp > gp;
                return (
                  <tr key={v.voucher_id} className={`hover:bg-gray-50 ${isAnomaly ? "bg-red-50" : ""}`}>
                    <td className="table-td font-mono text-xs font-bold text-red-600">{v.consecutive_number}</td>
                    <td className="table-td text-xs text-gray-500 whitespace-nowrap">
                      {v.service_date ?? v.assigned_date?.slice(0, 10)}
                    </td>
                    <td className="table-td max-w-[150px]">
                      {v.service?.pricing_code && (
                        <span className="font-mono text-xs text-gray-400 mr-1">[{v.service.pricing_code}]</span>
                      )}
                      <span className="block truncate">{v.service?.service_name ?? "—"}</span>
                    </td>
                    <td className="table-td text-xs text-gray-600 max-w-[110px] truncate">
                      {v.provider?.name ?? <span className="text-gray-300 italic">Propio</span>}
                    </td>
                    <td className="table-td">
                      <div className="font-medium">{v.guest_name}</div>
                      <div className="text-xs text-gray-400">Hab. {v.room_number}</div>
                    </td>
                    <td className="table-td">
                      {v.sales_channel
                        ? <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                            {CHANNEL_LABELS[v.sales_channel] ?? v.sales_channel}
                          </span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td text-center font-semibold">{v.quantity}</td>
                    <td className="table-td font-semibold text-[#0066CC]">
                      {gp != null ? fmt(gp) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td font-semibold text-gray-700">{fmt(cp)}</td>
                    <td className={`table-td font-semibold ${isAnomaly ? "text-red-600" : margin != null && margin >= 0 ? "text-green-600" : "text-gray-300"}`}>
                      {margin != null ? <>{fmt(margin)}{isAnomaly && " ⚠"}</> : "—"}
                    </td>
                    <td className="table-td text-xs font-mono text-gray-600">
                      {v.invoice_number ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td">
                      <AuditBadge status={v.audit_status} />
                    </td>
                    <td className="table-td">
                      <button onClick={() => openModal(v)}
                        className="text-xs text-[#0066CC] hover:underline font-semibold whitespace-nowrap">
                        Revisar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && displayed.length === 0 && (
                <tr><td colSpan={13} className="table-td text-center text-gray-400 py-8">Sin vouchers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded mr-1 align-middle"></span>
        Filas en rojo: costo del proveedor supera el precio al huésped.
      </p>

      {/* ── Modal de revisión ───────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Revisar Voucher</h2>
            <p className="text-xs text-gray-400 mb-4 font-mono">{modal.voucher.consecutive_number}</p>

            {/* Resumen del voucher */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-right max-w-[200px] truncate">
                  {modal.voucher.service?.service_name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proveedor</span>
                <span className="font-medium">{modal.voucher.provider?.name ?? "Propio CWL"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Canal de venta</span>
                <span className="font-medium">
                  {modal.voucher.sales_channel ? CHANNEL_LABELS[modal.voucher.sales_channel] : "—"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-gray-500">Precio al huésped</span>
                <span className="font-bold text-[#0066CC]">
                  {modal.voucher.guest_price != null ? `$${Number(modal.voucher.guest_price).toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Costo proveedor</span>
                <span className="font-bold text-gray-700">${Number(modal.voucher.unit_price).toFixed(2)}</span>
              </div>
              {modal.voucher.guest_price != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Margen</span>
                  <span className={`font-bold ${Number(modal.voucher.guest_price) >= Number(modal.voucher.unit_price) ? "text-green-600" : "text-red-600"}`}>
                    ${(Number(modal.voucher.guest_price) - Number(modal.voucher.unit_price)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Factura del proveedor */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                N° Factura del Proveedor
              </label>
              <input
                type="text"
                placeholder="Ej. FAC-2026-0123"
                value={modal.invoice_number}
                onChange={e => setModal(m => m ? { ...m, invoice_number: e.target.value } : m)}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>

            {/* Estado de auditoría */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-2">Estado de Auditoría</label>
              <div className="grid grid-cols-3 gap-2">
                {(["PENDIENTE", "APROBADO", "EN_DISPUTA"] as AuditStatus[]).map(s => (
                  <button key={s} type="button"
                    onClick={() => setModal(m => m ? { ...m, audit_status: s } : m)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                      modal.audit_status === s
                        ? s === "APROBADO" ? "border-green-500 bg-green-50 text-green-700"
                          : s === "EN_DISPUTA" ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-400 bg-gray-100 text-gray-700"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}>
                    {s === "PENDIENTE" ? "⏳ Pendiente" : s === "APROBADO" ? "✓ Aprobado" : "⚠ En Disputa"}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Notas del Auditor</label>
              <textarea
                placeholder="Observaciones, justificación de disputa, etc."
                value={modal.audit_notes}
                onChange={e => setModal(m => m ? { ...m, audit_notes: e.target.value } : m)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={saveAudit} disabled={saving}
                className="btn-primary flex-1">
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button onClick={() => setModal(null)} disabled={saving}
                className="btn-secondary flex-1">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
