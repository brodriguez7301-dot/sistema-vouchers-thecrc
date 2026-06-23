# Sistema de Vouchers Electrónicos
### The Costa Rica Collection

---

## Arranque rápido

### 1. Base de datos
Crea una base de datos PostgreSQL llamada `vouchers_db`:
```sql
CREATE DATABASE vouchers_db;
CREATE USER voucher_user WITH PASSWORD 'voucher_pass';
GRANT ALL PRIVILEGES ON DATABASE vouchers_db TO voucher_user;
```

### 2. Backend
```bash
cd backend
copy .env.example .env   # edita las credenciales
pip install -r requirements.txt
uvicorn main:app --reload
# → API en http://localhost:8000
# → Docs en http://localhost:8000/docs
```

**Usuario admin por defecto:**
- Email: `admin@thecrc.com`
- Password: `Admin2026!`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin` | Dashboard, Proveedores, Servicios, Vouchers, Reportes |
| `front_desk` | Buscar y registrar uso de vouchers |
| `auditor` | Validar facturas, reportes |

Crear usuarios adicionales via API: `POST /api/auth/register`

---

## Flujo de trabajo

```
Admin → Crea proveedor + servicio
      → Crea voucher (foto + precio)
      → Genera PDF → Imprime / envía al proveedor
      → Emite voucher (status: ISSUED)

Front Desk → Busca voucher por número (VCH-2026-001001)
           → Registra uso: número de factura + monto (±5%)

Auditor → Revisa facturas pendientes
        → Aprueba o rechaza con hallazgos

Gerencia → Ve reportes: ingresos, por proveedor, anomalías
         → Trazabilidad completa de cualquier voucher
```

---

## API Docs
Con el backend corriendo: [http://localhost:8000/docs](http://localhost:8000/docs)
