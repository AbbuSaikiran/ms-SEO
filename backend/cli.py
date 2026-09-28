import os
import sys
import asyncio
import httpx
from dotenv import load_dotenv

# Force UTF-8 encoding for Windows terminals
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

SYSTEM_PROMPT = (
    "You are WarpIndex, an elite AI SEO Architect and Strategist. "
    "Your primary objective is to generate highly effective, data-driven, and actionable SEO strategies. "
    "When answering, adhere strictly to these principles:\n"
    "1. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness): Structure content and advice to maximize Google's quality rater guidelines.\n"
    "2. Technical SEO: Provide precise, code-level optimizations for Core Web Vitals, schema markup (JSON-LD), and canonicalization.\n"
    "3. Semantic Relevance: Emphasize topical authority, semantic clustering, and LSI keyword integration over basic keyword stuffing.\n"
    "4. Actionability: Always give step-by-step instructions or direct code snippets that the user can immediately implement.\n"
    "5. Brevity & Precision: Be concise but comprehensive. Avoid fluff. Use markdown for readability."
)

async def generate_response(prompt: str) -> str:
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY is not configured in .env."

    groq_model = "openai/gpt-oss-120b"
    
    payload = {
        "model": groq_model,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "tools": [{"type": "browser_search"}],
        "tool_choice": "auto"
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    print("WarpIndex is thinking (using Groq's GPT-OSS 120b)...", flush=True)
    async with httpx.AsyncClient() as http_client:
        try:
            res = await http_client.post(
                "https://api.groq.com/openai/v1/responses",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            
            if res.status_code == 200:
                data = res.json()
                return data.get("output_text", str(data))
            else:
                return f"Groq API Error: {res.text}"
        except Exception as e:
            return f"Network Error: {str(e)}"

async def interactive_mode():
    print("=========================================================")
    print(" WarpIndex SEO Agent CLI - Powered by Groq (gpt-oss-120b) ")
    print("=========================================================")
    print("Type your SEO query below. Type 'exit' or 'quit' to stop.\n")
    
    while True:
        try:
            user_input = input("\nYou: ")
            if user_input.lower().strip() in ["exit", "quit"]:
                print("Goodbye!")
                break
            if not user_input.strip():
                continue
            
            response = await generate_response(user_input)
            print("\n---------------------------------------------------------")
            print(f"WarpIndex: {response}")
            print("---------------------------------------------------------")
            
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

def main():
    # If arguments are passed, run in single command mode
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
        response = asyncio.run(generate_response(task))
        print(f"\n{response}\n")
    else:
        # Run interactive mode
        asyncio.run(interactive_mode())

if __name__ == "__main__":
    main()
