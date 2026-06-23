"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Provider } from "@/lib/types";

const TYPES = ["TOUR", "TRANSPORT", "OTHER"];

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", provider_type: "TOUR", contact_email: "", contact_phone: "", bank_account: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.getProviders(false).then(setProviders).catch(console.error);
  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createProvider(form);
      setShowForm(false);
      setForm({ name: "", provider_type: "TOUR", contact_email: "", contact_phone: "", bank_account: "" });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Provider) {
    await api.updateProvider(p.provider_id, { is_active: !p.is_active });
    load();
  }

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Proveedor</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Nuevo Proveedor</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Nombre del proveedor" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.provider_type} onChange={e => setForm(f => ({ ...f, provider_type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Email de contacto" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Teléfono" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Cuenta bancaria" value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
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
              <th className="table-th">Nombre</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Email</th>
              <th className="table-th">Teléfono</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {providers.map(p => (
              <tr key={p.provider_id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{p.name}</td>
                <td className="table-td"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{p.provider_type}</span></td>
                <td className="table-td text-gray-500">{p.contact_email ?? "—"}</td>
                <td className="table-td text-gray-500">{p.contact_phone ?? "—"}</td>
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="table-td">
                  <button onClick={() => toggleActive(p)} className="text-xs text-[#0066CC] hover:underline">
                    {p.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">Sin proveedores registrados</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AppShell>
  );
}
