from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
import re
import uuid
from pathlib import Path

from app.db.base import get_db
from app.services.vision_service import vision_service
from app.services.llm_service import llm_service
from app.models.meal import Meal
from app.schemas.meal import AnalysisResponse, Meal as MealSchema, MealUpdate

from app.api.deps import get_current_user
from app.models.user import User
from app.services.nutrition_service import nutrition_service

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def _coaching_profile(user: User) -> dict:
    # Mock user profile (augmented with real User data)
    return {
        "goal": "lose weight",
        "preferences": "low carb",
        "language": user.language or "en"
    }


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
        
        # Gatekeeper Check
        if not prediction.get("is_food", True):
             return {
                 "meal": None, 
                 "advice": "This image does not appear to be food. Please upload a photo of a meal.",
                 "is_food": False
             }
             
        portion = await vision_service.estimate_portion(contents, prediction["food_name"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")
    
    # 2. Nutrition Lookup (USDA values are per 100g, so scale to the estimated portion)
    nutrition_per_100g = await nutrition_service.get_nutrition_info(prediction["food_name"])
    nutrition_info = nutrition_service.scale(nutrition_per_100g, portion["estimated_weight_g"])
    
    meal_data = {
        **prediction,
        **portion,
        **nutrition_info
    }
    
    # 3. LLM Coaching
    advice = await llm_service.generate_dietary_analysis(meal_data, _coaching_profile(current_user))
    
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
    
    candidates = [
        {"food": c["food"], "confidence": c["confidence"]}
        for c in prediction.get("candidates", [])
    ]
    return {"meal": db_meal, "advice": advice, "is_food": True, "candidates": candidates}


def _portion_grams(portion_size: str) -> float | None:
    """Reads the gram weight out of a stored portion label like "300g" or "standard (300g)"."""
    match = re.search(r"(\d+(?:\.\d+)?)\s*g\b", portion_size or "")
    return float(match.group(1)) if match else None


def _get_owned_meal(meal_id: int, db: Session, user: User) -> Meal:
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.patch("/{meal_id}", response_model=AnalysisResponse)
async def update_meal(
    meal_id: int,
    update: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Corrects a logged meal: a different food, a different portion weight, or both."""
    meal = _get_owned_meal(meal_id, db, current_user)
    current_grams = _portion_grams(meal.portion_size)
    grams = update.weight_g or current_grams
    food_changed = bool(update.food_name) and update.food_name.strip().lower() != (meal.food_name or "").lower()

    if food_changed:
        if grams is None:
            grams = 100.0
        food_name = update.food_name.strip()
        per_100g = await nutrition_service.get_nutrition_info(food_name, strict=True)
        if per_100g is None:
            raise HTTPException(
                status_code=404,
                detail=f"Couldn't find \"{food_name}\" in the USDA food database. Try a more common name.",
            )
        macros = nutrition_service.scale(per_100g, grams)
        meal.food_name = food_name
    elif update.weight_g and current_grams:
        # Same food, new portion: macros scale linearly with weight
        ratio = update.weight_g / current_grams
        macros = {k: round(getattr(meal, k) * ratio, 1) for k in ("calories", "protein", "carbs", "fats")}
    else:
        macros = None

    if macros is not None:
        for key, value in macros.items():
            setattr(meal, key, value)
    if grams is not None:
        meal.portion_size = f"{round(grams)}g"

    if food_changed:
        meal_data = {
            "food_name": meal.food_name,
            "portion_size": meal.portion_size,
            "calories": meal.calories,
        }
        meal.analysis_text = await llm_service.generate_dietary_analysis(meal_data, _coaching_profile(current_user))

    db.commit()
    db.refresh(meal)
    return {"meal": meal, "advice": meal.analysis_text or "", "is_food": True}


@router.delete("/{meal_id}", status_code=204)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meal = _get_owned_meal(meal_id, db, current_user)
    if meal.image_path:
        Path(meal.image_path).unlink(missing_ok=True)
    db.delete(meal)
    db.commit()

@router.get("/", response_model=List[MealSchema])
def get_meals(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.created_at.desc()).offset(skip).limit(limit).all()
    return meals
