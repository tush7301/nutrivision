import httpx
import os
from typing import Optional, Dict, Any

class USDAClient:
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("USDA_API_KEY")
        # We don't raise error immediately to allow instantiation without key if not used
        
    async def search_foods(self, query: str, page_size: int = 5) -> Dict[str, Any]:
        if not self.api_key:
             raise ValueError("USDA_API_KEY is not set")
             
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/foods/search",
                params={"api_key": self.api_key, "query": query, "pageSize": page_size}
            )
            response.raise_for_status()
            return response.json()

    async def get_food_details(self, fdc_id: str) -> Dict[str, Any]:
        if not self.api_key:
             raise ValueError("USDA_API_KEY is not set")
             
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/food/{fdc_id}",
                params={"api_key": self.api_key}
            )
            response.raise_for_status()
            return response.json()
