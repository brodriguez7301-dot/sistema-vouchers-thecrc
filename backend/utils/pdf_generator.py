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

    # Data fields — full width, two columns side by side
    qr_size   = 24 * mm
    data_x    = margin
    data_w    = w - 2 * margin - qr_size - 6 * mm   # leave room for QR on right
    line_h    = 6.8 * mm
    info_y    = box_y - 7 * mm

    service_date_str = ""
    if voucher_data.get("service_date"):
        service_date_str = str(voucher_data["service_date"])[:10]
    pax = voucher_data.get("quantity", 1)
    provider_name = voucher_data.get("provider_name", "") or "Servicio propio CWL"
    fields = [
        ("Room",         voucher_data.get("room_number", "")),
        ("Guest",        voucher_data.get("guest_name", "")),
        ("Service",      voucher_data.get("service_name", "")),
        ("Provider",     provider_name),
        ("PAX",          str(pax)),
        ("Price",        f"USD ${float(voucher_data.get('unit_price', 0)):,.2f}"),
        ("Service Date", service_date_str or "—"),
        ("Property",     voucher_data.get("property_name", "")),
    ]

    for label, value in fields:
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(data_x, info_y, label.upper() + ":")
        label_w = c.stringWidth(label.upper() + ": ", "Helvetica-Bold", 8)
        c.setFillColor(DARK_GRAY)
        c.setFont("Helvetica", 9)
        # truncate long values so they don't bleed into QR
        max_w = data_w - label_w - 2
        display_val = str(value)
        while display_val and c.stringWidth(display_val, "Helvetica", 9) > max_w:
            display_val = display_val[:-1]
        c.drawString(data_x + label_w + 2, info_y, display_val)
        c.setStrokeColor(LIGHT_GRAY)
        c.setLineWidth(0.5)
        c.line(data_x, info_y - 2, data_x + data_w, info_y - 2)
        info_y -= line_h

    # Notes
    if voucher_data.get("notes"):
        c.setFillColor(GRAY)
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(data_x, info_y, f"Notes: {voucher_data['notes'][:90]}")

    # QR code — right side, vertically centered in data area
    qr_x = w - margin - qr_size
    qr_top = box_y - 7 * mm
    qr_y   = qr_top - qr_size
    try:
        consecutive = voucher_data.get("consecutive_number", "")
        qr_data = f"https://sistema-vouchers-thecrc.vercel.app/v/{consecutive}"
        qr_bytes = generate_qr_bytes(qr_data)
        qr_img = ImageReader(BytesIO(qr_bytes))
        c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 6)
        c.drawCentredString(qr_x + qr_size / 2, qr_y - 3.5 * mm, "Scan to validate")
    except Exception:
        pass

    # ── Confirmation stamp ────────────────────────────────────────────────────
    confirmed     = voucher_data.get("provider_confirmed", False)
    confirmed_at  = voucher_data.get("provider_confirmed_at")

    stamp_h   = 12 * mm
    stamp_y   = 7 * mm          # just above footer
    stamp_x   = margin
    stamp_w   = w - 2 * margin

    if confirmed:
        confirmed_date = str(confirmed_at)[:16].replace("T", " ") if confirmed_at else ""
        c.setFillColor(HexColor("#0F6E56"))          # dark teal
        c.roundRect(stamp_x, stamp_y, stamp_w, stamp_h, 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(stamp_x + 4 * mm, stamp_y + 4.5 * mm, "✓  RECEPCIÓN CONFIRMADA POR PROVEEDOR")
        c.setFont("Helvetica", 8)
        c.drawRightString(stamp_x + stamp_w - 4 * mm, stamp_y + 4.5 * mm, confirmed_date)
    else:
        c.setFillColor(HexColor("#888780"))          # gray
        c.roundRect(stamp_x, stamp_y, stamp_w, stamp_h, 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(stamp_x + stamp_w / 2, stamp_y + 4.5 * mm, "⏳  PENDIENTE DE CONFIRMACIÓN DEL PROVEEDOR")

    # Footer
    c.setFillColor(LIGHT_GRAY)
    c.rect(0, 0, w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(w / 2, 2 * mm, "This voucher is property of The Costa Rica Collection · Not transferable · Valid only for specified service")

    c.save()
    return buf.getvalue()


