from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud
import schemas
from database import get_db
from api.auth import get_current_user, require_role

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/", response_model=List[schemas.ServiceOut])
def list_services(active_only: bool = True, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_services(db, active_only=active_only)


@router.get("/{service_id}", response_model=schemas.ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_service(db, service_id)
    if not obj:
        raise HTTPException(404, "Service not found")
    return obj


@router.post("/", response_model=schemas.ServiceOut, status_code=201)
def create_service(data: schemas.ServiceCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    return crud.create_service(db, data)


@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(service_id: int, data: schemas.ServiceUpdate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    obj = crud.update_service(db, service_id, data, changed_by=user.name)
    if not obj:
        raise HTTPException(404, "Service not found")
    return obj
