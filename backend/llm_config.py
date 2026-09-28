import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
VECTORIZE_API_KEY = os.getenv("VECTORIZE_API_KEY")
VECTORIZE_API_ENDPOINT = os.getenv("VECTORIZE_API_ENDPOINT")

# OpenAI Supported Models for SEO Agent
OPENAI_MODELS = {
    "versatile": {
        "id": "gpt-4o",
        "context_window": 128000,
        "description": "Powerful model for complex SEO and coding tasks."
    },
    "fast": {
        "id": "gpt-4o-mini",
        "context_window": 128000,
        "description": "Used for quick log categorization, fast routing, and initial data formatting."
    },
    "powerful_reasoning": {
        "id": "gpt-4",
        "context_window": 8192,
        "description": "Flagship model with reasoning capabilities. Great for complex competitor analysis."
    },
    "general": {
        "id": "gpt-3.5-turbo",
        "context_window": 16384,
        "description": "Solid, balanced model for content evaluation."
    }
}

def get_model(role="versatile"):
    """
    Returns the model ID for the requested role.
    Fallback to the fast model if not found.
    """
    return OPENAI_MODELS.get(role, OPENAI_MODELS["fast"])["id"]

def verify_setup():
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        print("WARNING: OPENAI_API_KEY is not set correctly in .env!")
    else:
        print("OpenAI LLM Configuration is ready.")

    if not VECTORIZE_API_KEY:
        print("WARNING: VECTORIZE_API_KEY is not set correctly in .env!")
    else:
        print("Vectorize RAG Configuration is ready.")

if __name__ == "__main__":
    verify_setup()
