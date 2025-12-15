from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from pydantic import BaseModel
from typing import List, Dict

from app.services.llm_service import llm_service
from app.db.base import get_db
from app.models.meal import Meal

from app.api.deps import get_current_user
from app.models.user import User

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
        today = date.today()
        # Filter where created_at date equals today
        # Note: created_at is datetime, so we need to filter carefully or fetch recent and filter in python
        # Simple approach: fetch last 50 and filter in python
        recent_meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.created_at.desc()).limit(50).all()
        
        todays_meals = [m for m in recent_meals if m.created_at.date() == today]
        total_calories = sum(m.calories for m in todays_meals)
        
        meal_summary = ", ".join([f"{m.food_name} ({m.calories} kcal)" for m in todays_meals])
        
        last_meal = recent_meals[0] if recent_meals else None
        last_meal_info = "None"
        if last_meal:
            last_meal_info = f"{last_meal.food_name} ({last_meal.calories} kcal) on {last_meal.created_at.strftime('%Y-%m-%d %H:%M')}"
        
        context = (
            f"Context: Today is {today}. "
            f"The user has consumed {total_calories} kcal today. "
            f"Daily goal is 2000 kcal. "
            f"Meals eaten today: {meal_summary if meal_summary else 'None yet'}. "
            f"Last recorded meal: {last_meal_info}."
        )

        response = await llm_service.generate_chat_response(request.history, request.message, context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
