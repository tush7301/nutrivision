from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services.stats_service import stats_service
from app.models.meal import Meal

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

from pydantic import BaseModel

from typing import Optional

class UserUpdate(BaseModel):
    language: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[int] = None
    height: Optional[int] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

def calculate_targets(user: User):
    # Mifflin-St Jeor Equation
    if not (user.weight and user.height and user.age and user.gender):
        return # Cannot calculate
    
    # BMR
    # Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    # Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age)
    if (user.gender or '').lower() == 'male':
        bmr += 5
    else:
        bmr -= 161
        
    # Activity Multiplier
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    tdee = bmr * multipliers.get(user.activity_level, 1.2)
    
    # Goal Adjustment
    adjustments = {
        "lose": -500,
        "maintain": 0,
        "gain": 300,
        "build_muscle": 200
    }
    target_cals = int(tdee + adjustments.get(user.goal, 0))
    
    # Macros (Simple split: 30% P / 35% F / 35% C)
    # 1g Protein = 4 cal, 1g Fat = 9 cal, 1g Carb = 4 cal
    user.target_calories = target_cals
    user.target_protein = int((target_cals * 0.3) / 4)
    user.target_fat = int((target_cals * 0.35) / 9)
    user.target_carbs = int((target_cals * 0.35) / 4)

@router.put("/me")
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Recalculate if physio data changed
    if any(k in update_data for k in ['weight', 'height', 'age', 'gender', 'activity_level', 'goal']):
        calculate_targets(current_user)
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch recent history
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.created_at.asc()).all()
    meal_dicts = [{"date": m.created_at, "calories": m.calories} for m in meals]
    
    trends = stats_service.analyze_trends(meal_dicts)
    return trends
