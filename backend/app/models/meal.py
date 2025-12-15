from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # Placeholder for user auth
    image_path = Column(String, nullable=True) # Path to stored image
    food_name = Column(String)
    portion_size = Column(String) # e.g., "medium"
    
    # Nutrition info
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fats = Column(Float, default=0.0)
    
    confidence = Column(Float)
    analysis_text = Column(String) # LLM generated advice
    
    created_at = Column(DateTime, default=datetime.utcnow)
