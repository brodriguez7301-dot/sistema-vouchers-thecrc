from datetime import datetime
from sqlalchemy.orm import Session
from models import Voucher


def generate_consecutive_number(db: Session) -> str:
    year = datetime.now().year
    last = (
        db.query(Voucher)
        .filter(Voucher.consecutive_number.like(f"VCH-{year}-%"))
        .order_by(Voucher.voucher_id.desc())
        .first()
    )
    if last:
        try:
            seq = int(last.consecutive_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"VCH-{year}-{seq:06d}"
