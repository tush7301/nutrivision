
from typing import List, Dict, Any
import os
import google.generativeai as genai

from app.core.config import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            system_instruction = (
                "You are a helpful, encouraging, and knowledgeable nutrition coach named 'NutriVision Coach'. "
                "Your goal is to help users understand their dietary habits and achieve their health goals. "
                "ALWAYS format your responses using clear Markdown to make them easy to read. "
                "Use **bold** for key terms and numbers. "
                "Use bullet points for lists. MANDATORY: Put each bullet point on its own new line. "
                "Do not bunch text into a single paragraph. "
                "Keep paragraphs short and concise. "
                "Be friendly and empathetic."
            )
            self.model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=system_instruction)
            
    async def generate_dietary_analysis(self, meal_data: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
        """
        Generates personalized dietary advice based on the identified meal and user profile using Gemini.
        """
        if not self.api_key or not self.model:
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
        return (
            f"Analyze the nutritional value of {meal_data.get('food_name')} "
            f"(estimated {meal_data.get('portion_size')}, {meal_data.get('calories', 'unknown')} kcal). "
            f"The user's goal is {user_profile.get('goal', 'health maintenance')}. "
            "Provide brief, actionable advice."
        )

    async def generate_chat_response(self, history: List[Dict[str, str]], message: str, context: str = "") -> str:
        """
        Generates a chat response using Gemini, maintaining conversation history.
        """
        if not self.api_key or not self.model:
            return "I'm sorry, I cannot chat right now because the API key is missing."

        try:
            # Convert internal history format to Gemini format
            gemini_history = []
            for msg in history:
                role = 'user' if msg['role'] == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg['text']]})
            
            chat = self.model.start_chat(history=gemini_history)
            
            # Prepend context to the message so the model knows the current state
            full_message = f"{context}\n\nUser Question: {message}" if context else message
            
            response = await chat.send_message_async(full_message)
            return response.text
        except Exception as e:
            return f"Error communicating with AI Coach: {str(e)}"

llm_service = LLMService()
