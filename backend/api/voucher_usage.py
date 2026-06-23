from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud
import schemas
from models import VoucherStatus
from database import get_db
from api.auth import get_current_user, require_role

router = APIRouter(prefix="/api/voucher-usage", tags=["voucher-usage"])

TOLERANCE = 0.05


@router.get("/today", response_model=List[schemas.VoucherUsageOut])
def today_usages(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_voucher_usages(db, today_only=True)


@router.get("/", response_model=List[schemas.VoucherUsageOut])
def list_usages(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_voucher_usages(db)


@router.post("/", response_model=schemas.VoucherUsageOut, status_code=201)
def register_usage(data: schemas.VoucherUsageCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # RN-002: voucher must be ISSUED
    voucher = crud.get_voucher(db, data.voucher_id)
    if not voucher:
        raise HTTPException(404, "Voucher not found")
    if voucher.status != VoucherStatus.ISSUED:
        raise HTTPException(400, f"Voucher status is '{voucher.status}' — must be ISSUED to use")

    # RN-007: no double usage
    existing = crud.get_voucher_usages(db)
    for u in existing:
        if u.voucher_id == data.voucher_id:
            raise HTTPException(400, "Voucher has already been invoiced (RN-007)")

    # RN-003: amount tolerance ±5%
    unit_price = float(voucher.unit_price)
    invoice_amount = float(data.invoice_amount)
    diff_pct = abs(invoice_amount - unit_price) / unit_price if unit_price else 0
    if diff_pct > TOLERANCE:
        raise HTTPException(
            400,
            f"Invoice amount ${invoice_amount:.2f} differs from voucher price ${unit_price:.2f} by {diff_pct*100:.1f}% (max 5%)"
        )

    return crud.create_voucher_usage(db, data, front_desk_user=user.name)
