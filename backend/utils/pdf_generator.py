from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO
from pathlib import Path
import json
from decimal import Decimal

from utils.qr_generator import generate_qr_bytes

# Colors
RED = HexColor("#FF0000")
BLUE = HexColor("#0066CC")
DARK_GRAY = HexColor("#333333")
GRAY = HexColor("#666666")
LIGHT_GRAY = HexColor("#DDDDDD")
NAVY = HexColor("#002147")


def generate_voucher_pdf(voucher_data: dict, photo_path: str | None = None) -> bytes:
    buf = BytesIO()
    w, h = landscape(A5)  # 595 x 420 pt approx
    c = canvas.Canvas(buf, pagesize=landscape(A5))

    margin = 10 * mm

    # Background
    c.setFillColor(white)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Header bar
    c.setFillColor(NAVY)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)

    # Company name
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin, h - 12 * mm, "THE COSTA RICA COLLECTION")

    # SERVICE VOUCHER subtitle
    c.setFont("Helvetica", 9)
    c.drawString(margin, h - 17 * mm, "SERVICE VOUCHER")

    # Property tag (top right)
    prop = voucher_data.get("property_name", "")
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(w - margin, h - 10 * mm, prop.upper())
    c.setFont("Helvetica", 8)
    c.drawRightString(w - margin, h - 15 * mm, voucher_data.get("assigned_date", "")[:10] if voucher_data.get("assigned_date") else "")

    # Voucher number box
    box_y = h - 42 * mm
    box_h = 14 * mm
    c.setFillColor(HexColor("#FFF3F3"))
    c.setStrokeColor(RED)
    c.setLineWidth(2)
    c.rect(margin, box_y, w - 2 * margin, box_h, fill=1, stroke=1)
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, box_y + 3 * mm, voucher_data.get("consecutive_number", ""))

    # Left column: photo + QR
    col_left_x = margin
    photo_w = 38 * mm
    photo_h = 48 * mm
    photo_y = box_y - photo_h - 4 * mm

    if photo_path and Path(photo_path).exists():
        try:
            img = ImageReader(photo_path)
            c.drawImage(img, col_left_x, photo_y, width=photo_w, height=photo_h, preserveAspectRatio=True, mask="auto")
        except Exception:
            _draw_photo_placeholder(c, col_left_x, photo_y, photo_w, photo_h)
    else:
        _draw_photo_placeholder(c, col_left_x, photo_y, photo_w, photo_h)

    # Border around photo
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(1)
    c.rect(col_left_x, photo_y, photo_w, photo_h)

    # QR code
    qr_size = 22 * mm
    qr_y = photo_y - qr_size - 4 * mm
    try:
        qr_data = {
            "voucher_id": voucher_data.get("voucher_id"),
            "consecutive": voucher_data.get("consecutive_number"),
            "room": voucher_data.get("room_number"),
            "guest": voucher_data.get("guest_name"),
            "service": voucher_data.get("service_name", ""),
            "price": float(voucher_data.get("unit_price", 0)),
            "date": str(voucher_data.get("assigned_date", ""))[:10],
        }
        qr_bytes = generate_qr_bytes(qr_data)
        qr_img = ImageReader(BytesIO(qr_bytes))
        c.drawImage(qr_img, col_left_x, qr_y, width=qr_size, height=qr_size)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 6)
        c.drawCentredString(col_left_x + qr_size / 2, qr_y - 4 * mm, "Scan to validate")
    except Exception:
        pass

    # Right column: guest info
    col_right_x = col_left_x + photo_w + 8 * mm
    col_right_w = w - col_right_x - margin
    line_h = 7 * mm
    info_y = box_y - 8 * mm

    fields = [
        ("Room", voucher_data.get("room_number", "")),
        ("Guest", voucher_data.get("guest_name", "")),
        ("Service", voucher_data.get("service_name", "")),
        ("Provider", voucher_data.get("provider_name", "")),
        ("Price", f"USD ${float(voucher_data.get('unit_price', 0)):,.2f}"),
        ("Property", voucher_data.get("property_name", "")),
        ("Valid until", voucher_data.get("valid_until", str(voucher_data.get("assigned_date", ""))[:10])),
    ]

    for label, value in fields:
        # Label
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(col_right_x, info_y, label.upper() + ":")
        # Value
        c.setFillColor(DARK_GRAY)
        c.setFont("Helvetica", 9)
        label_w = c.stringWidth(label.upper() + ": ", "Helvetica-Bold", 8)
        c.drawString(col_right_x + label_w + 2, info_y, str(value))
        # Separator line
        c.setStrokeColor(LIGHT_GRAY)
        c.setLineWidth(0.5)
        c.line(col_right_x, info_y - 2, col_right_x + col_right_w, info_y - 2)
        info_y -= line_h

    # Notes
    if voucher_data.get("notes"):
        c.setFillColor(GRAY)
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(col_right_x, info_y, f"Notes: {voucher_data['notes'][:80]}")

    # Footer
    c.setFillColor(LIGHT_GRAY)
    c.rect(0, 0, w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(w / 2, 2 * mm, "This voucher is property of The Costa Rica Collection · Not transferable · Valid only for specified service")

    c.save()
    return buf.getvalue()


def _draw_photo_placeholder(c, x, y, w, h):
    c.setFillColor(HexColor("#F0F0F0"))
    c.rect(x, y, w, h, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(x + w / 2, y + h / 2, "GUEST PHOTO")
