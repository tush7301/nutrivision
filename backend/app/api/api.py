from fastapi import APIRouter
from app.api.endpoints import meals, users, chat

api_router = APIRouter()
api_router.include_router(meals.router, prefix="/meals", tags=["meals"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
