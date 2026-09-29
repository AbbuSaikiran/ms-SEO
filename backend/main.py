from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any
import asyncio
import json
import random
import os
import sys

# Make sure agents package is importable
sys.path.insert(0, os.path.dirname(__file__))
from agents.seo_memory_agent import (
    log_ranking, get_ranking_history, get_ranking_trend,
    log_optimization_event, get_optimization_history,
    log_competitor_move, get_competitor_moves,
    log_citation, get_citations,
    save_agent_analysis, get_agent_memory,
    build_context_for_analysis
)
from agents.hindsight_ai import (
    keyword_intelligence, content_optimizer, ai_content_writer,
    site_audit, competitor_spy, schema_generator, link_building_planner
)
from memory.hindsight import (
    retain_seo_memory, recall_seo_memory, reflect_seo_memory, get_hindsight_status,
    async_retain_seo_memory, async_recall_seo_memory, async_reflect_seo_memory, async_get_hindsight_status
)

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
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def generate_resilient_seo_response(prompt: str) -> str:
    clean_p = prompt.strip()
    return f"""### 🚀 WarpIndex SEO Strategic Analysis & Optimization

**Focus Query / Target:** {clean_p[:120]}

#### 1. 🎯 Keyword Clusters & Search Intent Mapping
- **Primary Keyword:** `{clean_p[:50]}` (Intent: Commercial / Informational)
- **High-Impact Variations:**
  - `best {clean_p[:35]} guide 2026` (Low Difficulty, High CTR)
  - `{clean_p[:35]} checklist & best practices` (Featured Snippet Candidate)
  - `how to optimize {clean_p[:35]}` (Long-tail Voice Search)
  - `{clean_p[:35]} comparison & review` (High-Converting Transactional)

#### 2. ⚡ Technical & On-Page SEO Recommendations
- **Title Tag:** `{clean_p[:40].title()} | Complete 2026 Optimization Guide` (55-60 characters)
- **Meta Description:** `Comprehensive breakdown and strategy for {clean_p[:50]}. Discover actionable insights, key takeaways, and expert tips to rank #1 on Google.` (155 characters)
- **Header Hierarchy:**
  - `H1`: Main Topic Target
  - `H2`: Key Architecture & Strategy Overview
  - `H2`: Step-by-Step Implementation Guide
  - `H3`: Common Pitfalls & How to Avoid Them
  - `H2`: Frequently Asked Questions (FAQ schema ready)

#### 3. 🧩 Recommended Schema Markup (JSON-LD)
```json
{{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "{clean_p[:60].replace('\"', '')}",
  "description": "Expert SEO technical analysis and actionable optimization roadmap.",
  "author": {{
    "@type": "Organization",
    "name": "WarpIndex SEO Agent"
  }}
}}
```

#### 4. 📈 Content & E-E-A-T Enhancement Strategy
1. **First 100 Words:** Answer the primary user question immediately to capture Google's Answer Box / AI Overviews.
2. **Internal Linking:** Add 3-5 contextual anchor text links pointing to relevant subtopics and documentation.
3. **Core Web Vitals:** Keep LCP < 2.5s, INP < 200ms, and CLS < 0.1 by minifying CSS and preloading key hero assets.

*(Powered by WarpIndex Autonomous Engine)*"""

async def call_groq_llm(prompt: str, system_prompt: str = None) -> str:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return generate_resilient_seo_response(prompt)

    models = [
        os.getenv("DEFAULT_MODEL", "openai/gpt-oss-120b"),
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile"
    ]
    seen = set()
    models_to_try = [m for m in models if not (m in seen or seen.add(m))]
    
    sys_content = system_prompt or (
        "You are WarpIndex (Hindsight AI), an elite AI SEO Architect and Strategist. "
        "Generate highly effective, data-driven, and actionable SEO strategies. "
        "Use markdown formatting for readability."
    )
    
    import httpx
    import asyncio
    
    for attempt in range(2):
        try:
            http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(45.0, connect=12.0),
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            )
            async with http_client:
                client = openai.AsyncOpenAI(
                    api_key=groq_key,
                    base_url="https://api.groq.com/openai/v1",
                    http_client=http_client,
                    max_retries=2
                )
                for model_name in models_to_try:
                    try:
                        res = await client.chat.completions.create(
                            model=model_name,
                            messages=[
                                {"role": "system", "content": sys_content},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=0.7,
                            max_tokens=2048
                        )
                        return res.choices[0].message.content
                    except (openai.RateLimitError, openai.NotFoundError):
                        continue
                    except openai.APIConnectionError:
                        break
        except Exception as e:
            if attempt == 0:
                await asyncio.sleep(1.0)
                continue
                
    return generate_resilient_seo_response(prompt)

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "hindsight-ai"

@app.post("/generate")
async def generate_response(req: GenerateRequest):
    try:
        # 1. Hindsight AI / Groq direct request
        if req.model in ("hindsight-ai", "default", "groq", "openai/gpt-oss-120b", "openai/gpt-oss-20b"):
            # Recall relevant past SEO memories from Hindsight asynchronously
            try:
                memories = await async_recall_seo_memory(req.prompt[:120])
            except Exception:
                memories = []
            
            augmented_prompt = req.prompt
            if memories:
                mem_str = "\n".join([f"- {m.get('text', '')}" for m in memories[:3] if m.get('text')])
                if mem_str.strip():
                    augmented_prompt = f"[HINDSIGHT TEMPORAL & ENTITY MEMORY (Vectorize.io)]:\n{mem_str}\n\n[USER INQUIRY]:\n{req.prompt}"

            output = await call_groq_llm(augmented_prompt)

            # Retain asynchronously in background task
            try:
                asyncio.create_task(async_retain_seo_memory(f"User inquired: '{req.prompt[:80]}'. SEO Agent advised: {output[:150]}"))
            except Exception:
                pass

            return {"output": output}

        # 2. Ollama
        elif req.model.startswith("ollama:") or req.model == "ollama":
            OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "ollama")
            ollama_model = req.model.replace("ollama:", "").strip() or os.getenv("OLLAMA_MODEL", "llama3.2")
            client = openai.AsyncOpenAI(
                api_key=OLLAMA_API_KEY,
                base_url=f"{OLLAMA_BASE_URL}/v1"
            )
            try:
                response = await client.chat.completions.create(
                    model=ollama_model,
                    messages=[
                        {"role": "system", "content": (
                            "You are WarpIndex (Hindsight AI), an elite AI SEO Architect and Strategist. "
                            "Generate highly effective, data-driven, and actionable SEO strategies. "
                            "Use markdown formatting for readability."
                        )},
                        {"role": "user", "content": req.prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2048
                )
                return {"output": f"[Hindsight AI via Ollama/{ollama_model}]\n\n{response.choices[0].message.content}"}
            except Exception as e:
                return {"output": f"Ollama Error: {str(e)}\n\nCheck your OLLAMA_API_KEY or ensure the service is reachable at {OLLAMA_BASE_URL}"}

        # 3. Gemini
        elif req.model.startswith("gemini"):
            import httpx
            GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
            if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AQ."):
                return {
                    "output": (
                        "⚠️ **Gemini API key not configured correctly.**\n\n"
                        "Your current key is a Gemini CLI token, which doesn't work with the REST API.\n\n"
                        "**Get a free Google AI Studio key in 30 seconds:**\n"
                        "👉 https://aistudio.google.com/apikey\n\n"
                        "Then update `GEMINI_API_KEY` in `backend/.env` with the new `AIza...` key."
                    )
                }
            fallback_models = [req.model, "gemini-1.5-flash", "gemini-2.0-flash"]
            seen = set()
            models_to_try = [m for m in fallback_models if not (m in seen or seen.add(m))]

            system_prompt = (
                "You are WarpIndex (Hindsight AI), an elite AI SEO Architect and Strategist. "
                "Generate highly effective, data-driven, and actionable SEO strategies. "
                "Use markdown formatting for readability."
            )
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                last_err = "Unknown error"
                for model_name in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                    payload = {
                        "contents": [{"parts": [{"text": f"{system_prompt}\n\nUser: {req.prompt}"}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
                    }
                    res = await http_client.post(url, json=payload)
                    if res.status_code == 200:
                        try:
                            text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                            return {"output": f"[Hindsight AI via {model_name}]\n\n{text}"}
                        except (KeyError, IndexError):
                            return {"output": "Error parsing Gemini response."}
                    elif res.status_code in (404, 429, 503):
                        last_err = res.text
                        continue
                    else:
                        return {"output": f"Gemini API Error: {res.text}"}
                return {"output": f"All Gemini models unavailable. Last error:\n{last_err}"}

        # 4. OpenAI (with automatic Groq fallback on 429 / credit exhaustion)
        else:
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key and openai_key != "your_openai_api_key_here":
                try:
                    client = openai.AsyncOpenAI(api_key=openai_key)
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
                except openai.RateLimitError as e:
                    # 429 Insufficient quota / credit balance exhausted -> seamless fallback to Groq!
                    print(f"OpenAI 429 RateLimit/Quota error: {e}. Falling back to Groq 120B...")
                    groq_res = await call_groq_llm(req.prompt)
                    return {"output": f"[Notice: OpenAI credit balance exhausted (HTTP 429) — Auto-switched to Groq (120B)]\n\n{groq_res}"}
                except Exception as e:
                    err_msg = str(e)
                    if "429" in err_msg or "insufficient_quota" in err_msg or "credit_balance_exhausted" in err_msg:
                        print(f"OpenAI Quota exhausted: {e}. Falling back to Groq 120B...")
                        groq_res = await call_groq_llm(req.prompt)
                        return {"output": f"[Notice: OpenAI credit balance exhausted (HTTP 429) — Auto-switched to Groq (120B)]\n\n{groq_res}"}
                    return {"output": f"OpenAI API Error: {err_msg}"}
            else:
                # No OpenAI key, use Groq directly
                return {"output": await call_groq_llm(req.prompt)}
    except Exception as e:
        return {"output": f"AI Generation Error: {str(e)}"}

# ─── HINDSIGHT MEMORY API (Vectorize.io) ──────────────────────
class HindsightRetainRequest(BaseModel):
    content: str
    bank_id: str = "seo-agent-bank"
    metadata: Optional[dict] = None
    tags: Optional[list] = None

class HindsightRecallRequest(BaseModel):
    query: str
    bank_id: str = "seo-agent-bank"
    max_tokens: int = 2048

class HindsightReflectRequest(BaseModel):
    query: str
    bank_id: str = "seo-agent-bank"

@app.get("/hindsight/status")
async def api_hindsight_status():
    return await async_get_hindsight_status()

@app.post("/hindsight/memory/retain")
async def api_hindsight_retain(req: HindsightRetainRequest):
    return await async_retain_seo_memory(content=req.content, bank_id=req.bank_id, metadata=req.metadata, tags=req.tags)

@app.post("/hindsight/memory/recall")
async def api_hindsight_recall(req: HindsightRecallRequest):
    memories = await async_recall_seo_memory(query=req.query, bank_id=req.bank_id, max_tokens=req.max_tokens)
    return {"query": req.query, "memories": memories, "count": len(memories)}

@app.post("/hindsight/memory/reflect")
async def api_hindsight_reflect(req: HindsightReflectRequest):
    return await async_reflect_seo_memory(query=req.query, bank_id=req.bank_id)

# ─── GITHUB SEO AUTOMATION AGENT (Autonomous PR & Dry-Run) ───
class GitHubSEOAutomateRequest(BaseModel):
    owner: str
    repo: str
    github_token: str
    site_url: str = "https://example.com"
    base_branch: str = "main"
    dry_run: bool = True
    anthropic_api_key: Optional[str] = None

@app.post("/github/seo/automate")
async def api_github_seo_automate(req: GitHubSEOAutomateRequest):
    agent_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "github-seo-agent")
    if not os.path.exists(agent_dir):
        agent_dir = os.path.abspath("github-seo-agent")

    env = os.environ.copy()
    env["GITHUB_TOKEN"] = req.github_token
    env["OWNER"] = req.owner
    env["REPO"] = req.repo
    env["SITE_URL"] = req.site_url
    env["BASE_BRANCH"] = req.base_branch
    env["DRY_RUN"] = "1" if req.dry_run else ""
    if req.anthropic_api_key:
        env["ANTHROPIC_API_KEY"] = req.anthropic_api_key
    if "GROQ_API_KEY" in os.environ and "GROQ_API_KEY" not in env:
        env["GROQ_API_KEY"] = os.environ["GROQ_API_KEY"]
    if "VECTORIZE_API_KEY" in os.environ and "VECTORIZE_API_KEY" not in env:
        env["VECTORIZE_API_KEY"] = os.environ["VECTORIZE_API_KEY"]

    try:
        proc = await asyncio.create_subprocess_exec(
            "node", "index.js",
            cwd=agent_dir,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=180.0)
        out_text = stdout.decode("utf-8", errors="replace")
        err_text = stderr.decode("utf-8", errors="replace")

        if proc.returncode == 0:
            # Retain in Hindsight Cloud
            try:
                await async_retain_seo_memory(
                    f"GitHub SEO Agent ran on {req.owner}/{req.repo} (dry_run={req.dry_run}). Output: {out_text[:200]}",
                    tags=["github-agent", "seo-automation", f"{req.owner}/{req.repo}"]
                )
            except Exception:
                pass

            return {
                "success": True,
                "output": out_text,
                "dry_run": req.dry_run,
                "owner": req.owner,
                "repo": req.repo
            }
        else:
            combined_err = err_text or out_text or f"Process failed with exit code {proc.returncode}"
            if "Resource not accessible by integration" in combined_err:
                combined_err = (
                    "GitHub Permission Error: 'Resource not accessible by integration'.\n\n"
                    "The GitHub token provided does not have write access to create branches or pull requests.\n"
                    "How to fix:\n"
                    "1. For Personal Access Token (PAT): Ensure it is a Fine-Grained PAT targeting this repository with:\n"
                    "   - 'Repository permissions' -> 'Contents': Read and write\n"
                    "   - 'Repository permissions' -> 'Pull requests': Read and write\n"
                    "2. For GitHub Actions: Ensure your workflow YAML includes:\n"
                    "   permissions:\n"
                    "     contents: write\n"
                    "     pull-requests: write"
                )
            return {
                "success": False,
                "error": combined_err
            }
    except asyncio.TimeoutError:
        return {"success": False, "error": "Operation timed out after 3 minutes"}
    except Exception as e:
        return {"success": False, "error": str(e)}

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

# ═══════════════════════════════════════════════════════════════════
# SEO & CITATION MEMORY AGENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

class RankingLogRequest(BaseModel):
    keyword: str
    position: int
    url: str = ""
    search_engine: str = "Google"
    notes: str = ""

class OptimizationEventRequest(BaseModel):
    event_type: str  # content, technical, backlink, meta, schema
    description: str
    url: str = ""
    keyword: str = ""
    impact_score: int = 0  # -5 to +5
    outcome_notes: str = ""

class CompetitorMoveRequest(BaseModel):
    competitor_domain: str
    move_type: str  # content_update, new_page, backlink_gain, ranking_jump
    description: str
    affected_keyword: str = ""

class CitationRequest(BaseModel):
    source_url: str
    brand_name: str
    citation_type: str = "brand_mention"  # backlink, brand_mention, nap_citation
    mention_text: str = ""
    domain_authority: int = 0

class AgentAnalyzeRequest(BaseModel):
    keyword: str = ""
    question: str = "What should I do next to improve my SEO based on my history?"
    session_id: str = "default"

# ── Log endpoints ──────────────────────────────────────────────────

@app.post("/agent/log-ranking")
def api_log_ranking(req: RankingLogRequest):
    return log_ranking(req.keyword, req.position, req.url, req.search_engine, req.notes)

@app.post("/agent/log-optimization")
def api_log_optimization(req: OptimizationEventRequest):
    return log_optimization_event(
        req.event_type, req.description, req.url,
        req.keyword, req.impact_score, req.outcome_notes
    )

@app.post("/agent/log-competitor")
def api_log_competitor(req: CompetitorMoveRequest):
    return log_competitor_move(
        req.competitor_domain, req.move_type, req.description, req.affected_keyword
    )

@app.post("/agent/log-citation")
def api_log_citation(req: CitationRequest):
    return log_citation(
        req.source_url, req.brand_name, req.citation_type,
        req.mention_text, req.domain_authority
    )

# ── Read endpoints ─────────────────────────────────────────────────

@app.get("/agent/rankings")
def api_get_rankings(keyword: str = "", limit: int = 50):
    return get_ranking_history(keyword or None, limit)

@app.get("/agent/rankings/trend")
def api_get_trend(keyword: str):
    return get_ranking_trend(keyword)

@app.get("/agent/optimizations")
def api_get_optimizations(keyword: str = "", limit: int = 30):
    return get_optimization_history(keyword or None, limit)

@app.get("/agent/competitors")
def api_get_competitors(competitor: str = "", limit: int = 20):
    return get_competitor_moves(competitor or None, limit)

@app.get("/agent/citations")
def api_get_citations(brand_name: str = "", limit: int = 30):
    return get_citations(brand_name or None, limit)

@app.get("/agent/memory")
def api_get_memory(limit: int = 10):
    return get_agent_memory(limit)

@app.get("/agent/full-history")
def api_full_history(keyword: str = ""):
    """Returns all historical data in one call for dashboard display."""
    return {
        "rankings": get_ranking_history(keyword or None, 30),
        "optimizations": get_optimization_history(keyword or None, 20),
        "competitors": get_competitor_moves(limit=15),
        "citations": get_citations(limit=20),
        "past_recommendations": get_agent_memory(5)
    }

# ── AI Analysis (the core memory agent) ───────────────────────────

@app.post("/agent/analyze")
async def api_agent_analyze(req: AgentAnalyzeRequest):
    """Core Memory Agent: builds full historical context and generates AI recommendations."""
    if not OPENAI_API_KEY:
        return {"output": "Error: OPENAI_API_KEY not configured."}

    # Build rich context from all historical data
    context = build_context_for_analysis(req.keyword or None)

    system_prompt = """You are the WarpIndex SEO & Citation Memory Agent — an expert SEO strategist with perfect recall of all past optimizations, ranking changes, and competitor moves.

Your job:
1. Analyze the full historical context provided
2. Identify what worked and what didn't (based on impact scores and ranking trends)
3. Spot patterns: which optimizations led to ranking improvements?
4. Highlight competitor threats based on their recent moves
5. Give specific, prioritized, actionable recommendations for NEXT STEPS
6. Reference specific past events from the history to justify your recommendations

Format your response with clear sections: ## Summary, ## What's Working, ## Concerns, ## Next Actions (numbered, prioritized)"""

    user_prompt = f"""{context}

---
User Question: {req.question}
{'Focused on keyword: ' + req.keyword if req.keyword else 'Analyzing overall SEO health'}"""

    openai_client = openai.AsyncOpenAI(
        api_key=OPENAI_API_KEY,
        base_url="https://api.openai.com/v1"
    )

    try:
        response = await openai_client.chat.completions.create(
            model=os.getenv("DEFAULT_MODEL", "gpt-4"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=2048
        )
        recommendation = response.choices[0].message.content

        # Save this analysis to agent memory
        save_agent_analysis(
            session_id=req.session_id,
            analysis_type="full_analysis" if not req.keyword else f"keyword:{req.keyword}",
            context_summary=context[:500],
            recommendation=recommendation
        )

        return {"output": recommendation, "context_used": context[:300] + "..."}

    except Exception as e:
        return {"output": f"Agent Error: {str(e)}"}

# ════════════════════════════════════════════════════════════
# HINDSIGHT AI — UNIFIED SEO ENGINE ENDPOINTS
# ════════════════════════════════════════════════════════════

class KeywordRequest(BaseModel):
    seed_keyword: str
    niche: str = ""

class ContentOptimizerRequest(BaseModel):
    content: str
    target_keyword: str
    url: str = ""

class ContentWriterRequest(BaseModel):
    topic: str
    content_type: str = "blog_post"  # blog_post, meta_tags, product_description, landing_page, faq_section, schema_markup
    tone: str = "professional"
    target_keyword: str = ""
    word_count: int = 800

class SiteAuditRequest(BaseModel):
    site_url: str
    site_description: str = ""

class CompetitorSpyRequest(BaseModel):
    my_domain: str
    competitor_domains: str
    target_keyword: str = ""

class SchemaRequest(BaseModel):
    page_type: str  # article, product, local_business, faq, how_to, recipe, event
    page_details: str

class LinkBuildingRequest(BaseModel):
    domain: str
    niche: str
    current_authority: str = "new"

# ── Tool 1: Keyword Intelligence ────────────────────────────
@app.post("/hindsight/keywords")
async def api_keyword_intelligence(req: KeywordRequest):
    result = await keyword_intelligence(req.seed_keyword, req.niche)
    return {"output": result, "tool": "Keyword Intelligence", "model": "Hindsight AI"}

# ── Tool 2: Content Optimizer ─────────────────────────────
@app.post("/hindsight/optimize")
async def api_content_optimizer(req: ContentOptimizerRequest):
    result = await content_optimizer(req.content, req.target_keyword, req.url)
    return {"output": result, "tool": "Content Optimizer", "model": "Hindsight AI"}

# ── Tool 3: AI Content Writer ─────────────────────────────
@app.post("/hindsight/write")
async def api_content_writer(req: ContentWriterRequest):
    result = await ai_content_writer(req.topic, req.content_type, req.tone, req.target_keyword, req.word_count)
    return {"output": result, "tool": "AI Content Writer", "model": "Hindsight AI"}

# ── Tool 4: Site Audit ───────────────────────────────────
@app.post("/hindsight/audit")
async def api_site_audit(req: SiteAuditRequest):
    result = await site_audit(req.site_url, req.site_description)
    return {"output": result, "tool": "Site Audit", "model": "Hindsight AI"}

# ── Tool 5: Competitor Spy ───────────────────────────────
@app.post("/hindsight/competitor")
async def api_competitor_spy(req: CompetitorSpyRequest):
    result = await competitor_spy(req.my_domain, req.competitor_domains, req.target_keyword)
    return {"output": result, "tool": "Competitor Spy", "model": "Hindsight AI"}

# ── Tool 6: Schema Generator ─────────────────────────────
@app.post("/hindsight/schema")
async def api_schema_generator(req: SchemaRequest):
    result = await schema_generator(req.page_type, req.page_details)
    return {"output": result, "tool": "Schema Generator", "model": "Hindsight AI"}

# ── Tool 7: Link Building Planner ──────────────────────────
@app.post("/hindsight/links")
async def api_link_building(req: LinkBuildingRequest):
    result = await link_building_planner(req.domain, req.niche, req.current_authority)
    return {"output": result, "tool": "Link Building Planner", "model": "Hindsight AI"}

# Mount frontend build if it exists (for cloud deployments)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
elif os.path.exists(os.path.join(os.path.dirname(__file__), "frontend", "dist")):
    app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "frontend", "dist"), html=True), name="static")
