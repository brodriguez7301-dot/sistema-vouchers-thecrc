# 🎫 ESPECIFICACIÓN DE DISEÑO VISUAL - VOUCHER ELECTRÓNICO
## Sistema de Vouchers - The Costa Rica Collection

---

## 📐 ESPECIFICACIONES TÉCNICAS DEL PDF

**Formato:** A5 Horizontal (210mm x 148mm) - Media carta
**Resolución:** 300 DPI (imprimible de alta calidad)
**Fuente Base:** Montserrat (sans-serif, profesional y moderna)
**Colores Corporativos:** 
- Azul: #0066CC (Costa Rica Collection)
- Rojo: #FF0000 (número de voucher destacado)
- Gris: #333333 (texto principal)
- Fondo: #FFFFFF (blanco)

---

## 🎨 LAYOUT DEL VOUCHER (Vista Frontal)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     [LOGO CRC]                       │  │
│  │            THE COSTA RICA COLLECTION                │  │
│  │                   SERVICE VOUCHER                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║                                                      ║  │
│  ║              VCH-2026-001001                        ║  │
│  ║        (NÚMERO EN ROJO, FUENTE 48PT, BOLD)         ║  │
│  ║                                                      ║  │
│  ╚══════════════════════════════════════════════════════╝  │
│                                                             │
│  [FOTO HUÉSPED]          │  DATOS HUÉSPED                 │
│  (4cm x 5cm)             │  ─────────────────────────     │
│  Con QR debajo           │  Habitación: 307               │
│                          │  Huésped: Juan García López    │
│                          │  Email: juan@email.com         │
│                          │                                 │
│  ┌────────────────────┐  │  SERVICIO                     │
│  │                    │  │  ─────────────────────────     │
│  │    QR CODE         │  │  Tour Corcovado National Park  │
│  │                    │  │  Transporte + Guía Incluido    │
│  │                    │  │                                 │
│  └────────────────────┘  │  PRECIO                       │
│  Escanea para validar    │  ─────────────────────────     │
│                          │  USD $89.00                    │
│                          │                                 │
│  Fecha: 23 Jun 2026      │  Proveedor: Eco Tours CR      │
│  Propiedad: Corcovado    │  Válido hasta: 30 Jun 2026    │
│                          │                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 ESPECIFICACIÓN DETALLADA DE ELEMENTOS

### 1. ENCABEZADO (Top Section)
**Altura:** 3cm
```
┌─────────────────────────────────────────┐
│     [LOGO 1.5cm x 1.5cm]                │
│                                         │
│     THE COSTA RITA COLLECTION           │
│     (Montserrat Bold, 16pt, Azul)       │
│                                         │
│          SERVICE VOUCHER                │
│     (Montserrat Regular, 12pt, Gris)    │
└─────────────────────────────────────────┘
```

---

### 2. NÚMERO DE VOUCHER (Highlight Principal) ⭐
**Altura:** 1.8cm
**Fondo:** Rectángulo redondeado con borde rojo 2px

```
┌───────────────────────────────────────┐
│                                       │
│        VCH-2026-001001               │
│  (Montserrat Black, 48pt, ROJO #FF0000) │
│                                       │
└───────────────────────────────────────┘
```

---

### 3. SECCIÓN IZQUIERDA - FOTO Y QR
**Ancho:** 5cm | **Alto:** 5cm

#### Foto del Huésped
- **Dimensiones:** 4cm x 5cm
- **Formato:** JPG/PNG cuadrado o rectangular
- **Borde:** 1px gris claro
- **Esquinas:** Redondeadas (2px)
- **Si no hay foto:** Mostrar placeholder gris con icono de persona

#### Código QR
- **Tamaño:** 2cm x 2cm
- **Datos codificados:** 
  ```
  {
    "voucher_id": 1001,
    "consecutive": "VCH-2026-001001",
    "room": "307",
    "guest": "Juan García López",
    "service": "Tour Corcovado",
    "price": 89.00,
    "date": "2026-06-23"
  }
  ```
- **Colocación:** Debajo de la foto
- **Texto bajo QR:** "Escanea para validar" (8pt, gris)

---

### 4. SECCIÓN DERECHA - INFORMACIÓN
**Ancho:** 8cm | **Alto:** 5cm
Dividida en 4 subsecciones:

#### 4.1 DATOS DEL HUÉSPED
```
DATOS HUÉSPED
─────────────────────────────────
Habitación: 307
Huésped: Juan García López
Email: juan@email.com

(Montserrat Semi-Bold 10pt para labels)
(Montserrat Regular 9pt para valores)
```

#### 4.2 SERVICIO
```
SERVICIO
─────────────────────────────────
Tour Corcovado National Park
Transporte + Guía Incluido

(Montserrat Semi-Bold 10pt para label)
(Montserrat Regular 9pt para descripción)
```

#### 4.3 PRECIO
```
PRECIO
─────────────────────────────────
USD $89.00

(Montserrat Semi-Bold 10pt para label)
(Montserrat Bold 16pt para precio, Azul)
```

#### 4.4 DETALLES FINALES
```
Proveedor: Eco Tours CR
Válido hasta: 30 Jun 2026
Propiedad: Corcovado

(Montserrat Regular 8pt)
```

---

## 🎨 PALETA DE COLORES

| Uso | Color | Hex | RGB |
|-----|-------|-----|-----|
| Número Voucher | Rojo | #FF0000 | 255, 0, 0 |
| Headers/Labels | Azul | #0066CC | 0, 102, 204 |
| Texto Principal | Gris Oscuro | #333333 | 51, 51, 51 |
| Texto Secundario | Gris | #666666 | 102, 102, 102 |
| Bordes/Líneas | Gris Claro | #DDDDDD | 221, 221, 221 |
| Fondo | Blanco | #FFFFFF | 255, 255, 255 |

---

## 🔤 TIPOGRAFÍA

| Elemento | Fuente | Tamaño | Peso | Color |
|----------|--------|--------|------|-------|
| Logo/Marca | Montserrat | 16pt | Bold | Azul |
| "SERVICE VOUCHER" | Montserrat | 12pt | Regular | Gris |
| **Número Voucher** | **Montserrat** | **48pt** | **Black** | **Rojo** |
| Labels (Datos) | Montserrat | 10pt | Semi-Bold | Azul |
| Valores (Datos) | Montserrat | 9pt | Regular | Gris |
| Servicio Desc | Montserrat | 9pt | Regular | Gris |
| Precio | Montserrat | 16pt | Bold | Azul |
| Detalles Finales | Montserrat | 8pt | Regular | Gris |
| QR Texto | Montserrat | 8pt | Regular | Gris |

---

## 📋 LÍNEAS DIVISORIAS

Usar líneas horizontales de **1px gris (#DDDDDD)** para separar secciones:
- Debajo del encabezado
- Entre DATOS / SERVICIO / PRECIO
- Debajo de la foto (opcional)

---

## 💾 DATOS DINÁMICOS (Se obtienen de la BD)

```
[LOGO] → Archivo estático
[THE COSTA RICA COLLECTION] → Texto estático
[SERVICE VOUCHER] → Texto estático

[VCH-2026-001001] → Vouchers.consecutive_number ⭐
[FOTO] → Vouchers.guest_photo_url (o placeholder)
[QR] → Generado dinámicamente con Vouchers data

Habitación: 307 → Vouchers.room_number
Huésped: Juan García López → Vouchers.guest_name

SERVICIO → Services.service_name
Transporte + Guía Incluido → Services.description

USD $89.00 → Vouchers.unit_price
Eco Tours CR → Providers.name
Propiedad: Corcovado → Vouchers.property_name
Válido hasta: 30 Jun 2026 → Vouchers.assigned_date + 7 días
Fecha: 23 Jun 2026 → Vouchers.created_date
```

---

## 🖨️ CONSIDERACIONES DE IMPRESIÓN

1. **Márgenes:** 10mm en todos los lados
2. **Sangrado:** No es necesario (PDF completo)
3. **Resolución mínima:** 300 DPI para impresión clara
4. **Papel recomendado:** Cartulina blanca 180 gsm (más resistente)
5. **Modo color:** RGB o CMYK (ambos soportados)
6. **Tamaño final:** A5 Horizontal (148mm x 210mm)

---

---

## 🛠️ LIBRERÍAS RECOMENDADAS (Backend)

### Python FastAPI:
```python
# Generar PDF
from reportlab.lib.pagesizes import landscape, A5
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# Generar QR
import qrcode
from io import BytesIO

# Imagen
from PIL import Image
```

### JavaScript/Node.js (si prefieres):
```javascript
// PDF
import PDFDocument from 'pdfkit';
import { PDFPage } from 'pdf-lib';

// QR
import QRCode from 'qrcode';
```

---

## ✅ CHECKLIST DE VALIDACIÓN VISUAL

- [ ] Logo cargado correctamente
- [ ] Número de voucher en rojo, tamaño 48pt, bien visible
- [ ] Foto del huésped se muestra (o placeholder si no hay)
- [ ] QR legible y scaneable
- [ ] Todos los datos (habitación, huésped, servicio) correctos
- [ ] Precio bien formateado (USD $XX.XX)
- [ ] Colores coinciden con marca (Azul #0066CC)
- [ ] Tipografía profesional y legible
- [ ] Espaciado balanceado
- [ ] PDF se exporta a 300 DPI
- [ ] Email llega correctamente con PDF adjunto
- [ ] Impresión en A5 horizontal se ve profesional

---

## 🚀 EJEMPLO VISUAL (ASCII Art)

```
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║           [🏢 LOGO]  THE COSTA RICA COLLECTION         ║
║                   SERVICE VOUCHER                       ║
║                                                         ║
║  ╔═══════════════════════════════════════════════════╗  ║
║  ║          VCH-2026-001001                         ║  ║
║  ║     (NÚMERO EN ROJO GRANDE Y BOLD)              ║  ║
║  ╚═══════════════════════════════════════════════════╝  ║
║                                                         ║
║  ╔──────────────╗  Habitación: 307                     ║
║  │              │  Huésped: Juan García López         ║
║  │   📸 FOTO    │  Email: juan@email.com              ║
║  │              │                                     ║
║  ╚──────────────╝  SERVICIO                          ║
║                   Tour Corcovado National Park        ║
║  ╔──────────────╗  Transporte + Guía Incluido         ║
║  │              │                                     ║
║  │   ▓▓▓▓▓▓    │  PRECIO                             ║
║  │   ▓▓▓▓▓▓    │  USD $89.00                         ║
║  │   ▓▓▓▓▓▓    │                                     ║
║  │   ▓▓▓▓▓▓    │  Proveedor: Eco Tours CR           ║
║  │   ▓▓▓▓▓▓    │  Válido hasta: 30 Jun 2026         ║
║  ╚──────────────╝                                     ║
║  Escanea para validar                                ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

---

**Elaborado para:** The Costa Rica Collection  
**Propósito:** Especificación de Diseño Visual de Voucher PDF  
**Formato:** A5 Horizontal (210mm x 148mm)  
**Resolución:** 300 DPI (imprimible)  
**Estado:** Listo para implementación
