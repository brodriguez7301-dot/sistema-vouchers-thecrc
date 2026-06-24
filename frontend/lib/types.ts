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
  provider_id: number;
  service_name: string;
  service_type: "TOUR" | "TRANSPORT" | "ACTIVITY" | "OTHER";
  description?: string;
  base_price: number;
  guest_price?: number | null;
  currency: string;
  is_active: boolean;
  created_date: string;
  provider?: Provider;
}

export type VoucherStatus = "PENDING" | "ISSUED" | "INVOICED" | "PAID" | "CANCELLED";

export interface Voucher {
  voucher_id: number;
  consecutive_number: string;
  provider_id: number;
  service_id: number;
  room_number: string;
  guest_name: string;
  guest_photo_url: string;
  qr_code_data?: string;
  assigned_date: string;
  service_date?: string;
  assigned_by: string;
  status: VoucherStatus;
  property_name: string;
  unit_price: number;
  quantity: number;
  total_amount: number;
  pdf_generated: boolean;
  pdf_url?: string;
  notes?: string;
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
