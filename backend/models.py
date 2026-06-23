from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    Numeric, ForeignKey, Enum as SAEnum, Date, func
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class ProviderType(str, enum.Enum):
    TOUR = "TOUR"
    TRANSPORT = "TRANSPORT"
    OTHER = "OTHER"


class ServiceType(str, enum.Enum):
    TOUR = "TOUR"
    TRANSPORT = "TRANSPORT"
    ACTIVITY = "ACTIVITY"
    OTHER = "OTHER"


class VoucherStatus(str, enum.Enum):
    PENDING = "PENDING"
    ISSUED = "ISSUED"
    INVOICED = "INVOICED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class UsageStatus(str, enum.Enum):
    PENDING = "PENDING"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    UNDER_REVIEW = "UNDER_REVIEW"


class ValidationStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="front_desk")  # admin, front_desk, auditor
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, server_default=func.now())


class Provider(Base):
    __tablename__ = "providers"

    provider_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    provider_type = Column(SAEnum(ProviderType), nullable=False)
    contact_email = Column(String(100), unique=True)
    contact_phone = Column(String(20))
    bank_account = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, server_default=func.now())
    updated_date = Column(DateTime, onupdate=func.now())

    services = relationship("Service", back_populates="provider")
    vouchers = relationship("Voucher", back_populates="provider")


class Service(Base):
    __tablename__ = "services"

    service_id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.provider_id"), nullable=False)
    service_name = Column(String(150), nullable=False)
    service_type = Column(SAEnum(ServiceType), nullable=False)
    description = Column(Text)
    base_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, server_default=func.now())

    provider = relationship("Provider", back_populates="services")
    vouchers = relationship("Voucher", back_populates="service")
    pricing_history = relationship("PricingHistory", back_populates="service")


class Voucher(Base):
    __tablename__ = "vouchers"

    voucher_id = Column(Integer, primary_key=True, index=True)
    consecutive_number = Column(String(20), unique=True, nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("providers.provider_id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.service_id"), nullable=False)
    room_number = Column(String(10), nullable=False)
    guest_name = Column(String(150), nullable=False)
    guest_photo_url = Column(String(255), nullable=False)
    qr_code_data = Column(String(500))
    assigned_date = Column(DateTime, server_default=func.now())
    assigned_by = Column(String(100), nullable=False)
    status = Column(SAEnum(VoucherStatus), default=VoucherStatus.PENDING, nullable=False)
    property_name = Column(String(100), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1)
    total_amount = Column(Numeric(10, 2), nullable=False)
    pdf_generated = Column(Boolean, default=False)
    pdf_url = Column(String(255))
    notes = Column(Text)
    created_date = Column(DateTime, server_default=func.now())
    updated_date = Column(DateTime, onupdate=func.now())

    provider = relationship("Provider", back_populates="vouchers")
    service = relationship("Service", back_populates="vouchers")
    usages = relationship("VoucherUsage", back_populates="voucher")


class VoucherUsage(Base):
    __tablename__ = "voucher_usage"

    usage_id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.voucher_id"), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    front_desk_user = Column(String(100), nullable=False)
    usage_date = Column(DateTime, server_default=func.now())
    guest_name = Column(String(150))
    guest_room = Column(String(10))
    invoice_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(SAEnum(UsageStatus), default=UsageStatus.PENDING, nullable=False)
    created_date = Column(DateTime, server_default=func.now())

    voucher = relationship("Voucher", back_populates="usages")
    audit_logs = relationship("AuditLog", back_populates="usage")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(Integer, primary_key=True, index=True)
    voucher_usage_id = Column(Integer, ForeignKey("voucher_usage.usage_id"), nullable=False)
    auditor_name = Column(String(100), nullable=False)
    validation_status = Column(SAEnum(ValidationStatus), nullable=False)
    findings = Column(Text)
    audit_date = Column(DateTime, server_default=func.now())
    evidence_notes = Column(Text)
    created_date = Column(DateTime, server_default=func.now())

    usage = relationship("VoucherUsage", back_populates="audit_logs")


class PricingHistory(Base):
    __tablename__ = "pricing_history"

    price_history_id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.service_id"), nullable=False)
    old_price = Column(Numeric(10, 2))
    new_price = Column(Numeric(10, 2), nullable=False)
    effective_date = Column(Date, nullable=False)
    changed_by = Column(String(100), nullable=False)
    change_reason = Column(Text)
    created_date = Column(DateTime, server_default=func.now())

    service = relationship("Service", back_populates="pricing_history")
