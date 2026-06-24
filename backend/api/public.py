"""
Public endpoints — no authentication required.
Used for QR scan validation by providers.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime

from database import get_db
from models import Voucher, VoucherScan
from api.auth import get_current_user

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/voucher/{consecutive_number}")
def public_voucher(consecutive_number: str, request: Request, db: Session = Depends(get_db)):
    """
    Public endpoint — no auth required.
    Called when a provider scans the QR code.
    Logs the scan and returns voucher info.
    """
    v = (
        db.query(Voucher)
        .options(joinedload(Voucher.provider), joinedload(Voucher.service))
        .filter(Voucher.consecutive_number == consecutive_number)
        .first()
    )
    if not v:
        return {"found": False, "consecutive_number": consecutive_number}

    # Log the scan
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    ua = request.headers.get("User-Agent", "")[:300]
    scan = VoucherScan(voucher_id=v.voucher_id, ip_address=ip, user_agent=ua)
    db.add(scan)
    db.commit()

    return {
        "found": True,
        "consecutive_number": v.consecutive_number,
        "guest_name":   v.guest_name,
        "room_number":  v.room_number,
        "property_name": v.property_name,
        "service_name": v.service.service_name if v.service else "",
        "service_code": v.service.pricing_code if v.service else "",
        "provider_name": v.provider.name if v.provider else "Servicio Propio CWL",
        "service_date": str(v.service_date) if v.service_date else None,
        "quantity":     v.quantity,
        "status":       v.status,
        "notes":        v.notes,
        "scan_count":   db.query(VoucherScan).filter(VoucherScan.voucher_id == v.voucher_id).count(),
    }


@router.get("/voucher/{consecutive_number}/scans")
def get_scans(consecutive_number: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Admin only — returns scan history for a voucher."""
    v = db.query(Voucher).filter(Voucher.consecutive_number == consecutive_number).first()
    if not v:
        return []
    scans = (
        db.query(VoucherScan)
        .filter(VoucherScan.voucher_id == v.voucher_id)
        .order_by(VoucherScan.scanned_at.desc())
        .all()
    )
    return [
        {
            "scan_id":    s.scan_id,
            "scanned_at": str(s.scanned_at),
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
        }
        for s in scans
    ]
