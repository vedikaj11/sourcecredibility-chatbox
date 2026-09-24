import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(question: str, fact_check_context: str = "") -> dict:
   
    prompt = f"""
You are the AI assistant inside TruthLens, a news and
fact-checking application.

Your job is to help users understand a fact-check and its sources.

Important rules:
- Give clear and simple explanations.
- Do not claim that something is true or false without evidence.
- If information is uncertain, clearly say so.
- Use the provided fact-check context when answering.
- If current or additional information is needed, use Google Search.
- Do not invent sources or facts.

FACT-CHECK CONTEXT:
{fact_check_context}

USER QUESTION:
{question}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(),
        )

        return {
            "success": True,
            "answer": response.text,
        }

    except Exception as error:
        return {
            "success": False,
            "answer": "Sorry, I couldn't process your question right now.",
            "error": str(error),
        }