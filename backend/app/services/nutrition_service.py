import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class NutritionService:
    def __init__(self):
        self.api_key = settings.USDA_API_KEY
        self.base_url = "https://api.nal.usda.gov/fdc/v1"
        
    async def get_nutrition_info(self, query: str, strict: bool = False) -> Optional[Dict[str, float]]:
        """
        Searches USDA database for food item and returns basic macros (per 100g).
        With strict=True, returns None instead of mock data when the food isn't found.
        """
        if not self.api_key:
            print("Warning: No USDA_API_KEY found. Returning mock data.")
            return self._get_mock_nutrition()

        async with httpx.AsyncClient() as client:
            try:
                # 1. Search for the food (POST: the GET form with dataType intermittently returns 400)
                search_body = {
                    "query": query,
                    "pageSize": 1,
                    "dataType": ["Foundation", "Survey (FNDDS)", "Branded"]
                }
                response = await client.post(
                    f"{self.base_url}/foods/search",
                    params={"api_key": self.api_key},
                    json=search_body,
                    timeout=15,
                )
                response.raise_for_status()
                data = response.json()
                
                if not data.get("foods"):
                    return None if strict else self._get_mock_nutrition()
                
                food_item = data["foods"][0]
                
                # 2. Extract Nutrients (Standardized IDs)
                # 208: Energy (kcal)
                # 203: Protein (g)
                # 205: Carbohydrate (g)
                # 204: Total Lipid/Fat (g)
                nutrients = {n["nutrientId"]: n["value"] for n in food_item.get("foodNutrients", [])}
                
                return {
                    "calories": nutrients.get(1008, nutrients.get(208, 0.0)), # Energy
                    "protein": nutrients.get(1003, nutrients.get(203, 0.0)),
                    "carbs": nutrients.get(1005, nutrients.get(205, 0.0)),
                    "fats": nutrients.get(1004, nutrients.get(204, 0.0))
                }
                
            except httpx.HTTPStatusError as e:
                # Don't log the request URL: it carries the API key
                print(f"USDA API Error: HTTP {e.response.status_code} for query {query!r}")
                return None if strict else self._get_mock_nutrition()
            except Exception as e:
                print(f"USDA API Error: {type(e).__name__} for query {query!r}")
                return None if strict else self._get_mock_nutrition()

    @staticmethod
    def scale(per_100g: Dict[str, float], grams: float) -> Dict[str, float]:
        """Scales per-100g macros to the given portion weight."""
        factor = grams / 100.0
        return {k: round(v * factor, 1) for k, v in per_100g.items()}

    def _get_mock_nutrition(self) -> Dict[str, float]:
        return {
            "calories": 250.0,
            "protein": 10.0,
            "carbs": 30.0,
            "fats": 10.0
        }

nutrition_service = NutritionService()
