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
