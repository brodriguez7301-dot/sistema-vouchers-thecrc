export type Role = "admin" | "front_desk" | "auditor";

export interface User {
  user_id: number;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
}

export interface Provider {
  provider_id: number;
  name: string;
  provider_type: "TOUR" | "TRANSPORT" | "OTHER";
  contact_email?: string;
  contact_phone?: string;
  bank_account?: string;
  is_active: boolean;
  created_date: string;
}

export interface Service {
  service_id: number;
  service_name: string;
  service_type: "TOUR" | "TRANSPORT" | "ACTIVITY" | "OTHER";
  description?: string;
  pricing_code?: string;
  category?: string;
  year: number;
  currency: string;
  is_active: boolean;
  created_date: string;
  base_price?: number | null;
  price_agency_shared?: number | null;
  price_agency_private?: number | null;
  price_direct_shared?: number | null;
  price_direct_private?: number | null;
  price_web?: number | null;
}

export const CHANNEL_LABELS: Record<string, string> = {
  AGENCY_SHARED:   "Agencia — Compartido",
  AGENCY_PRIVATE:  "Agencia — Privado",
  DIRECT_SHARED:   "Directo — Compartido",
  DIRECT_PRIVATE:  "Directo — Privado",
  WEB:             "Web",
};

export function getServiceChannels(s: Service): { key: string; label: string; price: number }[] {
  const map: [string, number | null | undefined][] = [
    ["AGENCY_SHARED",  s.price_agency_shared],
    ["AGENCY_PRIVATE", s.price_agency_private],
    ["DIRECT_SHARED",  s.price_direct_shared],
    ["DIRECT_PRIVATE", s.price_direct_private],
    ["WEB",            s.price_web],
  ];
  return map
    .filter(([, p]) => p != null && Number(p) > 0)
    .map(([key, p]) => ({ key, label: CHANNEL_LABELS[key], price: Number(p) }));
}

export type VoucherStatus = "PENDING" | "ISSUED" | "INVOICED" | "PAID" | "CANCELLED";
export type AuditStatus = "PENDIENTE" | "APROBADO" | "EN_DISPUTA";

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PENDIENTE:  "Pendiente",
  APROBADO:   "Aprobado",
  EN_DISPUTA: "En Disputa",
};

export const AUDIT_STATUS_COLORS: Record<AuditStatus, string> = {
  PENDIENTE:  "bg-gray-100 text-gray-600",
  APROBADO:   "bg-green-100 text-green-700",
  EN_DISPUTA: "bg-orange-100 text-orange-700",
};

export interface Voucher {
  voucher_id: number;
  consecutive_number: string;
  provider_id?: number | null;
  service_id: number;
  room_number: string;
  guest_name: string;
  guest_photo_url?: string;
  qr_code_data?: string;
  assigned_date: string;
  service_date?: string;
  assigned_by: string;
  status: VoucherStatus;
  property_name: string;
  sales_channel?: string;
  unit_price: number;
  guest_price?: number | null;
  quantity: number;
  total_amount: number;
  pdf_generated: boolean;
  pdf_url?: string;
  notes?: string;
  audit_status?: AuditStatus | null;
  invoice_number?: string | null;
  audit_notes?: string | null;
  audited_by?: string | null;
  audited_at?: string | null;
  provider_confirmed?: boolean;
  provider_confirmed_at?: string | null;
  created_date: string;
  provider?: Provider;
  service?: Service;
}

export type UsageStatus = "PENDING" | "VALIDATED" | "REJECTED" | "UNDER_REVIEW";

export interface VoucherUsage {
  usage_id: number;
  voucher_id: number;
  invoice_number: string;
  front_desk_user: string;
  usage_date: string;
  guest_name?: string;
  guest_room?: string;
  invoice_amount: number;
  status: UsageStatus;
  created_date: string;
  voucher?: Voucher;
}

export type ValidationStatus = "APPROVED" | "REJECTED" | "NEEDS_CLARIFICATION";

export interface AuditLog {
  audit_id: number;
  voucher_usage_id: number;
  auditor_name: string;
  validation_status: ValidationStatus;
  findings?: string;
  audit_date: string;
  evidence_notes?: string;
  usage?: VoucherUsage;
}

export interface DashboardSummary {
  total_vouchers: number;
  total_issued: number;
  total_invoiced: number;
  total_validated: number;
  total_amount_validated: number;
  total_providers: number;
}
