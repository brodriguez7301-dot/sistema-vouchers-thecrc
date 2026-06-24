"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";

const CHANNELS = [
  { key: "price_agency_shared",  label: "Agencia Compartido",  color: "text-purple-700" },
  { key: "price_agency_private", label: "Agencia Privado",     color: "text-purple-700" },
  { key: "price_direct_shared",  label: "Directo Compartido",  color: "text-blue-700"   },
  { key: "price_direct_private", label: "Directo Privado",     color: "text-blue-700"   },
  { key: "price_web",            label: "Web",                  color: "text-green-700"  },
] as const;

type ChannelKey = typeof CHANNELS[number]["key"];

type Row = Service & Record<ChannelKey, number | null>;

export default function PreciosPage() {
  const [year, setYear]       = useState(2026);
  const [rows, setRows]       = useState<Row[]>([]);
  const [edits, setEdits]     = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved,  setSaved]    = useState<string | null>(null);
  const [catFilter, setCat]   = useState("ALL");

  const load = () => {
    api.getServices().then(svcs => {
      const filtered = svcs.filter((s: Service) => s.year === year) as Row[];
      setRows(filtered);
      const init: Record<string, string> = {};
      filtered.forEach(s => {
        CHANNELS.forEach(ch => {
          const v = (s as Record<string, unknown>)[ch.key];
          init[`${s.service_id}_${ch.key}`] = v != null ? String(Number(v).toFixed(2)) : "";
        });
      });
      setEdits(init);
    });
  };

  useEffect(() => { load(); }, [year]);

  const categories = ["ALL", ...Array.from(new Set(rows.map(r => r.category ?? "SIN CATEGORÍA")))];
  const visible = catFilter === "ALL" ? rows : rows.filter(r => (r.category ?? "SIN CATEGORÍA") === catFilter);

  async function save(serviceId: number, ch: ChannelKey) {
    const k = `${serviceId}_${ch}`;
    setSaving(k);
    const val = edits[k];
    const num = val === "" ? null : Number(val);
    await api.updateService(serviceId, { [ch]: num });
    setSaved(k);
    setTimeout(() => setSaved(null), 1800);
    setSaving(null);
  }

  const fmt = (k: string) => {
    const v = edits[k];
    return v ? `$${Number(v).toFixed(0)}` : "—";
  };

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold">Tarifario Aprobado</h1>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500">Año:</label>
          {[2026, 2027].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${year === y ? "bg-[#0066CC] text-white border-[#0066CC]" : "bg-white text-gray-600 border-gray-300 hover:border-[#0066CC]"}`}>
              {y}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <select value={catFilter} onChange={e => setCat(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            {categories.map(c => <option key={c} value={c}>{c === "ALL" ? "Todas las categorías" : c}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#002147] text-white">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Experiencia / Servicio</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Cat.</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide bg-purple-900/50" colSpan={2}>
                  Agencia (10% comisión)
                </th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide bg-blue-900/50" colSpan={2}>
                  Directos
                </th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide bg-green-900/50">
                  Web
                </th>
              </tr>
              <tr className="bg-gray-100 border-b text-xs text-gray-500">
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
                <th className="px-4 py-2 text-center bg-purple-50">Compartido Rack</th>
                <th className="px-4 py-2 text-center bg-purple-50">Privado Rack</th>
                <th className="px-4 py-2 text-center bg-blue-50">Compartido Net</th>
                <th className="px-4 py-2 text-center bg-blue-50">Privado Rack</th>
                <th className="px-4 py-2 text-center bg-green-50">Regular Rack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-10">
                  {year === 2027 ? "Sin tarifas 2027 — las puede ingresar aquí" : "Sin servicios"}
                </td></tr>
              )}
              {visible.map(s => (
                <tr key={s.service_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {s.pricing_code ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium max-w-xs">{s.service_name}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s.category ?? "—"}</span>
                  </td>
                  {CHANNELS.map(ch => {
                    const k = `${s.service_id}_${ch.key}`;
                    const isSaving = saving === k;
                    const isSaved  = saved  === k;
                    return (
                      <td key={ch.key} className={`px-3 py-2 ${ch.key.startsWith("price_agency") ? "bg-purple-50/40" : ch.key.startsWith("price_direct") ? "bg-blue-50/40" : "bg-green-50/40"}`}>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-300 text-xs">$</span>
                          <input
                            type="number" step="0.01" min="0"
                            value={edits[k] ?? ""}
                            placeholder="—"
                            onChange={e => setEdits(p => ({ ...p, [k]: e.target.value }))}
                            onBlur={() => save(s.service_id, ch.key)}
                            onKeyDown={e => e.key === "Enter" && save(s.service_id, ch.key)}
                            className={`w-20 border rounded px-1.5 py-1 text-xs font-semibold ${ch.color} focus:ring-1 focus:ring-blue-400 focus:outline-none ${isSaved ? "border-green-400 bg-green-50" : "border-gray-200"}`}
                          />
                          {isSaving && <span className="text-gray-400 text-xs">…</span>}
                          {isSaved  && <span className="text-green-500 text-xs">✓</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Edite cualquier precio y presione Enter o salga del campo para guardar automáticamente.
        Para agregar tarifas 2027 seleccione el año 2027 — los servicios aparecerán con campos en blanco listos para llenar.
      </p>
    </AppShell>
  );
}
