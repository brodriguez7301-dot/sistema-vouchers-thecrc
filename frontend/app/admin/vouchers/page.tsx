"use client";
import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Voucher, Provider, Service } from "@/lib/types";

const PROPERTIES = ["Corcovado Wilderness Lodge", "Ojochal Garden", "Amarena Canvas Beach Hotel", "Oxigen"];
const STATUSES = ["PENDING", "ISSUED", "INVOICED", "PAID", "CANCELLED"];

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    provider_id: "", service_id: "", room_number: "", guest_name: "",
    property_name: PROPERTIES[0], unit_price: "", quantity: "1", notes: "", service_date: "",
  });

  const load = () => {
    api.getVouchers(statusFilter ? { status: statusFilter } : undefined).then(setVouchers).catch(console.error);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    api.getProviders().then(setProviders).catch(console.error);
    api.getServices().then(setServices).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.provider_id) {
      setFilteredServices(services.filter(s => s.provider_id === Number(form.provider_id)));
    } else {
      setFilteredServices(services);
    }
  }, [form.provider_id, services]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const file = photoRef.current?.files?.[0];
    setSaving(true);
    setError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("photo", file);
    try {
      await api.createVoucher(fd);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear voucher");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePdf(v: Voucher) {
    setGeneratingPdf(v.voucher_id);
    try {
      await api.generatePdf(v.voucher_id);
      window.open(api.downloadPdfUrl(v.voucher_id), "_blank");
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error generando PDF");
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function updateStatus(v: Voucher, status: string) {
    await api.updateVoucherStatus(v.voucher_id, status);
    load();
  }

  const fmt = (n: number) => `USD $${Number(n).toFixed(2)}`;

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Vouchers</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Voucher</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Crear Voucher</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Paso 1 — Proveedor</label>
                <select required value={form.provider_id} onChange={e => setForm(f => ({ ...f, provider_id: e.target.value, service_id: "" }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar proveedor…</option>
                  {providers.map(p => <option key={p.provider_id} value={p.provider_id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Paso 2 — Servicio</label>
                <select required value={form.service_id} onChange={e => {
                  const svc = filteredServices.find(s => s.service_id === Number(e.target.value));
                  const price = svc ? (svc.guest_price ?? svc.base_price) : null;
                  setForm(f => ({ ...f, service_id: e.target.value, unit_price: price != null ? String(Number(price).toFixed(2)) : f.unit_price }));
                }} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar servicio…</option>
                  {filteredServices.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name} — {s.currency} ${s.base_price}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Paso 3 — Huésped</label>
                <div className="space-y-2">
                  <input required placeholder="Nombre completo del huésped" value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <input required placeholder="Número de habitación" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <select required value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {PROPERTIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Paso 4 — Fecha, Foto y Precio</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fecha del servicio *</label>
                    <input required type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Foto del huésped (opcional)</label>
                    <input ref={photoRef} type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700" />
                  </div>
                  <div className="flex gap-2">
                    <input required type="number" step="0.01" placeholder="Precio (USD)" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <input type="number" min="1" placeholder="Cant." value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-20 border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <textarea placeholder="Notas (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Creando…" : "Crear Voucher"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Consecutivo</th>
              <th className="table-th">Huésped</th>
              <th className="table-th">Habitación</th>
              <th className="table-th">Servicio</th>
              <th className="table-th">Precio</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vouchers.map(v => (
              <tr key={v.voucher_id} className="hover:bg-gray-50">
                <td className="table-td font-bold text-[#FF0000]">{v.consecutive_number}</td>
                <td className="table-td font-medium">{v.guest_name}</td>
                <td className="table-td">{v.room_number}</td>
                <td className="table-td text-gray-500">{v.service?.service_name ?? "—"}</td>
                <td className="table-td font-semibold text-green-700">{fmt(v.unit_price)}</td>
                <td className="table-td"><StatusBadge status={v.status} /></td>
                <td className="table-td">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleGeneratePdf(v)} disabled={generatingPdf === v.voucher_id} className="text-xs text-[#0066CC] hover:underline disabled:opacity-50">
                      {generatingPdf === v.voucher_id ? "Generando…" : "PDF"}
                    </button>
                    {v.status === "PENDING" && (
                      <button onClick={() => updateStatus(v, "ISSUED")} className="text-xs text-green-600 hover:underline">Emitir</button>
                    )}
                    {v.status === "PENDING" && (
                      <button onClick={() => updateStatus(v, "CANCELLED")} className="text-xs text-red-500 hover:underline">Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Sin vouchers</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AppShell>
  );
}
