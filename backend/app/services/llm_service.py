import asyncio
from typing import List, Dict, Any
from google import genai
from google.genai import errors, types
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.generation_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level=settings.GEMINI_THINKING_LEVEL)
        )
        self.client = None

        if self.api_key:
            try:
                # Works with both standard (AIza…) and auth (AQ.…) Gemini API keys
                self.client = genai.Client(
                    api_key=self.api_key,
                    http_options=types.HttpOptions(timeout=int(settings.GEMINI_TIMEOUT_S * 1000)),
                )
            except Exception as e:
                print(f"WARNING: Gemini AI init failed: {e}. Falling back to mock.")
                self.client = None
        else:
            print("WARNING: No GEMINI_API_KEY found. Falling back to mock.")

    async def generate_dietary_analysis(self, meal_data: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
        """
        Generates personalized dietary advice based on the identified meal and user profile using Gemini.
        """
        if not self.client:
            return (
                "AI Analysis (Mock - Gemini): Based on your meal of "
                f"{meal_data.get('food_name', 'unknown food')}, here are some insights. "
                "Ensure you balance your macros! (Configure GEMINI_API_KEY for real insights)"
            )
            
        prompt = self._construct_prompt(meal_data, user_profile)
        
        try:
            return await self._generate(prompt)
        except Exception as e:
            print(f"Gemini analysis failed: {type(e).__name__}: {str(e)[:300]}")
            return "Coaching tips aren't available right now. Your meal and its nutrition were still logged."

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
        if not self.client:
            return "I'm sorry, I cannot chat right now because the API key is missing."

        try:
            # Convert internal history format to Gemini SDK format
            # Internal: {'role': 'user'|'assistant', 'text': '...'}
            # Gemini SDK: Content(role='user'|'model', parts=[Part(text='...')])
            gemini_history = [
                types.Content(
                    role='user' if msg['role'] == 'user' else 'model',
                    parts=[types.Part(text=msg["text"])],
                )
                for msg in history
            ]

            # Prepend context to the message so the model knows the current state
            full_message = f"{context}\n\nUser Question: {message}" if context else message
            gemini_history.append(types.Content(role='user', parts=[types.Part(text=full_message)]))

            return await self._generate(gemini_history)
        except Exception as e:
            print(f"Gemini chat failed: {type(e).__name__}: {str(e)[:300]}")
            return "Sorry, the coach can't respond right now. Please try again in a minute."

    async def _generate(self, contents) -> str:
        """
        Calls the primary model, then the fallback model once if Google reports the primary
        overloaded (5xx) or it times out. Each attempt is capped so a scan can't stall.
        """
        attempts = [(self.model_name, self.generation_config)]
        if settings.GEMINI_FALLBACK_MODEL:
            # The fallback runs with its default thinking settings, which differ by model family
            attempts.append((settings.GEMINI_FALLBACK_MODEL, None))

        last_error = None
        for model, config in attempts:
            try:
                response = await asyncio.wait_for(
                    self.client.aio.models.generate_content(model=model, contents=contents, config=config),
                    settings.GEMINI_TIMEOUT_S,
                )
                return response.text
            except (errors.ServerError, asyncio.TimeoutError) as e:
                print(f"Gemini model {model} unavailable: {type(e).__name__}: {str(e)[:200]}")
                last_error = e
        raise last_error

llm_service = LLMService()
