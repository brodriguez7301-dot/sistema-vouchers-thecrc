"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Voucher, VoucherUsage } from "@/lib/types";

export default function FrontDeskPage() {
  const [searchNum, setSearchNum] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [form, setForm] = useState({ invoice_number: "", invoice_amount: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [todayUsages, setTodayUsages] = useState<VoucherUsage[]>([]);
  const [loadedToday, setLoadedToday] = useState(false);

  async function searchVoucher(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setSearchError("");
    setVoucher(null);
    setSaved(false);
    try {
      const v = await api.getVoucherByConsecutive(searchNum.trim().toUpperCase());
      setVoucher(v);
      setForm(f => ({ ...f, invoice_amount: String(v.unit_price) }));
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Voucher no encontrado");
    } finally {
      setSearching(false);
    }
  }

  async function registerUsage(e: React.FormEvent) {
    e.preventDefault();
    if (!voucher) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.registerUsage({
        voucher_id: voucher.voucher_id,
        invoice_number: form.invoice_number,
        invoice_amount: Number(form.invoice_amount),
        guest_name: voucher.guest_name,
        guest_room: voucher.room_number,
      });
      setSaved(true);
      setVoucher(null);
      setSearchNum("");
      loadToday();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSaving(false);
    }
  }

  async function loadToday() {
    const data = await api.getTodayUsages().catch(() => []);
    setTodayUsages(data);
    setLoadedToday(true);
  }

  const fmt = (n: number) => `USD $${Number(n).toFixed(2)}`;

  return (
    <AppShell roles={["admin", "front_desk"]}>
      <h1 className="text-2xl font-bold mb-6">Front Desk — Registrar Uso de Voucher</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Search */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Buscar Voucher</h2>
          <form onSubmit={searchVoucher} className="flex gap-2 mb-4">
            <input
              value={searchNum}
              onChange={e => setSearchNum(e.target.value)}
              placeholder="VCH-2026-001001"
              className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button type="submit" disabled={searching} className="btn-primary">{searching ? "…" : "Buscar"}</button>
          </form>
          {searchError && <p className="text-red-600 text-sm">{searchError}</p>}

          {voucher && (
            <div className="border rounded-xl p-4 space-y-2 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FF0000] text-lg">{voucher.consecutive_number}</span>
                <StatusBadge status={voucher.status} />
              </div>
              <div className="text-sm text-gray-700 grid grid-cols-2 gap-1">
                <span className="font-medium">Huésped:</span><span>{voucher.guest_name}</span>
                <span className="font-medium">Habitación:</span><span>{voucher.room_number}</span>
                <span className="font-medium">Servicio:</span><span>{voucher.service?.service_name}</span>
                <span className="font-medium">Proveedor:</span><span>{voucher.provider?.name}</span>
                <span className="font-medium">Precio:</span><span className="font-semibold text-green-700">{fmt(voucher.unit_price)}</span>
                <span className="font-medium">Propiedad:</span><span>{voucher.property_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Register usage */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Registrar Uso en Factura</h2>
          {saved && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm mb-4">✓ Uso registrado correctamente</div>}
          {!voucher ? (
            <p className="text-gray-400 text-sm">Busca un voucher primero para registrar su uso.</p>
          ) : voucher.status !== "ISSUED" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800 text-sm">
              Este voucher tiene estado <strong>{voucher.status}</strong> y no puede usarse (debe ser ISSUED).
            </div>
          ) : (
            <form onSubmit={registerUsage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Número de Factura</label>
                <input required placeholder="INV-2026-0001" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0066CC] uppercase mb-1 block">Monto Facturado (±5% permitido)</label>
                <input required type="number" step="0.01" value={form.invoice_amount} onChange={e => setForm(f => ({ ...f, invoice_amount: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm font-semibold" />
                <p className="text-xs text-gray-400 mt-1">Precio del voucher: {fmt(voucher.unit_price)}</p>
              </div>
              {saveError && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{saveError}</p>}
              <button type="submit" disabled={saving} className="w-full btn-primary">{saving ? "Registrando…" : "Registrar Uso"}</button>
            </form>
          )}
        </div>
      </div>

      {/* Today's usages */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Usos de Hoy</h2>
          <button onClick={loadToday} className="text-sm text-[#0066CC] hover:underline">Cargar</button>
        </div>
        {loadedToday ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Consecutivo</th>
                <th className="table-th">Factura</th>
                <th className="table-th">Monto</th>
                <th className="table-th">Huésped</th>
                <th className="table-th">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayUsages.map(u => (
                <tr key={u.usage_id}>
                  <td className="table-td font-bold text-[#FF0000]">{u.voucher?.consecutive_number}</td>
                  <td className="table-td">{u.invoice_number}</td>
                  <td className="table-td font-semibold text-green-700">{fmt(u.invoice_amount)}</td>
                  <td className="table-td">{u.guest_name}</td>
                  <td className="table-td"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
              {todayUsages.length === 0 && <tr><td colSpan={5} className="table-td text-center text-gray-400 py-6">Sin usos hoy</td></tr>}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">Haz clic en "Cargar" para ver los usos de hoy.</p>
        )}
      </div>
    </AppShell>
  );
}
