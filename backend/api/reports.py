from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from api.auth import get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_dashboard_summary(db)


@router.get("/ingresos-validados")
def ingresos_validados(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_validated_revenue(db)


@router.get("/por-proveedor")
def por_proveedor(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_validated_revenue(db)


@router.get("/por-propiedad")
def por_propiedad(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_report_by_property(db)


@router.get("/anomalias")
def anomalias(db: Session = Depends(get_db), _=Depends(require_role("admin", "auditor"))):
    return crud.get_anomalies(db)


@router.get("/trazabilidad/{voucher_id}")
def trazabilidad(voucher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    result = crud.get_traceability(db, voucher_id)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(404, "Voucher not found")
    v = result["voucher"]
    return {
        "voucher": {
            "voucher_id": v.voucher_id,
            "consecutive_number": v.consecutive_number,
            "guest_name": v.guest_name,
            "room_number": v.room_number,
            "status": v.status,
            "unit_price": float(v.unit_price),
            "property_name": v.property_name,
            "assigned_date": str(v.assigned_date),
        },
        "usages": [
            {
                "usage_id": u.usage_id,
                "invoice_number": u.invoice_number,
                "invoice_amount": float(u.invoice_amount),
                "status": u.status,
                "usage_date": str(u.usage_date),
                "audits": [
                    {"validation_status": a.validation_status, "auditor_name": a.auditor_name, "findings": a.findings}
                    for a in u.audit_logs
                ],
            }
            for u in result["usages"]
        ],
    }
