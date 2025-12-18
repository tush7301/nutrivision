from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MealBase(BaseModel):
    food_name: str
    portion_size: str
    calories: float
    protein: float
    carbs: float
    fats: float
    analysis_text: Optional[str] = None

class MealCreate(MealBase):
    image_path: Optional[str] = None
    confidence: float

class Meal(MealBase):
    id: int
    user_id: int
    created_at: datetime
    image_path: Optional[str] = None
    confidence: float

    class Config:
        orm_mode = True

class AnalysisResponse(BaseModel):
    meal: Optional[Meal] = None
    advice: str
    is_food: bool = True
