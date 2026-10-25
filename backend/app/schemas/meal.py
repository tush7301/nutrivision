from pydantic import BaseModel, Field
from typing import List, Optional
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
        from_attributes = True

class Candidate(BaseModel):
    food: str
    confidence: float

class AnalysisResponse(BaseModel):
    meal: Optional[Meal] = None
    advice: str
    is_food: bool = True
    candidates: List[Candidate] = []

class MealUpdate(BaseModel):
    food_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    weight_g: Optional[float] = Field(default=None, gt=0, le=5000)
