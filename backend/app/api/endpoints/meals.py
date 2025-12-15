from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
import shutil
import uuid
from pathlib import Path

from app.db.base import get_db
from app.services.vision_service import vision_service
from app.services.llm_service import llm_service
from app.models.meal import Meal
from app.schemas.meal import AnalysisResponse, Meal as MealSchema

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=AnalysisResponse)
async def upload_meal(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Save Image
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # 1. Vision Analysis
    try:
        prediction = await vision_service.predict_food(contents)
        portion = await vision_service.estimate_portion(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")
    
    # 2. Nutrition Lookup
    # Real implementation would query USDA API here based on prediction['food_name']
    # We'll use mock data for robustness in this demo
    nutrition_info = {
        "calories": 450.0 if portion['portion_size'] == "medium" else 250.0,
        "protein": 15.0,
        "carbs": 50.0,
        "fats": 20.0
    }
    
    meal_data = {
        **prediction,
        **portion,
        **nutrition_info
    }
    
    # 3. LLM Coaching
    # Mock user profile
    user_profile = {"goal": "lose weight", "preferences": "low carb"}
    advice = await llm_service.generate_dietary_analysis(meal_data, user_profile)
    
    # 4. Save to DB
    db_meal = Meal(
        user_id=current_user.id,
        image_path=str(file_path),
        food_name=meal_data["food_name"],
        portion_size=meal_data["portion_size"],
        calories=meal_data["calories"],
        protein=meal_data["protein"],
        carbs=meal_data["carbs"],
        fats=meal_data["fats"],
        confidence=meal_data["confidence"],
        analysis_text=advice
    )
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    
    return {"meal": db_meal, "advice": advice}

@router.get("/", response_model=List[MealSchema])
def get_meals(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.created_at.desc()).offset(skip).limit(limit).all()
    return meals
