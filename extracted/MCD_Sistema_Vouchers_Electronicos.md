# MODELO CONCEPTUAL DE DATOS (MCD)
## Sistema de Vouchers Electrónicos para Validación de Servicios
### The Costa Rica Collection - Área Remota

---

## 📋 VISIÓN GENERAL
Sistema que genera vouchers/tickets electrónicos únicos con numeración indefinida. Los proveedores reciben el voucher, lo referencian en facturas, y el Front Desk lo usa para validar cargos. Los auditores consultan el sistema para validar si los ingresos son reales.

---

## 🗂️ ESTRUCTURA DE TABLAS

### 1. TABLA: `Providers` (Proveedores de Servicios)
**Propósito:** Almacenar información de todos los proveedores con los que trabaja la empresa.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `provider_id` | INT | PK, AUTO_INCREMENT | Identificador único del proveedor |
| `name` | VARCHAR(150) | NOT NULL, UNIQUE | Nombre del proveedor |
| `provider_type` | ENUM | NOT NULL | 'TOUR', 'TRANSPORT', 'OTHER' |
| `contact_email` | VARCHAR(100) | UNIQUE | Email del contacto |
| `contact_phone` | VARCHAR(20) | | Teléfono de contacto |
| `bank_account` | VARCHAR(50) | | Cuenta bancaria para pagos |
| `is_active` | BOOLEAN | DEFAULT TRUE | Estado activo/inactivo |
| `created_date` | DATETIME | DEFAULT NOW() | Fecha de creación |
| `updated_date` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Última actualización |

**Índices:**
```sql
INDEX idx_provider_type (provider_type)
INDEX idx_is_active (is_active)
```

---

### 2. TABLA: `Services` (Catálogo de Servicios)
**Propósito:** Definir tipos de servicios con precios base que se pueden ofrecer.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `service_id` | INT | PK, AUTO_INCREMENT | Identificador único del servicio |
| `provider_id` | INT | FK → Providers | Proveedor que ofrece el servicio |
| `service_name` | VARCHAR(150) | NOT NULL | Nombre del servicio (ej: "Tour Corcovado", "Transporte Hotel-Playa") |
| `service_type` | ENUM | NOT NULL | 'TOUR', 'TRANSPORT', 'ACTIVITY', 'OTHER' |
| `description` | TEXT | | Descripción detallada del servicio |
| `base_price` | DECIMAL(10,2) | NOT NULL | Precio base del servicio |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Moneda (USD, CRC) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Servicio disponible o no |
| `created_date` | DATETIME | DEFAULT NOW() | Fecha de creación |

**Índices:**
```sql
INDEX idx_provider_id (provider_id)
INDEX idx_service_type (service_type)
INDEX idx_is_active (is_active)
```

---

### 3. TABLA: `Vouchers` (Tickets Electrónicos) ⭐ PRINCIPAL
**Propósito:** Almacenar cada voucher generado con su consecutivo único y estado. Incluye datos de huésped para impresión.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `voucher_id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `consecutive_number` | VARCHAR(20) | UNIQUE, NOT NULL | Número consecutivo único (ej: "VCH-2026-001001") |
| `provider_id` | INT | FK → Providers | Proveedor asignado |
| `service_id` | INT | FK → Services | Servicio específico |
| `room_number` | VARCHAR(10) | NOT NULL | Número de habitación del huésped |
| `guest_name` | VARCHAR(150) | NOT NULL | Nombre completo del huésped |
| `guest_photo_url` | VARCHAR(255) | NOT NULL | Ruta de foto del huésped (subida) |
| `qr_code_data` | VARCHAR(500) | GENERATED | QR code con: voucher_id + consecutive_number |
| `assigned_date` | DATETIME | DEFAULT NOW() | Fecha de asignación |
| `assigned_by` | VARCHAR(100) | NOT NULL | Usuario que asignó |
| `status` | ENUM | DEFAULT 'PENDING' | Estados: PENDING, ISSUED, INVOICED, PAID, CANCELLED |
| `property_name` | VARCHAR(100) | NOT NULL | Propiedad (Corcovado, Ojochal, etc.) |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Precio acordado para este voucher |
| `quantity` | INT | DEFAULT 1 | Cantidad de servicios |
| `total_amount` | DECIMAL(10,2) | GENERATED | (unit_price × quantity) |
| `pdf_generated` | BOOLEAN | DEFAULT FALSE | ¿Se generó el PDF? |
| `pdf_url` | VARCHAR(255) | | URL del PDF generado |
| `notes` | TEXT | | Notas adicionales |
| `created_date` | DATETIME | DEFAULT NOW() | Creación |
| `updated_date` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Última actualización |

**Índices:**
```sql
INDEX idx_consecutive_number (consecutive_number)
INDEX idx_provider_id (provider_id)
INDEX idx_status (status)
INDEX idx_assigned_date (assigned_date)
UNIQUE INDEX idx_unique_voucher (consecutive_number)
```

---

### 4. TABLA: `VoucherUsage` (Registro de Uso del Voucher)
**Propósito:** Registrar cuándo y dónde se usó cada voucher en facturación.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `usage_id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `voucher_id` | INT | FK → Vouchers | Voucher usado |
| `invoice_number` | VARCHAR(50) | NOT NULL | Número de factura (de QuickBooks u otro) |
| `front_desk_user` | VARCHAR(100) | NOT NULL | Usuario del Front Desk que lo usó |
| `usage_date` | DATETIME | DEFAULT NOW() | Cuándo se facturó |
| `guest_name` | VARCHAR(150) | | Nombre del huésped |
| `guest_room` | VARCHAR(10) | | Número de habitación |
| `invoice_amount` | DECIMAL(10,2) | NOT NULL | Monto en la factura |
| `status` | ENUM | DEFAULT 'PENDING' | 'PENDING', 'VALIDATED', 'REJECTED', 'UNDER_REVIEW' |
| `created_date` | DATETIME | DEFAULT NOW() | Registro creado |

**Índices:**
```sql
INDEX idx_voucher_id (voucher_id)
INDEX idx_invoice_number (invoice_number)
INDEX idx_usage_date (usage_date)
INDEX idx_status (status)
```

---

### 5. TABLA: `AuditLog` (Validación de Auditores)
**Propósito:** Registro de auditoría donde los auditores validan o rechazan cargos.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `audit_id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `voucher_usage_id` | INT | FK → VoucherUsage | Registro de uso auditado |
| `auditor_name` | VARCHAR(100) | NOT NULL | Auditor que valida |
| `validation_status` | ENUM | NOT NULL | 'APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION' |
| `findings` | TEXT | | Observaciones del auditor |
| `audit_date` | DATETIME | DEFAULT NOW() | Fecha de auditoría |
| `evidence_notes` | TEXT | | Referencias a documentos o evidencia |
| `created_date` | DATETIME | DEFAULT NOW() | Creación del registro |

**Índices:**
```sql
INDEX idx_voucher_usage_id (voucher_usage_id)
INDEX idx_auditor_name (auditor_name)
INDEX idx_validation_status (validation_status)
INDEX idx_audit_date (audit_date)
```

---

### 6. TABLA: `PricingHistory` (Historial de Precios)
**Propósito:** Mantener histórico de cambios de precios por servicio.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `price_history_id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `service_id` | INT | FK → Services | Servicio cuyo precio cambió |
| `old_price` | DECIMAL(10,2) | | Precio anterior |
| `new_price` | DECIMAL(10,2) | NOT NULL | Precio nuevo |
| `effective_date` | DATE | NOT NULL | Fecha efectiva del cambio |
| `changed_by` | VARCHAR(100) | NOT NULL | Usuario que hizo el cambio |
| `change_reason` | TEXT | | Motivo del cambio |
| `created_date` | DATETIME | DEFAULT NOW() | Cuando se registró |

**Índices:**
```sql
INDEX idx_service_id (service_id)
INDEX idx_effective_date (effective_date)
```

---

## 📊 DIAGRAMA DE RELACIONES

```
┌─────────────────────┐
│    Providers        │
├─────────────────────┤
│ provider_id (PK)    │
│ name                │
│ provider_type       │
│ contact_email       │
│ contact_phone       │
│ is_active           │
└──────────┬──────────┘
           │
           │ (1:N)
           ↓
┌─────────────────────────┐      ┌──────────────────┐
│     Services            │◄─────┤  PricingHistory  │
├─────────────────────────┤      ├──────────────────┤
│ service_id (PK)         │      │ price_history_id │
│ provider_id (FK)        │      │ service_id (FK)  │
│ service_name            │      │ old_price        │
│ service_type            │      │ new_price        │
│ base_price              │      │ effective_date   │
│ is_active               │      └──────────────────┘
└──────────┬──────────────┘
           │
           │ (1:N)
           ↓
┌─────────────────────────────────────┐
│        Vouchers ⭐                  │
├─────────────────────────────────────┤
│ voucher_id (PK)                     │
│ consecutive_number (UNIQUE)         │
│ provider_id (FK)                    │
│ service_id (FK)                     │
│ assigned_date                       │
│ assigned_by                         │
│ status                              │
│ unit_price                          │
│ total_amount                        │
└──────────┬──────────────────────────┘
           │
           │ (1:N)
           ↓
┌───────────────────────────────────────┐      ┌──────────────────────┐
│      VoucherUsage                     │◄─────┤    AuditLog          │
├───────────────────────────────────────┤      ├──────────────────────┤
│ usage_id (PK)                         │      │ audit_id (PK)        │
│ voucher_id (FK)                       │      │ voucher_usage_id(FK) │
│ invoice_number                        │      │ auditor_name         │
│ front_desk_user                       │      │ validation_status    │
│ usage_date                            │      │ findings             │
│ guest_name                            │      │ audit_date           │
│ invoice_amount                        │      └──────────────────────┘
│ status                                │
└───────────────────────────────────────┘
```

---

## 🔄 FLUJO DE PROCESOS

### 1️⃣ **ASIGNACIÓN DE VOUCHER** (Administrativo)
```
1. Admin crea/selecciona Proveedor
   ↓
2. Admin selecciona Servicio con precio
   ↓
3. Sistema genera Voucher con:
   - Número consecutivo automático (VCH-2026-001001)
   - Status: PENDING
   ↓
4. Voucher se asigna a Proveedor
   ↓
5. Se envía a Proveedor (email/físico)
```

### 2️⃣ **USO EN FACTURACIÓN** (Front Desk)
```
1. Proveedor entrega servicio
   ↓
2. Front Desk factura usando:
   - Número consecutivo del voucher
   - Monto acordado (del voucher)
   ↓
3. Se registra en VoucherUsage:
   - invoice_number (de QBO)
   - guest_name, room
   - status: PENDING
   ↓
4. Voucher status → INVOICED
```

### 3️⃣ **VALIDACIÓN POR AUDITOR** (Ingresos)
```
1. Auditor revisa VoucherUsage pendientes
   ↓
2. Valida:
   - ¿El voucher existe?
   - ¿El monto coincide?
   - ¿El proveedor está autorizado?
   ↓
3. Registra en AuditLog:
   - APPROVED / REJECTED
   - Notas de validación
   ↓
4. VoucherUsage status → VALIDATED/REJECTED
   ↓
5. Reporte a Contabilidad
```

---

## 📑 VISTAS/CONSULTAS PRINCIPALES

### Vista 1: Vouchers Pendientes de Usar
```sql
SELECT consecutive_number, provider_name, service_name, 
       unit_price, assigned_date
FROM Vouchers v
JOIN Providers p ON v.provider_id = p.provider_id
JOIN Services s ON v.service_id = s.service_id
WHERE v.status = 'PENDING'
ORDER BY assigned_date;
```

### Vista 2: Auditoría - Facturas Pendientes de Validar
```sql
SELECT vu.invoice_number, v.consecutive_number, 
       p.name as provider, vu.invoice_amount,
       vu.usage_date, vu.status
FROM VoucherUsage vu
JOIN Vouchers v ON vu.voucher_id = v.voucher_id
JOIN Providers p ON v.provider_id = p.provider_id
WHERE vu.status = 'PENDING'
ORDER BY vu.usage_date;
```

### Vista 3: Reporte de Auditoría
```sql
SELECT v.consecutive_number, p.name, vu.invoice_number,
       vu.invoice_amount, al.validation_status,
       al.auditor_name, al.audit_date, al.findings
FROM AuditLog al
JOIN VoucherUsage vu ON al.voucher_usage_id = vu.usage_id
JOIN Vouchers v ON vu.voucher_id = v.voucher_id
JOIN Providers p ON v.provider_id = p.provider_id
WHERE al.audit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY al.audit_date DESC;
```

---

## 🔐 REGLAS DE NEGOCIO Y VALIDACIONES

| Regla | Descripción | Tabla |
|-------|-------------|-------|
| **RN-001** | El número consecutivo debe ser único e irrepetible | Vouchers |
| **RN-002** | No se puede usar un voucher si su status ≠ ISSUED | VoucherUsage |
| **RN-003** | El monto facturado debe coincidir con unit_price del voucher ±5% | VoucherUsage |
| **RN-004** | Solo auditores pueden cambiar status en VoucherUsage | AuditLog |
| **RN-005** | No se puede eliminar un voucher; solo cancelar si status = PENDING | Vouchers |
| **RN-006** | Cambios de precio deben registrarse en PricingHistory | Services |
| **RN-007** | Un voucher solo puede facturarse UNA VEZ | VoucherUsage |
| **RN-008** | Los auditors deben dejar evidencia de validación | AuditLog |

---

## 📱 PANTALLAS/MÓDULOS NECESARIOS (Para Code)

### Módulo 1: ADMINISTRACIÓN
- [ ] ABM Proveedores (Create, Read, Update, Delete)
- [ ] ABM Servicios y Precios
- [ ] Generar Vouchers (con numeración automática)
- [ ] Consulta de Vouchers por estado
- [ ] Historial de Precios

### Módulo 2: FRONT DESK
- [ ] Búsqueda de Voucher por número consecutivo
- [ ] Registro de uso (facturación)
- [ ] Confirmación de monto antes de crear invoice
- [ ] Listado de vouchers usados en el día

### Módulo 1.5: GENERACIÓN DE VOUCHERS (NUEVO)
- [ ] Formulario para crear voucher:
  - Seleccionar Proveedor
  - Seleccionar Servicio
  - Ingresar Habitación
  - Ingresar Nombre Huésped
  - Email del huésped
  - Foto del huésped (upload)
  - Precio final
- [ ] **Generar PDF del voucher** (diseño profesional)
- [ ] **Enviar por email automático** al huésped
- [ ] Visualizar voucher en pantalla antes de enviar
- [ ] Descargar PDF para imprimir
- [ ] Generar QR del número de voucher

### Módulo 3: AUDITORÍA
- [ ] Dashboard de facturas pendientes validar
- [ ] Formulario de validación (approve/reject)
- [ ] Reporte de auditoría (Excel/PDF)
- [ ] Búsqueda histórica por rango de fechas
- [ ] Estadísticas de validación

### Módulo 4: REPORTES
- [ ] Reporte de Ingresos Validados vs Rechazados
- [ ] Reporte por Proveedor
- [ ] Reporte por Propiedad
- [ ] Reporte de Anomalías (montos inconsistentes)
- [ ] Trazabilidad completa de un voucher

---

## 🛠️ ESPECIFICACIONES TÉCNICAS

**Stack Recomendado:**
- Backend: FastAPI (Python) + PostgreSQL
- Frontend: Next.js 14 (React + TypeScript)
- Autenticación: JWT con roles (Admin, FrontDesk, Auditor)
- API REST con endpoints CRUD por tabla

**Base de Datos:**
- PostgreSQL (relacional, auditoría integrada)
- Backup automático diario

**Seguridad:**
- Cada usuario solo ve su módulo
- Auditoría completa en AuditLog
- No permitir cambios retroactivos sin trazabilidad

---

## 📌 NOTAS IMPORTANTES

1. **Numeración Consecutiva Indefinida:** Sistema genera automáticamente `VCH-{YEAR}-{AUTO_INCREMENT}` (ej: VCH-2026-001001, VCH-2026-001002)
2. **Área Remota:** La app debe funcionar offline/sincronizar después cuando hay conexión
3. **Validación en Tiempo Real:** Front Desk valida montos automáticamente
4. **Auditoría Completa:** Cada acción queda registrada con usuario y fecha
5. **Escalabilidad:** Diseño permite agregar nuevos tipos de servicios sin cambiar estructura

---

**Elaborado para:** The Costa Rica Collection  
**Propósito:** Sistema de Vouchers Electrónicos para Validación de Servicios  
**Fecha:** Junio 2026  
**Estado:** Listo para implementación en Claude Code
