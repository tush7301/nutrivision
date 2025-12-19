from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from zoneinfo import ZoneInfo

from app.db.base import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.llm_service import llm_service
from app.models.meal import Meal

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Fetch today's meals for context
        # Fetch today's meals for context
        # Use Eastern Time (ET) for "today"
        utc = ZoneInfo("UTC")
        et = ZoneInfo("America/New_York")
        now_et = datetime.now(et)
        today = now_et.date()
        
        recent_meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.created_at.desc()).limit(50).all()
        print(f"DEBUG: Found {len(recent_meals)} recent meals")
        
        todays_meals = []
        for m in recent_meals:
            # Convert stored UTC time to ET
            # Assuming m.created_at is naive UTC as per default SQLAlchemy behavior
            if m.created_at:
                created_at_utc = m.created_at.replace(tzinfo=utc)
                created_at_et = created_at_utc.astimezone(et)
                if created_at_et.date() == today:
                    todays_meals.append(m)
        total_calories = sum(m.calories for m in todays_meals)
        
        meal_summary = ", ".join([f"{m.food_name} ({m.calories} kcal)" for m in todays_meals])
        
        last_meal = recent_meals[0] if recent_meals else None
        last_meal_info = "None"
        if last_meal:
            last_meal_info = f"{last_meal.food_name} ({last_meal.calories} kcal) on {last_meal.created_at.strftime('%Y-%m-%d %H:%M')}"
        
        
        # Language mapping for clearer LLM instructions
        lang_map = {
            'en': 'English',
            'es': 'Spanish',
            'hi': 'Hindi',
            'fr': 'French',
            'de': 'German',
            'zh': 'Chinese',
            'ja': 'Japanese'
        }
        user_lang_code = current_user.language or 'en'
        user_lang_name = lang_map.get(user_lang_code, 'English')
        
        print(f"DEBUG: User language is {user_lang_code} ({user_lang_name})")

        target_cals = current_user.target_calories or 2000

        context = (
            f"Context: Today is {today}. "
            f"The user has consumed {total_calories} kcal today. "
            f"Daily goal is {target_cals} kcal. "
            f"Meals eaten today: {meal_summary if meal_summary else 'None yet'}. "
            f"Last recorded meal: {last_meal_info}. "
            f"SYSTEM INSTRUCTION: You represent NutriVision, an AI Nutrition Coach. "
            f"The user's preferred language is {user_lang_name}. "
            f"You MUST respond entirely in {user_lang_name}. "
            f"Do not respond in English unless the user asks you to switch languages."
        )

        response = await llm_service.generate_chat_response(request.history, request.message, context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
