from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import json
import random
import os

app = FastAPI(title="WarpIndex Real-Time API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "WarpIndex Backend is running"}

from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "gemini-2.5-flash"

@app.post("/generate")
async def generate_response(req: GenerateRequest):
    try:
        # Route to the correct API based on the model
        if "gpt-4" in req.model.lower(): # Only route to OpenAI for gpt-4*
            if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
                return {"output": "Error: OPENAI_API_KEY is not configured in .env."}
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model=req.model,
                messages=[
                    {"role": "system", "content": "You are WarpIndex, an elite AI SEO Architect and Strategist."},
                    {"role": "user", "content": req.prompt}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            return {"output": response.choices[0].message.content}
        elif req.model.startswith("gemini"):
            GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
            if not GEMINI_API_KEY:
                return {"output": "Error: GEMINI_API_KEY is not configured in .env."}
            import httpx
            # Fallback chain: try models from newest to most accessible
            gemini_fallback_chain = [
                req.model,           # Try the requested model first
                "gemini-2.5-flash",  # Best free-tier model
                "gemini-2.0-flash",  # Stable fallback
                "gemini-1.5-flash",  # Wide availability fallback
            ]
            # Remove duplicates while preserving order
            seen = set()
            gemini_models = [m for m in gemini_fallback_chain if not (m in seen or seen.add(m))]

            async with httpx.AsyncClient() as http_client:
                last_error = "Unknown error"
                for model_name in gemini_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                    payload = {
                        "contents": [{
                            "parts": [{"text": f"You are WarpIndex, an elite AI SEO Architect and Strategist. User: {req.prompt}"}]
                        }],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 2048,
                        }
                    }
                    res = await http_client.post(url, json=payload, timeout=30.0)
                    if res.status_code == 200:
                        data = res.json()
                        try:
                            text = data["candidates"][0]["content"]["parts"][0]["text"]
                            return {"output": f"[Hindsight AI via {model_name}]\n\n{text}"}
                        except (KeyError, IndexError):
                            return {"output": "Error parsing Gemini response."}
                    elif res.status_code in (429, 503, 404):
                        # Quota/unavailable — try next model
                        last_error = res.text
                        continue
                    else:
                        return {"output": f"Gemini API Error ({model_name}): {res.text}"}
                return {"output": f"All Gemini models exhausted. Last error: {last_error}"}
        else:
            if not GROQ_API_KEY:
                return {"output": "Error: GROQ_API_KEY is not configured in .env."}
            
            import httpx
            # Using the new Groq Responses API with built-in Browser Search
            async with httpx.AsyncClient() as http_client:
                # We use a tool-compatible model for browser search
                groq_model = req.model
                
                payload = {
                    "model": groq_model,
                    "input": [
                        {"role": "system", "content": "You are WarpIndex, an elite AI SEO Architect and Strategist."},
                        {"role": "user", "content": req.prompt}
                    ],
                    "tools": [{"type": "browser_search"}],
                    "tool_choice": "auto"
                }
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                res = await http_client.post(
                    "https://api.groq.com/openai/v1/responses",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                # Automatic fallback on Rate Limit (429)
                if res.status_code == 429:
                    payload["model"] = "openai/gpt-oss-20b"
                    # Keep tools for this model since it's supported
                    res = await http_client.post(
                        "https://api.groq.com/openai/v1/responses",
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )

                if res.status_code == 200:
                    data = res.json()
                    return {"output": data.get("output_text", str(data))}
                else:
                    return {"output": f"Groq API Error: {res.text}"}
    except Exception as e:
        return {"output": f"AI Generation Error: {str(e)}"}

# Real-time WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/agents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection success
        await websocket.send_text(json.dumps({"type": "system", "message": "Connected to Agent Orchestrator"}))
        
        while True:
            # Keep connection alive and listen for any client messages
            data = await websocket.receive_text()
            print(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# A background task to simulate real-time agent activity
import threading
import time

def simulate_agent_activity():
    activities = [
        "Search Observation Agent: Crawling SERPs for 'best running shoes'",
        "Citation Agent: Found new mention on Perplexity",
        "SEO Audit Agent: Analyzing Core Web Vitals on /pricing",
        "Hindsight Memory: Correlating traffic drop to core update",
        "Experiment Planning Agent: Proposing A/B test for meta titles",
        "Orchestrator: Queuing new tasks..."
    ]
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    while True:
        time.sleep(random.randint(3, 8))  # Emit event every 3-8 seconds
        if manager.active_connections:
            msg = {
                "type": "agent_activity", 
                "agent": random.choice(["Observation", "Citation", "Audit", "Memory", "Planner", "Orchestrator"]),
                "message": random.choice(activities),
                "timestamp": time.strftime("%H:%M:%S")
            }
            loop.run_until_complete(manager.broadcast(msg))

# Start the background simulator
thread = threading.Thread(target=simulate_agent_activity, daemon=True)
thread.start()

# Mount frontend build if it exists (for cloud deployments)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
elif os.path.exists(os.path.join(os.path.dirname(__file__), "frontend", "dist")):
    app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "frontend", "dist"), html=True), name="static")
