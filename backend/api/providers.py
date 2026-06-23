from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud
import schemas
from database import get_db
from api.auth import get_current_user, require_role

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/", response_model=List[schemas.ProviderOut])
def list_providers(active_only: bool = True, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_providers(db, active_only=active_only)


@router.get("/{provider_id}", response_model=schemas.ProviderOut)
def get_provider(provider_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_provider(db, provider_id)
    if not obj:
        raise HTTPException(404, "Provider not found")
    return obj


@router.post("/", response_model=schemas.ProviderOut, status_code=201)
def create_provider(data: schemas.ProviderCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    return crud.create_provider(db, data)


@router.put("/{provider_id}", response_model=schemas.ProviderOut)
def update_provider(provider_id: int, data: schemas.ProviderUpdate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    obj = crud.update_provider(db, provider_id, data)
    if not obj:
        raise HTTPException(404, "Provider not found")
    return obj


@router.delete("/{provider_id}")
def delete_provider(provider_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if not crud.delete_provider(db, provider_id):
        raise HTTPException(404, "Provider not found")
    return {"message": "Provider deactivated"}
