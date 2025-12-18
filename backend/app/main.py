import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.db.base import Base, engine
from app.models.user import User
from app.models.meal import Meal
# from app.models.chat import ChatMessager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NutriVision API", version="0.1.0")

from app.core.config import settings

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to NutriVision API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
