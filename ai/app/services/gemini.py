import os
import logging
from google import genai

logger = logging.getLogger("skillbridge-ai")

class GeminiModelWrapper:
    """Wrapper class providing generate_content method around Google GenAI client."""
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set in the environment.")
            self.client = genai.Client()

    def generate_content(self, prompt: str):
        return self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

def get_gemini_model():
    return GeminiModelWrapper()
