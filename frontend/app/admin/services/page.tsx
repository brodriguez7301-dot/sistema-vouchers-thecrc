"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Service, Provider } from "@/lib/types";

const SERVICE_TYPES = ["TOUR", "TRANSPORT", "ACTIVITY", "OTHER"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ provider_id: 0, service_name: "", service_type: "TOUR", description: "", base_price: "", currency: "USD" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api.getServices().then(setServices).catch(console.error);
    api.getProviders().then(setProviders).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createService({ ...form, provider_id: Number(form.provider_id), base_price: Number(form.base_price) });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number | string, cur: string) => `${cur} $${Number(n).toFixed(2)}`;

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Servicio</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Nuevo Servicio</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <select required value={form.provider_id} onChange={e => setForm(f => ({ ...f, provider_id: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Seleccionar proveedor…</option>
                {providers.map(p => <option key={p.provider_id} value={p.provider_id}>{p.name}</option>)}
              </select>
              <input required placeholder="Nombre del servicio" value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea placeholder="Descripción (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <div className="flex gap-2">
                <input required type="number" step="0.01" placeholder="Precio base" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
                  <option>USD</option><option>CRC</option>
                </select>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Guardando…" : "Guardar"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Servicio</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Proveedor</th>
              <th className="table-th">Precio</th>
              <th className="table-th">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map(s => (
              <tr key={s.service_id} className="hover:bg-gray-50">
                <td className="table-td font-medium">
                  {s.service_name}
                  {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
                </td>
                <td className="table-td"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.service_type}</span></td>
                <td className="table-td">{s.provider?.name ?? `#${s.provider_id}`}</td>
                <td className="table-td font-semibold text-green-700">{fmt(s.base_price, s.currency)}</td>
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Sin servicios registrados</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AppShell>
  );
}
