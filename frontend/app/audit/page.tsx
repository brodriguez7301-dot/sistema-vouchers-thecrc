"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { VoucherUsage, AuditLog } from "@/lib/types";

type Tab = "pending" | "report";

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<VoucherUsage[]>([]);
  const [report, setReport] = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<VoucherUsage | null>(null);
  const [form, setForm] = useState({ validation_status: "APPROVED", findings: "", evidence_notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPending = () => api.getPendingAudits().then(setPending).catch(console.error);
  const loadReport = () => api.getAuditReport().then(setReport).catch(console.error);

  useEffect(() => { loadPending(); }, []);
  useEffect(() => { if (tab === "report") loadReport(); }, [tab]);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.validateUsage(selected.usage_id, form);
      setSelected(null);
      setForm({ validation_status: "APPROVED", findings: "", evidence_notes: "" });
      loadPending();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al validar");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `USD $${Number(n).toFixed(2)}`;

  const kpis = {
    pending: pending.length,
    validated: report.filter(r => r.validation_status === "APPROVED").length,
    rejected: report.filter(r => r.validation_status === "REJECTED").length,
  };

  return (
    <AppShell roles={["admin", "auditor"]}>
      <h1 className="text-2xl font-bold mb-6">Módulo de Auditoría</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{kpis.pending}</div><div className="text-sm text-gray-500">Pendientes</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">{kpis.validated}</div><div className="text-sm text-gray-500">Aprobados</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-red-600">{kpis.rejected}</div><div className="text-sm text-gray-500">Rechazados</div></div>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("pending")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "pending" ? "bg-[#0066CC] text-white" : "bg-gray-100 text-gray-600"}`}>Pendientes de Validar</button>
        <button onClick={() => setTab("report")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "report" ? "bg-[#0066CC] text-white" : "bg-gray-100 text-gray-600"}`}>Reporte</button>
      </div>

      {tab === "pending" && (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th">Consecutivo</th>
                  <th className="table-th">Factura</th>
                  <th className="table-th">Monto Factura</th>
                  <th className="table-th">Precio Voucher</th>
                  <th className="table-th">Proveedor</th>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map(u => (
                  <tr key={u.usage_id} className="hover:bg-gray-50">
                    <td className="table-td font-bold text-[#FF0000]">{u.voucher?.consecutive_number}</td>
                    <td className="table-td">{u.invoice_number}</td>
                    <td className="table-td font-semibold">{fmt(u.invoice_amount)}</td>
                    <td className="table-td text-gray-500">{u.voucher ? fmt(u.voucher.unit_price) : "—"}</td>
                    <td className="table-td">{u.voucher?.provider?.name ?? "—"}</td>
                    <td className="table-td text-gray-500">{new Date(u.usage_date).toLocaleDateString("es-CR")}</td>
                    <td className="table-td">
                      <button onClick={() => setSelected(u)} className="text-xs btn-primary py-1 px-3">Validar</button>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Sin facturas pendientes ✓</td></tr>}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-lg font-bold mb-2">Validar Factura</h2>
                <div className="bg-gray-50 rounded-lg p-4 text-sm mb-5 space-y-1">
                  <div><span className="font-medium">Voucher:</span> <span className="text-[#FF0000] font-bold">{selected.voucher?.consecutive_number}</span></div>
                  <div><span className="font-medium">Factura:</span> {selected.invoice_number}</div>
                  <div><span className="font-medium">Monto facturado:</span> {fmt(selected.invoice_amount)}</div>
                  <div><span className="font-medium">Precio voucher:</span> {selected.voucher ? fmt(selected.voucher.unit_price) : "—"}</div>
                  <div><span className="font-medium">Proveedor:</span> {selected.voucher?.provider?.name}</div>
                </div>
                <form onSubmit={handleValidate} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Resultado</label>
                    <select value={form.validation_status} onChange={e => setForm(f => ({ ...f, validation_status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="APPROVED">APROBADO</option>
                      <option value="REJECTED">RECHAZADO</option>
                      <option value="NEEDS_CLARIFICATION">REQUIERE CLARIFICACIÓN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Hallazgos * (obligatorio)</label>
                    <textarea required value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe los hallazgos de la auditoría…" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Evidencia / Notas</label>
                    <input value={form.evidence_notes} onChange={e => setForm(f => ({ ...f, evidence_notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Referencias a documentos…" />
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Guardando…" : "Guardar Validación"}</button>
                    <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "report" && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Consecutivo</th>
                <th className="table-th">Auditor</th>
                <th className="table-th">Resultado</th>
                <th className="table-th">Hallazgos</th>
                <th className="table-th">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.map(r => (
                <tr key={r.audit_id}>
                  <td className="table-td font-bold text-[#FF0000]">{r.usage?.voucher?.consecutive_number ?? `#${r.voucher_usage_id}`}</td>
                  <td className="table-td">{r.auditor_name}</td>
                  <td className="table-td"><StatusBadge status={r.validation_status} /></td>
                  <td className="table-td text-gray-500 max-w-xs truncate">{r.findings}</td>
                  <td className="table-td">{new Date(r.audit_date).toLocaleDateString("es-CR")}</td>
                </tr>
              ))}
              {report.length === 0 && <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Sin registros de auditoría</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
