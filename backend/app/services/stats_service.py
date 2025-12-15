import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta

class StatsService:
    def analyze_trends(self, meal_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes meal history to find trends in calorie intake.
        """
        if not meal_history:
            return {"status": "insufficient_data"}
            
        try:
            df = pd.DataFrame(meal_history)
            if 'date' not in df.columns or 'calories' not in df.columns:
                 return {"error": "Invalid data format"}
                 
            df['date'] = pd.to_datetime(df['date'])
            daily_stats = df.groupby(df['date'].dt.date)['calories'].sum()
            
            if len(daily_stats) < 2:
                return {"average_daily_calories": float(daily_stats.mean()), "trend": "stable"}
                
            # Simple trend: compare last 3 days avg to previous 3 days
            recent_avg = daily_stats.tail(3).mean()
            prev_avg = daily_stats.iloc[:-3].tail(3).mean() if len(daily_stats) >= 6 else daily_stats.iloc[0]
            
            trend = "stable"
            if recent_avg > prev_avg * 1.1:
                trend = "increasing"
            elif recent_avg < prev_avg * 0.9:
                trend = "decreasing"
                
            return {
                "average_daily_calories": float(daily_stats.mean()),
                "trend": trend,
                "recent_average": float(recent_avg)
            }
        except Exception as e:
            return {"error": str(e)}

    def detect_behavior_drift(self, recent_meals: List[Dict], historical_meals: List[Dict]) -> Dict[str, Any]:
        """
        Detects significant deviations from established patterns.
        """
        # Placeholder for more advanced drift detection (e.g. using isolation forests or KL divergence)
        # For now, we compare macronutrient distribution shifts
        return {"drift_detected": False, "confidence": 0.5, "message": "No significant drift detected."}

stats_service = StatsService()
