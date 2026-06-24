"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/^﻿/, "");

interface VoucherPublic {
  found: boolean;
  consecutive_number: string;
  guest_name: string;
  room_number: string;
  property_name: string;
  service_name: string;
  service_code: string;
  provider_name: string;
  service_date: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  scan_count: number;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Emitido",
  ISSUED:    "Emitido",
  INVOICED:  "Facturado",
  PAID:      "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-blue-100 text-blue-700",
  ISSUED:    "bg-green-100 text-green-700",
  INVOICED:  "bg-purple-100 text-purple-700",
  PAID:      "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PublicVoucherPage() {
  const { consecutive } = useParams<{ consecutive: string }>();
  const [data, setData]     = useState<VoucherPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consecutive) return;
    fetch(`${API}/api/public/voucher/${consecutive}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ found: false, consecutive_number: consecutive } as VoucherPublic))
      .finally(() => setLoading(false));
  }, [consecutive]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">

      {/* Header */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-[#002147] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-sm tracking-wide">THE COSTA RICA COLLECTION</div>
            <div className="text-blue-300 text-xs mt-0.5">Verificación de Voucher</div>
          </div>
          <div className="text-blue-200 text-xs text-right">
            <div>Sistema de Vouchers</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="w-full max-w-md bg-white rounded-b-2xl shadow-lg px-6 py-12 text-center text-gray-400">
          Verificando voucher…
        </div>
      )}

      {!loading && data && !data.found && (
        <div className="w-full max-w-md bg-white rounded-b-2xl shadow-lg px-6 py-12 text-center">
          <div className="text-5xl mb-4">❌</div>
          <div className="font-bold text-red-600 text-lg">Voucher no encontrado</div>
          <div className="text-gray-500 text-sm mt-2">{consecutive}</div>
          <p className="text-xs text-gray-400 mt-4">Este voucher no existe en el sistema o el código es inválido.</p>
        </div>
      )}

      {!loading && data?.found && (
        <div className="w-full max-w-md bg-white rounded-b-2xl shadow-lg overflow-hidden">

          {/* Número de voucher */}
          <div className="bg-red-50 border-b-2 border-red-500 px-6 py-4 text-center">
            <div className="font-mono font-bold text-red-600 text-2xl tracking-wider">
              {data.consecutive_number}
            </div>
          </div>

          {/* Estado */}
          <div className="flex justify-center py-3 border-b border-gray-100">
            {data.status === "CANCELLED" ? (
              <span className="px-4 py-1.5 rounded-full font-bold text-sm bg-red-100 text-red-700">
                ⛔ VOUCHER CANCELADO — No válido
              </span>
            ) : (
              <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${STATUS_COLOR[data.status] ?? "bg-gray-100 text-gray-600"}`}>
                ✓ VÁLIDO — {STATUS_LABEL[data.status] ?? data.status}
              </span>
            )}
          </div>

          {/* Datos del servicio */}
          <div className="px-6 py-4 space-y-3">
            <Row label="Servicio" value={`${data.service_code ? `[${data.service_code}] ` : ""}${data.service_name}`} />
            <Row label="Proveedor" value={data.provider_name} />
            <Row label="Huésped" value={data.guest_name} />
            <Row label="Habitación" value={data.room_number} />
            <Row label="Propiedad" value={data.property_name} />
            {data.service_date && <Row label="Fecha del servicio" value={data.service_date} />}
            <Row label="Cantidad de PAX" value={String(data.quantity)} />
            {data.notes && (
              <div className="pt-1">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</div>
                <div className="text-sm text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2">{data.notes}</div>
              </div>
            )}
          </div>

          {/* Scan count */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              Este voucher ha sido consultado <span className="font-bold text-gray-600">{data.scan_count}</span> {data.scan_count === 1 ? "vez" : "veces"}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-[#002147] px-6 py-3 text-center">
            <p className="text-xs text-blue-300">
              The Costa Rica Collection · Voucher electrónico verificado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-50">
      <span className="text-xs text-[#0066CC] font-bold uppercase tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-sm text-gray-800 text-right font-medium">{value}</span>
    </div>
  );
}
