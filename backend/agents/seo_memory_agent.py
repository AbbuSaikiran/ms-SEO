"""
SEO & Citation Memory Agent
Persists ranking history, optimization events, and competitor moves to SQLite.
Uses Groq (free) to generate recommendations based on full historical context.
"""

import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "seo_memory.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    c = conn.cursor()

    # Keyword ranking history
    c.execute("""
        CREATE TABLE IF NOT EXISTS ranking_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL,
            position INTEGER,
            url TEXT,
            search_engine TEXT DEFAULT 'Google',
            recorded_at TEXT NOT NULL,
            notes TEXT
        )
    """)

    # Optimization events (what change was made)
    c.execute("""
        CREATE TABLE IF NOT EXISTS optimization_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,   -- 'content', 'technical', 'backlink', 'meta', 'schema'
            description TEXT NOT NULL,
            url TEXT,
            keyword TEXT,
            impact_score INTEGER,       -- -5 to +5, manually or AI-assessed
            recorded_at TEXT NOT NULL,
            outcome_notes TEXT
        )
    """)

    # Competitor moves
    c.execute("""
        CREATE TABLE IF NOT EXISTS competitor_moves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competitor_domain TEXT NOT NULL,
            move_type TEXT NOT NULL,    -- 'content_update', 'new_page', 'backlink_gain', 'ranking_jump'
            description TEXT NOT NULL,
            affected_keyword TEXT,
            recorded_at TEXT NOT NULL
        )
    """)

    # Citation / brand mention tracking
    c.execute("""
        CREATE TABLE IF NOT EXISTS citations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_url TEXT NOT NULL,
            mention_text TEXT,
            brand_name TEXT,
            citation_type TEXT,         -- 'backlink', 'brand_mention', 'nap_citation'
            domain_authority INTEGER,
            recorded_at TEXT NOT NULL
        )
    """)

    # AI analysis sessions (remember what the agent recommended)
    c.execute("""
        CREATE TABLE IF NOT EXISTS agent_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            analysis_type TEXT,
            context_summary TEXT,
            recommendation TEXT,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# ─── RANKING HISTORY ─────────────────────────────────────────────────────────

def log_ranking(keyword: str, position: int, url: str = "", 
                search_engine: str = "Google", notes: str = "") -> dict:
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO ranking_history (keyword, position, url, search_engine, recorded_at, notes) VALUES (?,?,?,?,?,?)",
        (keyword, position, url, search_engine, now, notes)
    )
    conn.commit()
    conn.close()
    return {"status": "logged", "keyword": keyword, "position": position, "timestamp": now}


def get_ranking_history(keyword: Optional[str] = None, limit: int = 50) -> list:
    conn = get_db()
    if keyword:
        rows = conn.execute(
            "SELECT * FROM ranking_history WHERE keyword=? ORDER BY recorded_at DESC LIMIT ?",
            (keyword, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM ranking_history ORDER BY recorded_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_ranking_trend(keyword: str) -> dict:
    """Returns trend analysis for a keyword."""
    history = get_ranking_history(keyword, limit=30)
    if not history:
        return {"keyword": keyword, "trend": "no_data", "history": []}
    positions = [h["position"] for h in history]
    first, last = positions[-1], positions[0]
    trend = "improving" if last < first else "declining" if last > first else "stable"
    best = min(positions)
    worst = max(positions)
    return {
        "keyword": keyword,
        "current_position": last,
        "previous_position": first,
        "best_position": best,
        "worst_position": worst,
        "trend": trend,
        "data_points": len(positions),
        "history": history[:10]
    }


# ─── OPTIMIZATION EVENTS ─────────────────────────────────────────────────────

def log_optimization_event(event_type: str, description: str, url: str = "",
                            keyword: str = "", impact_score: int = 0,
                            outcome_notes: str = "") -> dict:
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO optimization_events (event_type, description, url, keyword, impact_score, recorded_at, outcome_notes) VALUES (?,?,?,?,?,?,?)",
        (event_type, description, url, keyword, impact_score, now, outcome_notes)
    )
    conn.commit()
    conn.close()
    return {"status": "logged", "event_type": event_type, "timestamp": now}


def get_optimization_history(keyword: Optional[str] = None, limit: int = 30) -> list:
    conn = get_db()
    if keyword:
        rows = conn.execute(
            "SELECT * FROM optimization_events WHERE keyword=? ORDER BY recorded_at DESC LIMIT ?",
            (keyword, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM optimization_events ORDER BY recorded_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── COMPETITOR MOVES ────────────────────────────────────────────────────────

def log_competitor_move(competitor_domain: str, move_type: str, description: str,
                        affected_keyword: str = "") -> dict:
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO competitor_moves (competitor_domain, move_type, description, affected_keyword, recorded_at) VALUES (?,?,?,?,?)",
        (competitor_domain, move_type, description, affected_keyword, now)
    )
    conn.commit()
    conn.close()
    return {"status": "logged", "competitor": competitor_domain, "timestamp": now}


def get_competitor_moves(competitor: Optional[str] = None, limit: int = 20) -> list:
    conn = get_db()
    if competitor:
        rows = conn.execute(
            "SELECT * FROM competitor_moves WHERE competitor_domain=? ORDER BY recorded_at DESC LIMIT ?",
            (competitor, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM competitor_moves ORDER BY recorded_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── CITATIONS ───────────────────────────────────────────────────────────────

def log_citation(source_url: str, brand_name: str, citation_type: str = "brand_mention",
                 mention_text: str = "", domain_authority: int = 0) -> dict:
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO citations (source_url, brand_name, citation_type, mention_text, domain_authority, recorded_at) VALUES (?,?,?,?,?,?)",
        (source_url, brand_name, citation_type, mention_text, domain_authority, now)
    )
    conn.commit()
    conn.close()
    return {"status": "logged", "source": source_url, "timestamp": now}


def get_citations(brand_name: Optional[str] = None, limit: int = 30) -> list:
    conn = get_db()
    if brand_name:
        rows = conn.execute(
            "SELECT * FROM citations WHERE brand_name=? ORDER BY recorded_at DESC LIMIT ?",
            (brand_name, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM citations ORDER BY recorded_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── AGENT MEMORY (AI ANALYSIS) ──────────────────────────────────────────────

def save_agent_analysis(session_id: str, analysis_type: str,
                        context_summary: str, recommendation: str) -> dict:
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO agent_memory (session_id, analysis_type, context_summary, recommendation, created_at) VALUES (?,?,?,?,?)",
        (session_id, analysis_type, context_summary, recommendation, now)
    )
    conn.commit()
    conn.close()
    return {"status": "saved", "session_id": session_id}


def get_agent_memory(limit: int = 10) -> list:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM agent_memory ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def build_context_for_analysis(keyword: Optional[str] = None) -> str:
    """Build a rich context string from all historical data for AI analysis."""
    ranking_history = get_ranking_history(keyword, limit=20)
    optimization_history = get_optimization_history(keyword, limit=15)
    competitor_moves = get_competitor_moves(limit=10)
    citations = get_citations(limit=10)
    past_recommendations = get_agent_memory(limit=5)

    context_parts = ["# SEO Agent Historical Context\n"]

    if ranking_history:
        context_parts.append("## Ranking History (most recent first)")
        for r in ranking_history[:10]:
            context_parts.append(f"- [{r['recorded_at'][:10]}] '{r['keyword']}': Position {r['position']} on {r['search_engine']}" + (f" | Notes: {r['notes']}" if r['notes'] else ""))

    if optimization_history:
        context_parts.append("\n## Past Optimizations")
        for e in optimization_history[:10]:
            impact = f"Impact: {'+' if e['impact_score'] >= 0 else ''}{e['impact_score']}/5" if e['impact_score'] != 0 else ""
            context_parts.append(f"- [{e['recorded_at'][:10]}] [{e['event_type'].upper()}] {e['description']}" + (f" | {impact}" if impact else "") + (f" | Outcome: {e['outcome_notes']}" if e['outcome_notes'] else ""))

    if competitor_moves:
        context_parts.append("\n## Competitor Moves")
        for c in competitor_moves[:8]:
            context_parts.append(f"- [{c['recorded_at'][:10]}] {c['competitor_domain']}: [{c['move_type']}] {c['description']}" + (f" (affects: '{c['affected_keyword']}')" if c['affected_keyword'] else ""))

    if citations:
        context_parts.append("\n## Recent Citations / Brand Mentions")
        for c in citations[:8]:
            context_parts.append(f"- [{c['recorded_at'][:10]}] {c['citation_type']} from {c['source_url']}" + (f" (DA: {c['domain_authority']})" if c['domain_authority'] else ""))

    if past_recommendations:
        context_parts.append("\n## Previous Agent Recommendations")
        for m in past_recommendations[:3]:
            context_parts.append(f"- [{m['created_at'][:10]}] {m['analysis_type']}: {m['recommendation'][:200]}...")

    return "\n".join(context_parts)


# Initialize DB on import
init_db()
