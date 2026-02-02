from typing import List, Dict, Any
import google.generativeai as genai
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-2.5-pro")
            except Exception as e:
                print(f"WARNING: Gemini AI init failed: {e}. Falling back to mock.")
                self.model = None
        else:
            print("WARNING: No GEMINI_API_KEY found. Falling back to mock.")

    async def generate_dietary_analysis(self, meal_data: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
        """
        Generates personalized dietary advice based on the identified meal and user profile using Gemini.
        """
        if not self.model:
            return (
                "AI Analysis (Mock - Gemini): Based on your meal of "
                f"{meal_data.get('food_name', 'unknown food')}, here are some insights. "
                "Ensure you balance your macros! (Configure GEMINI_API_KEY for real insights)"
            )
            
        prompt = self._construct_prompt(meal_data, user_profile)
        
        try:
            # Gemini async generation
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            return f"Error generating analysis with Gemini: {str(e)}"

    def _construct_prompt(self, meal_data: Dict, user_profile: Dict) -> str:
        base_prompt = (
            f"Analyze the nutritional value of {meal_data.get('food_name')} "
            f"(estimated {meal_data.get('portion_size')}, {meal_data.get('calories', 'unknown')} kcal). "
            f"The user's goal is {user_profile.get('goal', 'health maintenance')}. "
        )
        
        # Add probabilistic context if available
        if meal_data.get("candidates") and len(meal_data["candidates"]) > 1:
            candidates_str = ", ".join([f"{c['food']} ({c['confidence']:.1%})" for c in meal_data["candidates"]])
            base_prompt += (
                f"\n\nCONTEXT: The vision model identified the following likely foods: {candidates_str}. "
                f"The primary prediction is {meal_data.get('food_name')}, but if the others seem more likely based on "
                "typical portion sizes or visual context you might infer, please mention that ambiguity. "
                "However, focus your advice on the primary prediction unless you are unsure."
            )

        # Multilingual Support
        language = user_profile.get('language', 'en')
        base_prompt += f"\n\nIMPORTANT: Respond in the user's preferred language: {language}. localize the response appropriately."
        
        base_prompt += "\nProvide brief, actionable advice."
        return base_prompt

    async def generate_chat_response(self, history: List[Dict[str, str]], message: str, context: str = "") -> str:
        """
        Generates a chat response using Gemini, maintaining conversation history.
        """
        if not self.model:
            return "I'm sorry, I cannot chat right now because the API key is missing."

        try:
            # Convert internal history format to Gemini SDK format
            # Internal: {'role': 'user'|'assistant', 'text': '...'}
            # Gemini SDK: [{'role': 'user'|'model', 'parts': ['...']}]
            gemini_history = []
            for msg in history:
                role = 'user' if msg['role'] == 'user' else 'model'
                gemini_history.append({
                    "role": role,
                    "parts": [msg["text"]]
                })
            
            chat = self.model.start_chat(history=gemini_history)
            
            # Prepend context to the message so the model knows the current state
            full_message = f"{context}\n\nUser Question: {message}" if context else message
            
            response = await chat.send_message_async(full_message)
            return response.text
        except Exception as e:
            return f"Error communicating with AI Coach: {str(e)}"

llm_service = LLMService()
