import qrcode
import json
from io import BytesIO
from decimal import Decimal


def generate_qr_bytes(data: dict) -> bytes:
    def default(o):
        if isinstance(o, Decimal):
            return float(o)
        raise TypeError

    payload = json.dumps(data, default=default, ensure_ascii=False)
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
