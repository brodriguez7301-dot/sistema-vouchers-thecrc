from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, cast, Date
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pathlib import Path
import shutil

from models import (
    Provider, Service, Voucher, VoucherUsage, AuditLog, PricingHistory,
    User, VoucherStatus, UsageStatus, ValidationStatus
)
import schemas
from config import settings
from utils.helpers import generate_consecutive_number
from utils.pdf_generator import generate_voucher_pdf


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: schemas.UserCreate, hashed_password: str) -> User:
    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hashed_password,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Providers ─────────────────────────────────────────────────────────────────

def get_providers(db: Session, active_only: bool = True):
    q = db.query(Provider)
    if active_only:
        q = q.filter(Provider.is_active == True)
    return q.order_by(Provider.name).all()


def get_provider(db: Session, provider_id: int) -> Optional[Provider]:
    return db.query(Provider).filter(Provider.provider_id == provider_id).first()


def create_provider(db: Session, data: schemas.ProviderCreate) -> Provider:
    obj = Provider(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_provider(db: Session, provider_id: int, data: schemas.ProviderUpdate) -> Optional[Provider]:
    obj = get_provider(db, provider_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_provider(db: Session, provider_id: int) -> bool:
    obj = get_provider(db, provider_id)
    if not obj:
        return False
    obj.is_active = False
    db.commit()
    return True


# ── Services ──────────────────────────────────────────────────────────────────

def get_services(db: Session, active_only: bool = True):
    q = db.query(Service)
    if active_only:
        q = q.filter(Service.is_active == True)
    return q.order_by(Service.category, Service.pricing_code, Service.service_name).all()


def get_service(db: Session, service_id: int) -> Optional[Service]:
    return db.query(Service).filter(Service.service_id == service_id).first()


def create_service(db: Session, data: schemas.ServiceCreate) -> Service:
    obj = Service(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_service(db: Session, service_id: int, data: schemas.ServiceUpdate, changed_by: str) -> Optional[Service]:
    obj = get_service(db, service_id)
    if not obj:
        return None
    if data.base_price is not None and data.base_price != obj.base_price:
        history = PricingHistory(
            service_id=service_id,
            old_price=obj.base_price,
            new_price=data.base_price,
            effective_date=date.today(),
            changed_by=changed_by,
            change_reason="Updated via API",
        )
        db.add(history)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


# ── Vouchers ──────────────────────────────────────────────────────────────────

def get_vouchers(
    db: Session,
    status: Optional[VoucherStatus] = None,
    property_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
):
    q = db.query(Voucher).options(joinedload(Voucher.provider), joinedload(Voucher.service))
    if status:
        q = q.filter(Voucher.status == status)
    if property_name:
        q = q.filter(Voucher.property_name == property_name)
    if date_from:
        q = q.filter(cast(Voucher.assigned_date, Date) >= date_from)
    if date_to:
        q = q.filter(cast(Voucher.assigned_date, Date) <= date_to)
    return q.order_by(Voucher.voucher_id.desc()).offset(skip).limit(limit).all()


def get_voucher(db: Session, voucher_id: int) -> Optional[Voucher]:
    return (
        db.query(Voucher)
        .options(joinedload(Voucher.provider), joinedload(Voucher.service))
        .filter(Voucher.voucher_id == voucher_id)
        .first()
    )


def get_voucher_by_consecutive(db: Session, consecutive: str) -> Optional[Voucher]:
    return (
        db.query(Voucher)
        .options(joinedload(Voucher.provider), joinedload(Voucher.service))
        .filter(Voucher.consecutive_number == consecutive)
        .first()
    )


def create_voucher(
    db: Session,
    data: schemas.VoucherCreate,
    photo_path: Optional[str],
    assigned_by: str,
) -> Voucher:
    consecutive = generate_consecutive_number(db)
    total = data.unit_price * data.quantity
    obj = Voucher(
        consecutive_number=consecutive,
        guest_photo_url=photo_path,
        assigned_by=assigned_by,
        total_amount=total,
        **data.model_dump(),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_voucher_status(db: Session, voucher_id: int, status: VoucherStatus) -> Optional[Voucher]:
    obj = get_voucher(db, voucher_id)
    if not obj:
        return None
    obj.status = status
    db.commit()
    db.refresh(obj)
    return obj


def generate_pdf_for_voucher(db: Session, voucher_id: int) -> Optional[str]:
    v = get_voucher(db, voucher_id)
    if not v:
        return None
    data = {
        "voucher_id": v.voucher_id,
        "consecutive_number": v.consecutive_number,
        "room_number": v.room_number,
        "guest_name": v.guest_name,
        "service_name": v.service.service_name if v.service else "",
        "provider_name": v.provider.name if v.provider else "",
        "unit_price": v.unit_price,
        "property_name": v.property_name,
        "assigned_date": str(v.assigned_date),
        "service_date": str(v.service_date) if v.service_date else None,
        "quantity": v.quantity,
        "notes": v.notes,
    }
    photo_path = v.guest_photo_url if v.guest_photo_url else None
    pdf_bytes = generate_voucher_pdf(data, photo_path)
    pdf_filename = f"{v.consecutive_number}.pdf"
    pdf_path = Path(settings.pdf_dir) / pdf_filename
    pdf_path.write_bytes(pdf_bytes)
    v.pdf_generated = True
    v.pdf_url = str(pdf_path)
    db.commit()
    return str(pdf_path)


# ── Voucher Usage ─────────────────────────────────────────────────────────────

def create_voucher_usage(
    db: Session,
    data: schemas.VoucherUsageCreate,
    front_desk_user: str,
) -> VoucherUsage:
    obj = VoucherUsage(
        front_desk_user=front_desk_user,
        **data.model_dump(),
    )
    db.add(obj)
    voucher = get_voucher(db, data.voucher_id)
    if voucher:
        voucher.status = VoucherStatus.INVOICED
    db.commit()
    db.refresh(obj)
    return obj


def get_voucher_usages(db: Session, status: Optional[UsageStatus] = None, today_only: bool = False):
    q = db.query(VoucherUsage).options(joinedload(VoucherUsage.voucher))
    if status:
        q = q.filter(VoucherUsage.status == status)
    if today_only:
        q = q.filter(cast(VoucherUsage.usage_date, Date) == date.today())
    return q.order_by(VoucherUsage.usage_id.desc()).all()


def get_voucher_usage(db: Session, usage_id: int) -> Optional[VoucherUsage]:
    return (
        db.query(VoucherUsage)
        .options(joinedload(VoucherUsage.voucher).joinedload(Voucher.provider),
                 joinedload(VoucherUsage.voucher).joinedload(Voucher.service))
        .filter(VoucherUsage.usage_id == usage_id)
        .first()
    )


# ── Audit ─────────────────────────────────────────────────────────────────────

def create_audit_log(
    db: Session,
    usage_id: int,
    data: schemas.AuditValidate,
    auditor_name: str,
) -> AuditLog:
    log = AuditLog(
        voucher_usage_id=usage_id,
        auditor_name=auditor_name,
        **data.model_dump(),
    )
    db.add(log)
    usage = db.query(VoucherUsage).filter(VoucherUsage.usage_id == usage_id).first()
    if usage:
        if data.validation_status == ValidationStatus.APPROVED:
            usage.status = UsageStatus.VALIDATED
        elif data.validation_status == ValidationStatus.REJECTED:
            usage.status = UsageStatus.REJECTED
        else:
            usage.status = UsageStatus.UNDER_REVIEW
    db.commit()
    db.refresh(log)
    return log


def get_pending_audits(db: Session):
    return (
        db.query(VoucherUsage)
        .options(
            joinedload(VoucherUsage.voucher).joinedload(Voucher.provider),
            joinedload(VoucherUsage.voucher).joinedload(Voucher.service),
        )
        .filter(VoucherUsage.status == UsageStatus.PENDING)
        .order_by(VoucherUsage.usage_date)
        .all()
    )


# ── Reports ───────────────────────────────────────────────────────────────────

def get_validated_revenue(db: Session):
    rows = (
        db.query(
            Provider.name.label("provider"),
            func.sum(VoucherUsage.invoice_amount).label("total"),
            func.count(VoucherUsage.usage_id).label("count"),
        )
        .join(Voucher, VoucherUsage.voucher_id == Voucher.voucher_id)
        .join(Provider, Voucher.provider_id == Provider.provider_id)
        .filter(VoucherUsage.status == UsageStatus.VALIDATED)
        .group_by(Provider.name)
        .all()
    )
    return [{"provider": r.provider, "total": float(r.total or 0), "count": r.count} for r in rows]


def get_report_by_property(db: Session):
    rows = (
        db.query(
            Voucher.property_name.label("property"),
            func.sum(VoucherUsage.invoice_amount).label("total"),
            func.count(VoucherUsage.usage_id).label("count"),
        )
        .join(VoucherUsage, Voucher.voucher_id == VoucherUsage.voucher_id)
        .filter(VoucherUsage.status == UsageStatus.VALIDATED)
        .group_by(Voucher.property_name)
        .all()
    )
    return [{"property": r.property, "total": float(r.total or 0), "count": r.count} for r in rows]


def get_anomalies(db: Session):
    usages = (
        db.query(VoucherUsage)
        .options(joinedload(VoucherUsage.voucher))
        .all()
    )
    anomalies = []
    for u in usages:
        if u.voucher:
            diff_pct = abs(float(u.invoice_amount) - float(u.voucher.unit_price)) / float(u.voucher.unit_price or 1)
            if diff_pct > 0.05:
                anomalies.append({
                    "usage_id": u.usage_id,
                    "consecutive_number": u.voucher.consecutive_number,
                    "voucher_price": float(u.voucher.unit_price),
                    "invoice_amount": float(u.invoice_amount),
                    "diff_pct": round(diff_pct * 100, 2),
                    "status": u.status,
                })
    return anomalies


def get_traceability(db: Session, voucher_id: int):
    v = get_voucher(db, voucher_id)
    if not v:
        return None
    usages = db.query(VoucherUsage).options(joinedload(VoucherUsage.audit_logs)).filter(
        VoucherUsage.voucher_id == voucher_id
    ).all()
    return {"voucher": v, "usages": usages}


def get_dashboard_summary(db: Session) -> dict:
    total = db.query(func.count(Voucher.voucher_id)).scalar() or 0
    issued = db.query(func.count(Voucher.voucher_id)).filter(Voucher.status == VoucherStatus.ISSUED).scalar() or 0
    invoiced = db.query(func.count(Voucher.voucher_id)).filter(Voucher.status == VoucherStatus.INVOICED).scalar() or 0
    validated_sum = db.query(func.sum(VoucherUsage.invoice_amount)).filter(VoucherUsage.status == UsageStatus.VALIDATED).scalar() or 0
    providers_count = db.query(func.count(Provider.provider_id)).filter(Provider.is_active == True).scalar() or 0
    return {
        "total_vouchers": total,
        "total_issued": issued,
        "total_invoiced": invoiced,
        "total_validated": db.query(func.count(VoucherUsage.usage_id)).filter(VoucherUsage.status == UsageStatus.VALIDATED).scalar() or 0,
        "total_amount_validated": float(validated_sum),
        "total_providers": providers_count,
    }
