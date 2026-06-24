"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";

export default function PreciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providerCosts, setProviderCosts] = useState<Record<number, string>>({});
  const [guestPrices, setGuestPrices] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const load = () => {
    api.getServices().then(svcs => {
      setServices(svcs);
      const costs: Record<number, string> = {};
      const prices: Record<number, string> = {};
      svcs.forEach(s => {
        costs[s.service_id] = s.base_price != null ? String(Number(s.base_price).toFixed(2)) : "";
        prices[s.service_id] = s.guest_price != null ? String(Number(s.guest_price).toFixed(2)) : "";
      });
      setProviderCosts(costs);
      setGuestPrices(prices);
    }).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  async function saveProviderCost(s: Service) {
    setSaving(s.service_id);
    try {
      await api.updateService(s.service_id, { base_price: Number(providerCosts[s.service_id]) });
      setSaved(s.service_id);
      setTimeout(() => setSaved(null), 2000);
      load();
    } finally {
      setSaving(null);
    }
  }

  async function saveGuestPrice(s: Service) {
    setSaving(-s.service_id);
    try {
      await api.updateService(s.service_id, { guest_price: Number(guestPrices[s.service_id]) });
      setSaved(-s.service_id);
      setTimeout(() => setSaved(null), 2000);
      load();
    } finally {
      setSaving(null);
    }
  }

  const margin = (id: number) => {
    const cost = Number(providerCosts[id]);
    const price = Number(guestPrices[id]);
    if (!cost || !price || price === 0) return null;
    return Math.round(((price - cost) / price) * 100);
  };

  return (
    <AppShell roles={["admin"]}>
      <h1 className="text-2xl font-bold mb-6">Gestión de Tarifas</h1>

      {/* Tabla 1 — Costos a Proveedores */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-6 bg-orange-500 rounded-full inline-block" />
          <h2 className="text-base font-semibold text-gray-700">Costos a Proveedores</h2>
          <span className="text-xs text-gray-400 ml-1">— lo que paga el hotel al proveedor</span>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th">Servicio</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Proveedor</th>
                  <th className="table-th">Costo (USD)</th>
                  <th className="table-th w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map(s => (
                  <tr key={s.service_id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{s.service_name}</td>
                    <td className="table-td">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.service_type}</span>
                    </td>
                    <td className="table-td text-gray-500">{s.provider?.name ?? "—"}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number" step="0.01" min="0"
                          value={providerCosts[s.service_id] ?? ""}
                          onChange={e => setProviderCosts(p => ({ ...p, [s.service_id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && saveProviderCost(s)}
                          className="w-28 border rounded px-2 py-1 text-sm text-orange-700 font-semibold focus:ring-1 focus:ring-orange-400 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => saveProviderCost(s)}
                        disabled={saving === s.service_id}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors w-full ${
                          saved === s.service_id
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        } disabled:opacity-50`}
                      >
                        {saving === s.service_id ? "…" : saved === s.service_id ? "✓ Guardado" : "Guardar"}
                      </button>
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
      </div>

      {/* Tabla 2 — Precios al Huésped */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-6 bg-[#0066CC] rounded-full inline-block" />
          <h2 className="text-base font-semibold text-gray-700">Precios al Huésped</h2>
          <span className="text-xs text-gray-400 ml-1">— lo que se cobra en el voucher</span>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th">Servicio</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Proveedor</th>
                  <th className="table-th">Precio (USD)</th>
                  <th className="table-th">Margen</th>
                  <th className="table-th w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map(s => {
                  const m = margin(s.service_id);
                  return (
                    <tr key={s.service_id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{s.service_name}</td>
                      <td className="table-td">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.service_type}</span>
                      </td>
                      <td className="table-td text-gray-500">{s.provider?.name ?? "—"}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">$</span>
                          <input
                            type="number" step="0.01" min="0"
                            value={guestPrices[s.service_id] ?? ""}
                            onChange={e => setGuestPrices(p => ({ ...p, [s.service_id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && saveGuestPrice(s)}
                            className="w-28 border rounded px-2 py-1 text-sm text-[#0066CC] font-semibold focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="table-td">
                        {m !== null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m >= 20 ? "bg-green-100 text-green-700" :
                            m >= 0  ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-600"
                          }`}>
                            {m}%
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="table-td">
                        <button
                          onClick={() => saveGuestPrice(s)}
                          disabled={saving === -s.service_id}
                          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors w-full ${
                            saved === -s.service_id
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          } disabled:opacity-50`}
                        >
                          {saving === -s.service_id ? "…" : saved === -s.service_id ? "✓ Guardado" : "Guardar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {services.length === 0 && (
                  <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">Sin servicios registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
