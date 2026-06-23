from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    database_url: str = "postgresql://voucher_user:voucher_pass@localhost:5432/vouchers_db"
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    api_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    upload_dir: str = "uploads/voucher-photos"
    pdf_dir: str = "uploads/vouchers-pdf"
    max_file_size: int = 5242880

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.pdf_dir).mkdir(parents=True, exist_ok=True)
