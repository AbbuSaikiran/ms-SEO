import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
VECTORIZE_API_KEY = os.getenv("VECTORIZE_API_KEY")
VECTORIZE_API_ENDPOINT = os.getenv("VECTORIZE_API_ENDPOINT")

# Groq Supported Models for SEO Agent
GROQ_MODELS = {
    "versatile": {
        "id": "llama-3.3-70b-versatile",
        "context_window": 131072,
        "description": "Used for deep SEO reasoning, strategy generation, and causal analysis."
    },
    "fast": {
        "id": "llama-3.1-8b-instant",
        "context_window": 131072,
        "description": "Used for quick log categorization, fast routing, and initial data formatting."
    },
    "powerful_reasoning": {
        "id": "openai/gpt-oss-120b",
        "context_window": 131072,
        "description": "Flagship open-weight model with reasoning capabilities. Great for complex competitor analysis."
    },
    "general": {
        "id": "openai/gpt-oss-20b",
        "context_window": 131072,
        "description": "Solid, balanced model for content evaluation."
    }
}

def get_model(role="versatile"):
    """
    Returns the model ID for the requested role.
    Fallback to the fast model if not found.
    """
    return GROQ_MODELS.get(role, GROQ_MODELS["fast"])["id"]

def verify_setup():
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        print("WARNING: GROQ_API_KEY is not set correctly in .env!")
    else:
        print("Groq LLM Configuration is ready.")

    if not VECTORIZE_API_KEY:
        print("WARNING: VECTORIZE_API_KEY is not set correctly in .env!")
    else:
        print("Vectorize RAG Configuration is ready.")

if __name__ == "__main__":
    verify_setup()
