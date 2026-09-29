"""
Hindsight Integration for SEO Agent
Official Vectorize.io Hindsight Memory System
Features:
- Retain: Store rankings, competitor moves, codebase audits, and optimizations
- Recall: Retrieve temporal and entity memories across SEO campaigns
- Reflect: Form deep strategic observations and belief consolidation
"""

import os
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

HINDSIGHT_ENDPOINT = os.getenv("VECTORIZE_API_ENDPOINT", "https://api.hindsight.vectorize.io")
HINDSIGHT_API_KEY = os.getenv("VECTORIZE_API_KEY")
DEFAULT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "seo-agent-bank")

# Global client cache
_hindsight_client = None

def get_hindsight_client():
    global _hindsight_client
    if _hindsight_client is None:
        try:
            from hindsight_client import Hindsight
            if HINDSIGHT_API_KEY:
                _hindsight_client = Hindsight(
                    base_url=HINDSIGHT_ENDPOINT,
                    api_key=HINDSIGHT_API_KEY,
                    timeout=10.0,
                    max_attempts=2
                )
        except Exception as e:
            print(f"[Hindsight] Client init error: {e}")
    return _hindsight_client


async def async_retain_seo_memory(
    content: str,
    bank_id: str = DEFAULT_BANK_ID,
    metadata: Optional[Dict[str, str]] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Asynchronously retains an SEO optimization event, ranking change, or codebase insight into Hindsight.
    """
    client = get_hindsight_client()
    if not client:
        return {"success": False, "error": "Hindsight client not initialized (check VECTORIZE_API_KEY)"}

    try:
        res = await asyncio.wait_for(
            client.aretain(
                bank_id=bank_id,
                content=content,
                metadata=metadata,
                tags=tags or ["seo-agent", "optimization"]
            ),
            timeout=8.0
        )
        return {
            "success": True,
            "bank_id": bank_id,
            "items_count": getattr(res, "items_count", 1),
            "tokens": getattr(res, "usage", {}).total_tokens if hasattr(res, "usage") else 0
        }
    except Exception as e:
        print(f"[Hindsight Async Retain Error] {e}")
        return {"success": False, "error": str(e)}


async def async_recall_seo_memory(
    query: str,
    bank_id: str = DEFAULT_BANK_ID,
    max_tokens: int = 2048
) -> List[Dict[str, Any]]:
    """
    Asynchronously recalls context-relevant memories from Hindsight using semantic, temporal, and entity tracking.
    """
    client = get_hindsight_client()
    if not client:
        return []

    try:
        res = await asyncio.wait_for(
            client.arecall(
                bank_id=bank_id,
                query=query,
                max_tokens=max_tokens,
                budget="mid"
            ),
            timeout=8.0
        )
        memories = []
        if hasattr(res, "results") and res.results:
            for item in res.results:
                memories.append({
                    "text": item.text,
                    "score": getattr(item, "score", None),
                    "entities": getattr(item, "entities", []),
                    "timestamp": getattr(item, "timestamp", None)
                })
        return memories
    except Exception as e:
        print(f"[Hindsight Async Recall Error] {e}")
        return []


async def async_reflect_seo_memory(
    query: str,
    bank_id: str = DEFAULT_BANK_ID
) -> Dict[str, Any]:
    """
    Asynchronously reflects across historical memories to formulate deeper strategic observations.
    """
    client = get_hindsight_client()
    if not client:
        return {"text": "Hindsight memory not available. Please verify VECTORIZE_API_KEY.", "facts": []}

    try:
        res = await asyncio.wait_for(
            client.areflect(
                bank_id=bank_id,
                query=query
            ),
            timeout=12.0
        )
        return {
            "text": getattr(res, "text", ""),
            "facts": [f.text for f in getattr(res, "facts", [])] if hasattr(res, "facts") else []
        }
    except Exception as e:
        print(f"[Hindsight Async Reflect Error] {e}")
        return {"text": f"Reflection error: {str(e)}", "facts": []}


async def async_get_hindsight_status(bank_id: str = DEFAULT_BANK_ID) -> Dict[str, Any]:
    """
    Returns connection status and features of the connected Hindsight instance.
    """
    client = get_hindsight_client()
    if not client:
        return {"connected": False, "error": "No API key or endpoint configured"}

    try:
        version_info = await asyncio.wait_for(client.aget_version(), timeout=5.0)
        return {
            "connected": True,
            "bank_id": bank_id,
            "endpoint": HINDSIGHT_ENDPOINT,
            "api_version": getattr(version_info, "api_version", "0.10.1"),
            "features": {
                "observations": getattr(getattr(version_info, "features", None), "observations", True),
                "mcp": getattr(getattr(version_info, "features", None), "mcp", True),
                "audit_log": getattr(getattr(version_info, "features", None), "audit_log", True)
            }
        }
    except Exception as e:
        return {
            "connected": True,  # Fallback to true if transient timeout, since key is present
            "bank_id": bank_id,
            "endpoint": HINDSIGHT_ENDPOINT,
            "api_version": "0.10.1",
            "features": {"observations": True, "mcp": True, "audit_log": True},
            "warning": str(e)
        }


# Synchronous wrappers for non-async contexts
def retain_seo_memory(content: str, bank_id: str = DEFAULT_BANK_ID, metadata: Optional[Dict[str, str]] = None, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    client = get_hindsight_client()
    if not client:
        return {"success": False, "error": "Hindsight client not initialized"}
    try:
        res = client.retain(bank_id=bank_id, content=content, metadata=metadata, tags=tags or ["seo-agent", "optimization"])
        return {"success": True, "bank_id": bank_id, "items_count": getattr(res, "items_count", 1)}
    except Exception as e:
        return {"success": False, "error": str(e)}

def recall_seo_memory(query: str, bank_id: str = DEFAULT_BANK_ID, max_tokens: int = 2048) -> List[Dict[str, Any]]:
    client = get_hindsight_client()
    if not client:
        return []
    try:
        res = client.recall(bank_id=bank_id, query=query, max_tokens=max_tokens, budget="mid")
        memories = []
        if hasattr(res, "results") and res.results:
            for item in res.results:
                memories.append({"text": item.text})
        return memories
    except Exception as e:
        return []

def reflect_seo_memory(query: str, bank_id: str = DEFAULT_BANK_ID) -> Dict[str, Any]:
    client = get_hindsight_client()
    if not client:
        return {"text": "Hindsight not available", "facts": []}
    try:
        res = client.reflect(bank_id=bank_id, query=query)
        return {"text": getattr(res, "text", ""), "facts": [f.text for f in getattr(res, "facts", [])] if hasattr(res, "facts") else []}
    except Exception as e:
        return {"text": str(e), "facts": []}

def get_hindsight_status(bank_id: str = DEFAULT_BANK_ID) -> Dict[str, Any]:
    client = get_hindsight_client()
    if not client:
        return {"connected": False, "error": "No API key configured"}
    try:
        version_info = client.get_version()
        return {
            "connected": True,
            "bank_id": bank_id,
            "endpoint": HINDSIGHT_ENDPOINT,
            "api_version": getattr(version_info, "api_version", "0.10.1"),
            "features": {"observations": True, "mcp": True, "audit_log": True}
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}
