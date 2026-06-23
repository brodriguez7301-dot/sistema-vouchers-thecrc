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
    provider_id: int = Form(...),
    service_id: int = Form(...),
    room_number: str = Form(...),
    guest_name: str = Form(...),
    property_name: str = Form(...),
    unit_price: float = Form(...),
    quantity: int = Form(1),
    notes: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role("admin")),
):
    if photo.size and photo.size > settings.max_file_size:
        raise HTTPException(400, "Photo file too large")

    ext = Path(photo.filename).suffix if photo.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    save_path = Path(settings.upload_dir) / filename

    with save_path.open("wb") as f:
        shutil.copyfileobj(photo.file, f)

    from decimal import Decimal
    data = schemas.VoucherCreate(
        provider_id=provider_id,
        service_id=service_id,
        room_number=room_number,
        guest_name=guest_name,
        property_name=property_name,
        unit_price=Decimal(str(unit_price)),
        quantity=quantity,
        notes=notes,
    )
    voucher = crud.create_voucher(db, data, photo_path=str(save_path), assigned_by=user.name)
    return voucher


@router.put("/{voucher_id}/status", response_model=schemas.VoucherOut)
def update_status(voucher_id: int, data: schemas.VoucherStatusUpdate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    obj = crud.update_voucher_status(db, voucher_id, data.status)
    if not obj:
        raise HTTPException(404, "Voucher not found")
    return obj


@router.post("/{voucher_id}/generate-pdf")
def generate_pdf(voucher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    path = crud.generate_pdf_for_voucher(db, voucher_id)
    if not path:
        raise HTTPException(404, "Voucher not found")
    return {"message": "PDF generated", "pdf_url": path}


@router.get("/{voucher_id}/pdf")
def download_pdf(voucher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
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
