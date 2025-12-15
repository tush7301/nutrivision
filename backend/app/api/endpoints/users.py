from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services.stats_service import stats_service
from app.models.meal import Meal

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

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
