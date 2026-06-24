"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Voucher, Provider, Service } from "@/lib/types";
import { getServiceChannels, CHANNEL_LABELS } from "@/lib/types";

const PROPERTIES = ["Corcovado Wilderness Lodge", "Ojochal Garden", "Amarena Canvas Beach Hotel", "Oxigen"];
const STATUSES   = ["PENDING", "ISSUED", "INVOICED", "PAID", "CANCELLED"];

const EMPTY_FORM = {
  service_id: "", sales_channel: "", guest_price: "", unit_price: "",
  provider_id: "", room_number: "", guest_name: "",
  property_name: PROPERTIES[0], quantity: "1", notes: "", service_date: "",
};

export default function VouchersPage() {
  const [vouchers, setVouchers]     = useState<Voucher[]>([]);
  const [detail, setDetail]         = useState<Voucher | null>(null);
  const [providers, setProviders]   = useState<Provider[]>([]);
  const [services, setServices]     = useState<Service[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);
  const [statusFilter, setStatusFilter]   = useState("");
  const [search, setSearch]         = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = () =>
    api.getVouchers(statusFilter ? { status: statusFilter } : undefined).then(setVouchers).catch(console.error);

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    api.getProviders(false).then(setProviders).catch(console.error);
    api.getServices().then(setServices).catch(console.error);
  }, []);

  const selectedService = services.find(s => s.service_id === Number(form.service_id));
  const channels = selectedService ? getServiceChannels(selectedService) : [];

  function pickService(id: string) {
    const svc = services.find(s => s.service_id === Number(id));
    const chans = svc ? getServiceChannels(svc) : [];
    const firstChan = chans[0];
    setForm(f => ({
      ...f,
      service_id: id,
      sales_channel: firstChan?.key ?? "",
      guest_price: firstChan ? String(firstChan.price.toFixed(2)) : "",
    }));
  }

  function pickChannel(key: string) {
    const ch = channels.find(c => c.key === key);
    setForm(f => ({ ...f, sales_channel: key, guest_price: ch ? String(ch.price.toFixed(2)) : f.guest_price }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    try {
      await api.createVoucher(fd);
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear voucher");
    } finally { setSaving(false); }
  }

  async function handleGeneratePdf(v: Voucher) {
    setGeneratingPdf(v.voucher_id);
    try {
      await api.generatePdf(v.voucher_id);
      window.open(api.downloadPdfUrl(v.voucher_id), "_blank");
      // Al descargar el PDF queda marcado como emitido automáticamente
      if (v.status === "PENDING") {
        await api.updateVoucherStatus(v.voucher_id, "ISSUED");
      }
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error generando PDF");
    } finally { setGeneratingPdf(null); }
  }

  const fmt = (n: number) => `$${Number(n).toFixed(2)}`;

  // Search filter
  const filteredSvcs = search.length > 1
    ? services.filter(s =>
        s.service_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.pricing_code ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : services;

  return (
    <AppShell roles={["admin"]}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Vouchers</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
            + Nuevo Voucher
          </button>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Crear Voucher</h2>
            <form onSubmit={handleSave} className="space-y-5">

              {/* PASO 1 — Servicio */}
              <div>
                <label className="step-label">Paso 1 — Servicio</label>
                <input
                  placeholder="Buscar por nombre o código…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-1"
                />
                <select required value={form.service_id}
                  onChange={e => { pickService(e.target.value); setSearch(""); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar servicio…</option>
                  {filteredSvcs.map(s => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.pricing_code ? `[${s.pricing_code}] ` : ""}{s.service_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PASO 2 — Canal de venta → precio al huésped */}
              {selectedService && (
                <div>
                  <label className="step-label">Paso 2 — Canal de Venta</label>
                  <p className="text-xs text-gray-400 mb-2">Seleccione cómo se vendió el servicio al huésped. El precio se toma del tarifario aprobado.</p>
                  {channels.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                      Este servicio no tiene precios en el tarifario. Ingrese el precio al huésped manualmente.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {channels.map(ch => (
                        <label key={ch.key}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${form.sales_channel === ch.key ? "border-[#0066CC] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="channel" value={ch.key}
                              checked={form.sales_channel === ch.key}
                              onChange={() => pickChannel(ch.key)}
                              className="accent-[#0066CC]" />
                            <span className="text-sm">{ch.label}</span>
                          </div>
                          <span className="font-bold text-[#0066CC] text-sm">${ch.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 font-semibold">Precio al Huésped (USD) — del tarifario</label>
                    <input type="number" step="0.01" min="0"
                      value={form.guest_price}
                      onChange={e => setForm(f => ({ ...f, guest_price: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-semibold text-[#0066CC]" />
                  </div>
                </div>
              )}

              {/* PASO 3 — Proveedor + costo */}
              <div>
                <label className="step-label">Paso 3 — Proveedor y Costo</label>
                <p className="text-xs text-gray-400 mb-2">¿Quién ejecuta el servicio? Ingrese lo que el proveedor nos cobra.</p>
                <select value={form.provider_id}
                  onChange={e => setForm(f => ({ ...f, provider_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                  <option value="">Sin proveedor externo / servicio propio CWL</option>
                  {providers.map(p => <option key={p.provider_id} value={p.provider_id}>{p.name}</option>)}
                </select>
                <label className="text-xs text-gray-500 font-semibold">Costo del Proveedor (USD) *</label>
                <input required type="number" step="0.01" min="0"
                  value={form.unit_price}
                  onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 mt-1 focus:border-[#0066CC]" />
                <p className="text-xs text-gray-400 mt-1">Editable — si hay acuerdo o descuento con el proveedor, ingrese el monto real cobrado.</p>
              </div>

              {/* PASO 4 — Huésped */}
              <div>
                <label className="step-label">Paso 4 — Huésped</label>
                <div className="space-y-2">
                  <input required placeholder="Nombre completo del huésped"
                    value={form.guest_name}
                    onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <input required placeholder="Número de habitación"
                    value={form.room_number}
                    onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <select required value={form.property_name}
                    onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    {PROPERTIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* PASO 5 — Fecha y PAX */}
              <div>
                <label className="step-label">Paso 5 — Fecha y PAX</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Fecha del servicio *</label>
                    <input required type="date" value={form.service_date}
                      onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Cantidad de PAX *</label>
                    <input required type="number" min="1"
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-semibold" />
                  </div>
                  <textarea placeholder="Notas (opcional)" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || !form.service_id} className="btn-primary flex-1">
                  {saving ? "Creando…" : "Crear Voucher"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Consecutivo</th>
                <th className="table-th">Huésped</th>
                <th className="table-th">Hab.</th>
                <th className="table-th">Servicio</th>
                <th className="table-th">Canal</th>
                <th className="table-th text-[#0066CC]">P. Huésped</th>
                <th className="table-th text-gray-600">Costo Prov.</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Proveedor</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.map(v => (
                <tr key={v.voucher_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(v)}>
                  <td className="table-td font-bold text-[#FF0000] font-mono text-xs underline decoration-dotted">{v.consecutive_number}</td>
                  <td className="table-td font-medium">{v.guest_name}</td>
                  <td className="table-td">{v.room_number}</td>
                  <td className="table-td text-gray-500 max-w-[180px] truncate">
                    {v.service?.pricing_code
                      ? <span className="font-mono text-xs mr-1 text-gray-400">[{v.service.pricing_code}]</span>
                      : null}
                    {v.service?.service_name ?? "—"}
                  </td>
                  <td className="table-td">
                    {v.sales_channel
                      ? <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{CHANNEL_LABELS[v.sales_channel] ?? v.sales_channel}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="table-td font-semibold text-[#0066CC]">
                    {v.guest_price != null ? fmt(v.guest_price) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="table-td font-semibold text-gray-700">{fmt(v.unit_price)}</td>
                  <td className="table-td"><StatusBadge status={v.status} /></td>
                  <td className="table-td">
                    {v.provider_confirmed ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                          ✓ Confirmado
                        </span>
                        {v.provider_confirmed_at && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(v.provider_confirmed_at).toLocaleString("es-CR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">Sin confirmar</span>
                    )}
                  </td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => handleGeneratePdf(v)} disabled={generatingPdf === v.voucher_id}
                        className="text-xs text-[#0066CC] hover:underline disabled:opacity-50">
                        {generatingPdf === v.voucher_id ? "…" : "PDF"}
                      </button>
                      {v.status === "PENDING" && (
                        <button onClick={() => api.updateVoucherStatus(v.voucher_id, "CANCELLED").then(load)}
                          className="text-xs text-red-500 hover:underline">Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">Sin vouchers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Modal detalle de voucher ──────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-[#002147] px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-300 uppercase tracking-wide">The Costa Rica Collection</div>
                <div className="font-mono font-bold text-red-400 text-xl mt-0.5">{detail.consecutive_number}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-blue-300 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Confirmation status — PROMINENTE */}
            {detail.provider_confirmed ? (
              <div className="bg-green-600 px-6 py-4 flex items-center gap-4">
                <div className="text-white text-3xl font-bold">✓</div>
                <div>
                  <div className="text-white font-bold text-base">Recepción confirmada por el proveedor</div>
                  {detail.provider_confirmed_at && (
                    <div className="text-green-100 text-sm mt-0.5">
                      {new Date(detail.provider_confirmed_at).toLocaleString("es-CR", {
                        weekday: "long", day: "2-digit", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-b-2 border-amber-400 px-6 py-3 flex items-center gap-3">
                <div className="text-amber-500 text-2xl">⏳</div>
                <div className="text-amber-700 font-semibold text-sm">Pendiente de confirmación del proveedor</div>
              </div>
            )}

            {/* Datos del voucher */}
            <div className="px-6 py-4 space-y-2 text-sm">
              <Row2 label="Servicio"      value={`${detail.service?.pricing_code ? `[${detail.service.pricing_code}] ` : ""}${detail.service?.service_name ?? "—"}`} />
              <Row2 label="Proveedor"     value={detail.provider?.name ?? "Servicio propio CWL"} />
              <Row2 label="Huésped"       value={detail.guest_name} />
              <Row2 label="Habitación"    value={detail.room_number} />
              <Row2 label="Propiedad"     value={detail.property_name} />
              {detail.service_date && <Row2 label="Fecha servicio" value={detail.service_date} />}
              <Row2 label="PAX"           value={String(detail.quantity)} />
              {detail.sales_channel && <Row2 label="Canal"         value={CHANNEL_LABELS[detail.sales_channel] ?? detail.sales_channel} />}
              <div className="border-t pt-2 mt-2 flex justify-between">
                <div>
                  <div className="text-xs text-gray-400">Precio huésped</div>
                  <div className="font-bold text-[#0066CC] text-base">{detail.guest_price != null ? `$${Number(detail.guest_price).toFixed(2)}` : "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Costo proveedor</div>
                  <div className="font-bold text-gray-700 text-base">${Number(detail.unit_price).toFixed(2)}</div>
                </div>
                {detail.guest_price != null && (
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Margen</div>
                    <div className={`font-bold text-base ${Number(detail.guest_price) >= Number(detail.unit_price) ? "text-green-600" : "text-red-600"}`}>
                      ${(Number(detail.guest_price) - Number(detail.unit_price)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              {detail.invoice_number && <Row2 label="Factura"      value={detail.invoice_number} />}
              {detail.audit_status   && <Row2 label="Auditoría"    value={detail.audit_status} />}
              {detail.notes          && <Row2 label="Notas"        value={detail.notes} />}
            </div>

            {/* Acciones */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => { handleGeneratePdf(detail); }}
                disabled={generatingPdf === detail.voucher_id}
                className="flex-1 bg-[#002147] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {generatingPdf === detail.voucher_id ? "Generando…" : "Descargar PDF"}
              </button>
              <button onClick={() => setDetail(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Row2({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 border-b border-gray-50">
      <span className="text-xs text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}
