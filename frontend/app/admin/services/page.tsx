"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";

const SERVICE_TYPES = ["TOUR", "TRANSPORT", "ACTIVITY", "OTHER"];
const CATEGORIES    = ["TOURS", "SPA", "TRANSFERS", "OTHERS"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    service_name: "", service_type: "TOUR", description: "",
    pricing_code: "", category: "TOURS", currency: "USD",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const load = () => api.getServices().then(setServices).catch(console.error);
  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createService({ ...form });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Servicios</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Servicio</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Nuevo Servicio</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="flex gap-2">
                <input placeholder="Código (ej. TE-0001)" value={form.pricing_code}
                  onChange={e => setForm(f => ({ ...f, pricing_code: e.target.value }))}
                  className="w-28 border rounded-lg px-3 py-2 text-sm font-mono" />
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <input required placeholder="Nombre del servicio / experiencia" value={form.service_name}
                onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.service_type}
                onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea placeholder="Descripción (opcional)" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <p className="text-xs text-gray-400">Los precios por canal se gestionan en <strong>Tarifas</strong>.</p>
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Código</th>
                <th className="table-th">Servicio / Experiencia</th>
                <th className="table-th">Categoría</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(s => (
                <tr key={s.service_id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs text-gray-500">{s.pricing_code ?? "—"}</td>
                  <td className="table-td font-medium">
                    {s.service_name}
                    {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
                  </td>
                  <td className="table-td">{s.category ?? "—"}</td>
                  <td className="table-td">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.service_type}</span>
                  </td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Sin servicios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
