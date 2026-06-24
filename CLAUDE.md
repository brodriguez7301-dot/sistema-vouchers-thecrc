# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project identity

Sistema de Vouchers Electrónicos for **The Costa Rica Collection** (4 hotel properties: Corcovado Wilderness Lodge, Ojochal Garden, Amarena Canvas Beach Hotel, Oxigen).

| | |
|---|---|
| **Frontend (prod)** | `https://sistema-vouchers-thecrc.vercel.app` |
| **Backend (prod)** | `https://vouchers-api-production-d78f.up.railway.app` |
| **GitHub** | `https://github.com/brodriguez7301-dot/sistema-vouchers-thecrc` |
| **Default admin** | `admin@thecrc.com` / `Admin2026!` |

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # http://localhost:8000  docs at /docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev                        # http://localhost:3000
npm run build                      # production build + type check
npm run lint
```

### Deploy to production
```bash
# Backend → Railway (must be linked to sistema-vouchers project)
cd backend
railway link --project sistema-vouchers
railway up --service vouchers-api --detach

# Frontend → Vercel
cd frontend
npx vercel --prod
```

## Architecture

### Backend (`backend/`)

Synchronous FastAPI + SQLAlchemy. Single `main.py` entry point that:
1. Runs raw `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations at startup (no Alembic) — **all schema changes must be added to this block**.
2. Seeds the default admin user on first boot.
3. Registers all routers.

Key files:
- `models.py` — all ORM models (Provider, Service, Voucher, VoucherScan, VoucherUsage, AuditLog, User, PricingHistory)
- `schemas.py` — Pydantic request/response models. `VoucherOut` is the main response shape used everywhere.
- `crud.py` — all DB queries; routers should call crud, not query the DB directly.
- `config.py` — settings loaded from `.env` via `pydantic-settings`.
- `database.py` — SQLAlchemy engine + `get_db()` dependency.
- `api/public.py` — unauthenticated endpoints (QR scan log, provider confirmation). No `get_current_user` dependency here.

Router prefix convention: all routes are prefixed `/api/...`.

### Frontend (`frontend/`)

Next.js 14 App Router. All pages are client components (`"use client"`).

Key files:
- `lib/api.ts` — single `api` object with all backend calls. Uses `NEXT_PUBLIC_API_URL` env var; falls back to `http://localhost:8000`. Strips BOM from the URL.
- `lib/auth.ts` — token stored in `localStorage` as `voucher_token`; user object as `voucher_user`.
- `lib/types.ts` — all TypeScript interfaces. The `Voucher` interface is the central type.
- `components/AppShell.tsx` — wraps every protected page; checks stored user, redirects to `/login` if missing. Accepts `roles?: string[]` to restrict access by role.

Route layout:
- `/login` — public
- `/v/[consecutive]` — public (provider QR page, no AppShell)
- `/admin/*` — admin role (vouchers, auditoria, cuentas-por-pagar, provisiones, providers, services, precios)
- `/front-desk` — front_desk role
- `/audit` — auditor role
- `/reports` — admin role

### Dual pricing model

Every `Voucher` has two prices:
- `unit_price` — what the provider charges (manually entered, editable)
- `guest_price` — what the guest is charged (auto-filled from the service tariff + sales channel)

The `Service` model has 5 channel prices: `price_agency_shared`, `price_agency_private`, `price_direct_shared`, `price_direct_private`, `price_web`. The helper `getServiceChannels()` in `lib/types.ts` returns only the channels with a price > 0.

### Audit workflow

`audit_status` on `Voucher` is `VARCHAR(20)` — **not** a PostgreSQL ENUM. Values: `PENDIENTE`, `APROBADO`, `EN_DISPUTA`. Python-side validation is done via Pydantic's `AuditStatus` enum in `schemas.py`.

### Provider confirmation via QR

When a PDF voucher is generated, the QR encodes `https://sistema-vouchers-thecrc.vercel.app/v/{consecutive_number}`. The public page at `/v/[consecutive]` logs every scan (`VoucherScan`) and lets the provider tap "Confirmar recepción", which calls `POST /api/public/voucher/{consecutive}/confirm`. This sets `provider_confirmed = true` and `provider_confirmed_at` on the voucher. The endpoint is idempotent (won't overwrite the timestamp if called again).

### PDF generation

`utils/pdf_generator.py` uses ReportLab to generate an A5-landscape PDF. Generated files are stored in `uploads/vouchers-pdf/` and served at `/uploads/...` via FastAPI `StaticFiles`. The `generate_consecutive_number()` helper in `utils/helpers.py` produces `VCH-YYYY-NNNNNN` format.

## Environment variables

Backend `.env`:
```
DATABASE_URL=postgresql://voucher_user:voucher_pass@localhost:5432/vouchers_db
SECRET_KEY=<jwt-secret>
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key constraints

- **No Alembic** — add every new column as a raw SQL statement in the migration block in `main.py`. Use `IF NOT EXISTS` / `IF EXISTS` to make it idempotent.
- **No PostgreSQL ENUMs** — use `VARCHAR` columns for status fields to avoid migration pain. Enum validation lives in Pydantic only.
- `provider_id` is nullable on `Voucher` (null = in-house CWL service). Check `VoucherOut.provider_id: Optional[int]`.
- The frontend `AppShell` auto-logs in as admin if no token is found — **development convenience only**; change for multi-tenant deployment.
- Railway CLI must be linked to `sistema-vouchers` project (not `luz-de-monos-backend`). Run `railway status` to verify before deploying.
