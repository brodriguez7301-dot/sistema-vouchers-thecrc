const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/^﻿/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("voucher_token");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: import("./types").User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<import("./types").User>("/api/auth/me"),

  // Providers
  getProviders: (activeOnly = true) => request<import("./types").Provider[]>(`/api/providers/?active_only=${activeOnly}`),
  createProvider: (data: unknown) => request("/api/providers/", { method: "POST", body: JSON.stringify(data) }),
  updateProvider: (id: number, data: unknown) => request(`/api/providers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProvider: (id: number) => request(`/api/providers/${id}`, { method: "DELETE" }),

  // Services
  getServices: (providerId?: number) => request<import("./types").Service[]>(`/api/services/${providerId ? `?provider_id=${providerId}` : ""}`),
  createService: (data: unknown) => request("/api/services/", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: unknown) => request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Vouchers
  getVouchers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").Voucher[]>(`/api/vouchers/${qs}`);
  },
  getVoucher: (id: number) => request<import("./types").Voucher>(`/api/vouchers/${id}`),
  getVoucherByConsecutive: (consecutive: string) => request<import("./types").Voucher>(`/api/vouchers/by-consecutive/${consecutive}`),
  createVoucher: (formData: FormData) =>
    request<import("./types").Voucher>("/api/vouchers/", { method: "POST", body: formData }),
  updateVoucherStatus: (id: number, status: string) =>
    request(`/api/vouchers/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  auditVoucher: (id: number, data: { audit_status: string; invoice_number?: string; audit_notes?: string }) =>
    request<import("./types").Voucher>(`/api/vouchers/${id}/audit`, { method: "PUT", body: JSON.stringify(data) }),
  generatePdf: (id: number) => request(`/api/vouchers/${id}/generate-pdf`, { method: "POST" }),
  downloadPdfUrl: (id: number) => `${API}/api/vouchers/${id}/pdf?token=${getToken()}`,

  // Voucher Usage
  getUsages: () => request<import("./types").VoucherUsage[]>("/api/voucher-usage/"),
  getTodayUsages: () => request<import("./types").VoucherUsage[]>("/api/voucher-usage/today"),
  registerUsage: (data: unknown) => request("/api/voucher-usage/", { method: "POST", body: JSON.stringify(data) }),

  // Audit
  getPendingAudits: () => request<import("./types").VoucherUsage[]>("/api/audit/pending"),
  validateUsage: (usageId: number, data: unknown) =>
    request(`/api/audit/${usageId}/validate`, { method: "POST", body: JSON.stringify(data) }),
  getAuditReport: () => request<import("./types").AuditLog[]>("/api/audit/report"),

  // Reports
  getDashboard: () => request<import("./types").DashboardSummary>("/api/reports/dashboard"),
  getIngresosValidados: () => request("/api/reports/ingresos-validados"),
  getPorProveedor: () => request("/api/reports/por-proveedor"),
  getPorPropiedad: () => request("/api/reports/por-propiedad"),
  getAnomalias: () => request("/api/reports/anomalias"),
  getTrazabilidad: (id: number) => request(`/api/reports/trazabilidad/${id}`),
};
