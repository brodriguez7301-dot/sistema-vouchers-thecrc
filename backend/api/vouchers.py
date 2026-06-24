from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pathlib import Path
import shutil
import uuid

import crud
import schemas
from models import VoucherStatus
from database import get_db
from api.auth import get_current_user, require_role
from config import settings

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])


@router.get("/", response_model=List[schemas.VoucherOut])
def list_vouchers(
    status: Optional[VoucherStatus] = None,
    property_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return crud.get_vouchers(db, status=status, property_name=property_name, date_from=date_from, date_to=date_to, skip=skip, limit=limit)


@router.get("/by-consecutive/{consecutive_number}", response_model=schemas.VoucherOut)
def get_by_consecutive(consecutive_number: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_voucher_by_consecutive(db, consecutive_number)
    if not obj:
        raise HTTPException(404, "Voucher not found")
    return obj


@router.get("/{voucher_id}", response_model=schemas.VoucherOut)
def get_voucher(voucher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_voucher(db, voucher_id)
    if not obj:
        raise HTTPException(404, "Voucher not found")
    return obj


@router.post("/", response_model=schemas.VoucherOut, status_code=201)
async def create_voucher(
    service_id: int = Form(...),
    room_number: str = Form(...),
    guest_name: str = Form(...),
    property_name: str = Form(...),
    unit_price: float = Form(...),
    guest_price: Optional[float] = Form(None),
    provider_id: Optional[int] = Form(None),
    sales_channel: Optional[str] = Form(None),
    quantity: int = Form(1),
    notes: Optional[str] = Form(None),
    service_date: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user=Depends(require_role("admin")),
):
    photo_path = None
    if photo and photo.filename:
        if photo.size and photo.size > settings.max_file_size:
            raise HTTPException(400, "Photo file too large")
        ext = Path(photo.filename).suffix or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        save_path = Path(settings.upload_dir) / filename
        with save_path.open("wb") as f:
            shutil.copyfileobj(photo.file, f)
        photo_path = str(save_path)

    from decimal import Decimal
    from datetime import date as date_type
    parsed_date = None
    if service_date:
        try:
            parsed_date = date_type.fromisoformat(service_date)
        except ValueError:
            pass
    data = schemas.VoucherCreate(
        provider_id=provider_id,
        service_id=service_id,
        room_number=room_number,
        guest_name=guest_name,
        property_name=property_name,
        sales_channel=sales_channel,
        unit_price=Decimal(str(unit_price)),
        guest_price=Decimal(str(guest_price)) if guest_price is not None else None,
        quantity=quantity,
        notes=notes,
        service_date=parsed_date,
    )
    voucher = crud.create_voucher(db, data, photo_path=photo_path, assigned_by=user.name)
    return voucher


@router.put("/{voucher_id}/status", response_model=schemas.VoucherOut)
def update_status(voucher_id: int, data: schemas.VoucherStatusUpdate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    obj = crud.update_voucher_status(db, voucher_id, data.status)
    if not obj:
        raise HTTPException(404, "Voucher not found")
    return obj


@router.put("/{voucher_id}/audit", response_model=schemas.VoucherOut)
def audit_voucher(voucher_id: int, data: schemas.VoucherAuditUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from datetime import datetime as dt
    obj = crud.get_voucher(db, voucher_id)
    if not obj:
        raise HTTPException(404, "Voucher not found")
    obj.audit_status   = data.audit_status
    obj.invoice_number = data.invoice_number
    obj.audit_notes    = data.audit_notes
    obj.audited_by     = user.name
    obj.audited_at     = dt.utcnow()
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/{voucher_id}/generate-pdf")
def generate_pdf(voucher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    path = crud.generate_pdf_for_voucher(db, voucher_id)
    if not path:
        raise HTTPException(404, "Voucher not found")
    return {"message": "PDF generated", "pdf_url": path}


@router.get("/{voucher_id}/pdf")
def download_pdf(voucher_id: int, token: Optional[str] = None, db: Session = Depends(get_db)):
    from jose import JWTError, jwt
    from config import settings as cfg
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, cfg.secret_key, algorithms=[cfg.algorithm])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Not authenticated")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    v = crud.get_voucher(db, voucher_id)
    if not v:
        raise HTTPException(404, "Voucher not found")
    if not v.pdf_generated or not v.pdf_url:
        path = crud.generate_pdf_for_voucher(db, voucher_id)
        if not path:
            raise HTTPException(500, "PDF generation failed")
        pdf_path = Path(path)
    else:
        pdf_path = Path(v.pdf_url)
    if not pdf_path.exists():
        path = crud.generate_pdf_for_voucher(db, voucher_id)
        pdf_path = Path(path)
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=f"{v.consecutive_number}.pdf")
