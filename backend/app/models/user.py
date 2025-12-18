from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String, unique=True, index=True, nullable=False) # Google's unique user ID
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    language = Column(String, default="en") # en, es, hi, fr, etc.
    
    # Physiological Data
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True) # male, female
    weight = Column(Integer, nullable=True) # kg
    height = Column(Integer, nullable=True) # cm
    activity_level = Column(String, default="sedentary") # sedentary, light, moderate, active, very_active
    goal = Column(String, default="maintain") # lose, maintain, gain, build_muscle
    
    # Calculated Targets
    target_calories = Column(Integer, default=2000)
    target_protein = Column(Integer, default=150)
    target_fat = Column(Integer, default=70)
    target_carbs = Column(Integer, default=200)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships will be added to Meal/Chat models later
    # meals = relationship("Meal", back_populates="owner")
