from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random

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
    model: str = "llama-3.3-70b-versatile"

@app.post("/generate")
async def generate_response(req: GenerateRequest):
    try:
        # Route to the correct API based on the model
        if "gpt" in req.model.lower():
            if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
                return {"output": "Error: OPENAI_API_KEY is not configured in .env."}
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        else:
            if not GROQ_API_KEY:
                return {"output": "Error: GROQ_API_KEY is not configured in .env."}
            client = openai.AsyncOpenAI(
                api_key=GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            
        response = await client.chat.completions.create(
            model=req.model,
            messages=[
                {"role": "system", "content": "You are WarpIndex, an expert AI SEO agent. Provide highly effective, and direct answers to help the user with SEO strategy, content generation, and technical audits."},
                {"role": "user", "content": req.prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return {"output": response.choices[0].message.content}
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
