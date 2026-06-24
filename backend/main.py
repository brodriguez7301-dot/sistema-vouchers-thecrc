from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import Base, engine
from config import settings
from api import auth, providers, services, vouchers, voucher_usage, audit, reports

Base.metadata.create_all(bind=engine)

# Migrations — add columns introduced after initial deploy
_sql = __import__("sqlalchemy").text
with engine.connect() as conn:
    for stmt in [
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS service_date DATE",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS sales_channel VARCHAR(50)",
        "ALTER TABLE vouchers ALTER COLUMN provider_id DROP NOT NULL",
        "ALTER TABLE vouchers ALTER COLUMN guest_photo_url DROP NOT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_code VARCHAR(20)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(50)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_agency_shared NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_agency_private NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_direct_shared NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_direct_private NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_web NUMERIC(10,2)",
        "ALTER TABLE services ALTER COLUMN provider_id DROP NOT NULL",
        "ALTER TABLE services ALTER COLUMN base_price DROP NOT NULL",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS guest_price NUMERIC(10,2)",
    ]:
        try:
            conn.execute(_sql(stmt))
        except Exception:
            pass
    conn.commit()

app = FastAPI(title="Sistema de Vouchers Electrónicos", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded photos and PDFs
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.pdf_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(providers.router)
app.include_router(services.router)
app.include_router(vouchers.router)
app.include_router(voucher_usage.router)
app.include_router(audit.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Sistema de Vouchers API", "docs": "/docs"}


@app.on_event("startup")
def seed_admin():
    from database import SessionLocal
    from crud import get_user_by_email, create_user
    from schemas import UserCreate
    from api.auth import hash_password
    import bcrypt as _bcrypt  # suppress passlib warning

    db = SessionLocal()
    try:
        if not get_user_by_email(db, "admin@thecrc.com"):
            create_user(db, UserCreate(
                email="admin@thecrc.com",
                name="Administrador",
                password="Admin2026!",
                role="admin",
            ), hash_password("Admin2026!"))
            print("✓ Admin user created: admin@thecrc.com / Admin2026!")
    except Exception as e:
        print(f"Seed warning: {e}")
    finally:
        db.close()
