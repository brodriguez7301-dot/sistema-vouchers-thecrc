from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from models import ProviderType, ServiceType, VoucherStatus, UsageStatus, ValidationStatus


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "front_desk"


class UserOut(BaseModel):
    user_id: int
    email: str
    name: str
    role: str
    is_active: bool
    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Providers ─────────────────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str
    provider_type: ProviderType
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    bank_account: Optional[str] = None


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider_type: Optional[ProviderType] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    bank_account: Optional[str] = None
    is_active: Optional[bool] = None


class ProviderOut(BaseModel):
    provider_id: int
    name: str
    provider_type: ProviderType
    contact_email: Optional[str]
    contact_phone: Optional[str]
    bank_account: Optional[str]
    is_active: bool
    created_date: datetime
    model_config = {"from_attributes": True}


# ── Services ──────────────────────────────────────────────────────────────────

class ServiceCreate(BaseModel):
    service_name: str
    service_type: ServiceType
    description: Optional[str] = None
    pricing_code: Optional[str] = None
    category: Optional[str] = None
    year: int = 2026
    currency: str = "USD"
    base_price: Optional[Decimal] = None
    price_agency_shared: Optional[Decimal] = None
    price_agency_private: Optional[Decimal] = None
    price_direct_shared: Optional[Decimal] = None
    price_direct_private: Optional[Decimal] = None
    price_web: Optional[Decimal] = None


class ServiceUpdate(BaseModel):
    service_name: Optional[str] = None
    service_type: Optional[ServiceType] = None
    description: Optional[str] = None
    pricing_code: Optional[str] = None
    category: Optional[str] = None
    year: Optional[int] = None
    currency: Optional[str] = None
    base_price: Optional[Decimal] = None
    price_agency_shared: Optional[Decimal] = None
    price_agency_private: Optional[Decimal] = None
    price_direct_shared: Optional[Decimal] = None
    price_direct_private: Optional[Decimal] = None
    price_web: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ServiceOut(BaseModel):
    service_id: int
    service_name: str
    service_type: ServiceType
    description: Optional[str] = None
    pricing_code: Optional[str] = None
    category: Optional[str] = None
    year: int = 2026
    currency: str
    is_active: bool
    created_date: datetime
    base_price: Optional[Decimal] = None
    price_agency_shared: Optional[Decimal] = None
    price_agency_private: Optional[Decimal] = None
    price_direct_shared: Optional[Decimal] = None
    price_direct_private: Optional[Decimal] = None
    price_web: Optional[Decimal] = None
    model_config = {"from_attributes": True}


# ── Vouchers ──────────────────────────────────────────────────────────────────

class VoucherCreate(BaseModel):
    provider_id: Optional[int] = None
    service_id: int
    room_number: str
    guest_name: str
    property_name: str
    sales_channel: Optional[str] = None
    unit_price: Decimal          # costo del proveedor
    guest_price: Optional[Decimal] = None  # precio cobrado al huésped (del tarifario)
    quantity: int = 1
    notes: Optional[str] = None
    service_date: Optional[date] = None


class VoucherStatusUpdate(BaseModel):
    status: VoucherStatus


class VoucherOut(BaseModel):
    voucher_id: int
    consecutive_number: str
    provider_id: int
    service_id: int
    room_number: str
    guest_name: str
    guest_photo_url: Optional[str] = None
    qr_code_data: Optional[str] = None
    assigned_date: datetime
    service_date: Optional[date] = None
    assigned_by: str
    status: VoucherStatus
    property_name: str
    sales_channel: Optional[str] = None
    unit_price: Decimal
    guest_price: Optional[Decimal] = None
    quantity: int
    total_amount: Decimal
    pdf_generated: bool
    pdf_url: Optional[str]
    notes: Optional[str]
    created_date: datetime
    provider: Optional[ProviderOut] = None
    service: Optional[ServiceOut] = None
    model_config = {"from_attributes": True}


# ── Voucher Usage ─────────────────────────────────────────────────────────────

class VoucherUsageCreate(BaseModel):
    voucher_id: int
    invoice_number: str
    invoice_amount: Decimal
    guest_name: Optional[str] = None
    guest_room: Optional[str] = None


class VoucherUsageOut(BaseModel):
    usage_id: int
    voucher_id: int
    invoice_number: str
    front_desk_user: str
    usage_date: datetime
    guest_name: Optional[str]
    guest_room: Optional[str]
    invoice_amount: Decimal
    status: UsageStatus
    created_date: datetime
    voucher: Optional[VoucherOut] = None
    model_config = {"from_attributes": True}


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditValidate(BaseModel):
    validation_status: ValidationStatus
    findings: str
    evidence_notes: Optional[str] = None


class AuditLogOut(BaseModel):
    audit_id: int
    voucher_usage_id: int
    auditor_name: str
    validation_status: ValidationStatus
    findings: Optional[str]
    audit_date: datetime
    evidence_notes: Optional[str]
    usage: Optional[VoucherUsageOut] = None
    model_config = {"from_attributes": True}


# ── Pricing History ───────────────────────────────────────────────────────────

class PricingHistoryOut(BaseModel):
    price_history_id: int
    service_id: int
    old_price: Optional[Decimal]
    new_price: Decimal
    effective_date: date
    changed_by: str
    change_reason: Optional[str]
    created_date: datetime
    model_config = {"from_attributes": True}


# ── Reports ───────────────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    total_vouchers: int
    total_issued: int
    total_invoiced: int
    total_validated: int
    total_amount_validated: Decimal
    total_providers: int
