from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriVision"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:80"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./nutrivision.db"
    
    # APIs
    USDA_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    
    # Security
    SECRET_KEY: str = "your_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Model Paths
    MODEL_PATH: str = "models/food_classifier.pth"

    GOOGLE_CLIENT_ID: str | None = Field(default=None, alias="vite_google_client_id")

    GCP_PROJECT_ID: str | None = Field(default=None, alias="vite_gcp_project_id")
    GCP_LOCATION: str | None = Field(default=None, alias="vite_gcp_location")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
