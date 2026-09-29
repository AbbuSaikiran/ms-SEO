"""
Hindsight AI — Unified SEO Optimization Engine
Specialized agents combining capabilities of Surfer SEO, Ahrefs, Jasper, Semrush & Alli AI
All powered by Groq free tier (llama-3.3-70b-versatile)
"""

import os
import openai
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openai/gpt-oss-120b")
FAST_MODEL = os.getenv("FAST_MODEL", "openai/gpt-oss-20b")


import httpx
import asyncio

def get_groq_client():
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(45.0, connect=12.0),
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
    )
    return openai.AsyncOpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        http_client=http_client,
        max_retries=2
    )


async def _call_groq(system: str, user: str, fast: bool = False, max_tokens: int = 2048) -> str:
    preferred = FAST_MODEL if fast else DEFAULT_MODEL
    candidate_models = [preferred, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"]
    seen = set()
    models = [m for m in candidate_models if not (m in seen or seen.add(m))]
    
    last_err = ""
    for attempt in range(2):
        try:
            client = get_groq_client()
            for model in models:
                try:
                    res = await client.chat.completions.create(
                        model=model,
                        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
                        temperature=0.7,
                        max_tokens=max_tokens
                    )
                    return res.choices[0].message.content
                except (openai.RateLimitError, openai.NotFoundError):
                    continue
                except openai.APIConnectionError as ce:
                    last_err = f"Connection error: {str(ce)}"
                    break
        except Exception as e:
            last_err = str(e)
            if attempt == 0:
                await asyncio.sleep(1.0)
                continue
    return f"Groq Error: {last_err}"


# ─── TOOL 1: KEYWORD INTELLIGENCE (Ahrefs + Semrush) ────────────────────────

async def keyword_intelligence(seed_keyword: str, niche: str = "") -> str:
    system = """You are a world-class SEO Keyword Intelligence Expert combining the data depth of Ahrefs and Semrush.

Analyze the provided keyword and generate a comprehensive keyword intelligence report including:
1. **Keyword Clusters**: 15-20 semantically related keywords grouped by intent (informational, navigational, commercial, transactional)
2. **Difficulty Analysis**: For each keyword, estimate: Search Volume (low/medium/high), Keyword Difficulty (1-100), CPC range
3. **Long-tail Opportunities**: 10 low-competition, high-intent long-tail variations
4. **LSI Keywords**: 15 Latent Semantic Indexing terms that must appear in top-ranking content
5. **Featured Snippet Opportunities**: Keywords where you can win Position 0
6. **Content Gaps**: Topics competitors likely cover that you should too
7. **Search Intent Map**: What users actually want when searching each cluster

Format as clean markdown with tables where helpful."""

    user = f"Seed keyword: **{seed_keyword}**\nNiche/Industry: {niche or 'General'}\n\nGenerate a comprehensive keyword intelligence report."
    return await _call_groq(system, user, max_tokens=2500)


# ─── TOOL 2: CONTENT OPTIMIZER (Surfer SEO) ──────────────────────────────────

async def content_optimizer(content: str, target_keyword: str, url: str = "") -> str:
    system = """You are the world's most advanced Content Optimizer, combining Surfer SEO's NLP analysis with deep SEO expertise.

Analyze the provided content and generate a detailed optimization report:
1. **Content Score**: Rate the content 0-100 and explain why
2. **Keyword Usage Analysis**: 
   - Target keyword density (current vs recommended)
   - Missing keyword variations
   - Over-optimized phrases to fix
3. **NLP/Semantic Terms Missing**: List 20+ terms that top-ranking pages use that are missing
4. **Heading Structure**: Evaluate H1/H2/H3 hierarchy, suggest improvements
5. **Content Length**: Current vs recommended word count for this topic
6. **Readability**: Flesch score estimate, sentence complexity issues
7. **E-E-A-T Signals**: What expertise, authority, trust signals are missing
8. **Internal Linking Opportunities**: Suggest anchor texts and where to add links
9. **Quick Wins**: Top 5 changes that will have the biggest ranking impact
10. **Rewritten Intro**: Provide an improved, hook-driven introduction

Format as actionable markdown report."""

    user = f"Target Keyword: **{target_keyword}**\nURL: {url or 'Not specified'}\n\nContent to analyze:\n---\n{content[:3000]}\n---"
    return await _call_groq(system, user, max_tokens=2500)


# ─── TOOL 3: AI CONTENT WRITER (Jasper) ──────────────────────────────────────

async def ai_content_writer(topic: str, content_type: str, tone: str = "professional",
                             target_keyword: str = "", word_count: int = 800) -> str:
    system = f"""You are an elite SEO Content Writer combining Jasper AI's creativity with deep SEO expertise.

Write content that:
- Ranks on page 1 of Google by satisfying search intent perfectly
- Naturally integrates the target keyword and semantic variations
- Follows E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)
- Uses power words and emotional triggers for engagement
- Has scannable structure with clear H2s and H3s
- Includes a compelling CTA
- Tone: {tone}
- Target length: approximately {word_count} words

The content must be publication-ready with NO placeholders."""

    content_type_instructions = {
        "blog_post": "Write a complete, SEO-optimized blog post with introduction, body sections with H2/H3 headings, and conclusion.",
        "meta_tags": "Write: (1) SEO title tag (50-60 chars), (2) Meta description (150-160 chars), (3) OG title, (4) OG description. Include the target keyword naturally.",
        "product_description": "Write a compelling, keyword-rich product description that converts browsers into buyers.",
        "landing_page": "Write a complete landing page copy: headline, subheadline, benefits, features, social proof section, and CTA.",
        "faq_section": "Write 10 FAQ questions and detailed answers that target long-tail keywords and featured snippet opportunities.",
        "schema_markup": "Generate complete JSON-LD schema markup (Article, FAQPage, or BreadcrumbList as appropriate) for this content."
    }

    instruction = content_type_instructions.get(content_type, content_type_instructions["blog_post"])
    user = f"Topic: **{topic}**\nTarget Keyword: {target_keyword or topic}\n\n{instruction}"
    return await _call_groq(system, user, max_tokens=3000)


# ─── TOOL 4: SITE AUDIT (Semrush) ────────────────────────────────────────────

async def site_audit(site_url: str, site_description: str = "") -> str:
    system = """You are an elite Technical SEO Auditor combining Semrush's site audit capabilities with deep technical expertise.

Generate a comprehensive technical SEO audit with:
1. **Critical Issues** (P0 - Fix immediately): Issues causing ranking loss right now
2. **High Priority** (P1): Issues significantly impacting performance
3. **Medium Priority** (P2): Important improvements
4. **Core Web Vitals Checklist**: LCP, FID/INP, CLS targets and how to achieve them
5. **Crawlability & Indexation**:
   - robots.txt recommendations
   - XML sitemap structure
   - Canonical tag strategy
   - Pagination handling
6. **On-Page SEO Checklist**: 20-point checklist with pass/fail for typical sites
7. **Schema Markup Opportunities**: Which schemas to implement and why
8. **Mobile Optimization**: Key mobile SEO factors to check
9. **Page Speed Quick Wins**: Top 5 performance improvements
10. **Internal Link Architecture**: Recommended silo structure
11. **30-Day Action Plan**: Prioritized week-by-week tasks

Format as detailed, actionable markdown with checkboxes where appropriate."""

    user = f"Site URL: **{site_url}**\nSite description: {site_description or 'Not provided'}\n\nGenerate a comprehensive technical SEO audit."
    return await _call_groq(system, user, max_tokens=3000)


# ─── TOOL 5: COMPETITOR SPY (Ahrefs) ─────────────────────────────────────────

async def competitor_spy(my_domain: str, competitor_domains: str, target_keyword: str = "") -> str:
    system = """You are an elite Competitive Intelligence Analyst combining Ahrefs' link analysis with strategic SEO expertise.

Analyze the competitive landscape and generate:
1. **Competitor Strength Assessment**: For each competitor, assess their likely authority and content strategy
2. **Content Gap Analysis**: Topics and keywords they rank for that you should target
3. **Backlink Strategy Reverse Engineering**: 
   - Types of sites that likely link to them
   - Link building tactics they use (guest posts, HARO, directories, etc.)
   - Easy wins you can replicate
4. **Content Format Analysis**: What content types perform best in this niche (video, long-form, tools, listicles)
5. **SERP Feature Opportunities**: Featured snippets, People Also Ask, image packs you can win
6. **Differentiation Strategy**: How to position your content as superior
7. **Quick Win Keywords**: Low-competition keywords competitors rank for that you can outrank fast
8. **Link Velocity Recommendation**: How many links per month to build to compete
9. **Content Calendar**: 12 content ideas to outrank competitors
10. **Red Ocean vs Blue Ocean**: Keywords where competition is beatable vs avoid

Format as strategic markdown report with clear action items."""

    user = f"My domain: **{my_domain}**\nCompetitors: {competitor_domains}\nTarget keyword/niche: {target_keyword or 'General'}\n\nGenerate competitive intelligence report."
    return await _call_groq(system, user, max_tokens=2500)


# ─── TOOL 6: SCHEMA GENERATOR ────────────────────────────────────────────────

async def schema_generator(page_type: str, page_details: str) -> str:
    system = """You are a Schema Markup Expert specializing in structured data for Google Rich Results.

Generate complete, valid JSON-LD schema markup that:
- Follows Google's official schema.org guidelines
- Maximizes rich result eligibility
- Includes all recommended properties (not just required)
- Passes Google's Rich Results Test
- Includes multiple schema types where appropriate (e.g., Article + BreadcrumbList + FAQPage)

Also provide:
1. Complete JSON-LD code (ready to copy-paste into <head>)
2. Which rich results this enables
3. Implementation instructions
4. Common mistakes to avoid
5. Testing instructions (Rich Results Test URL)"""

    user = f"Page type: **{page_type}**\nPage details:\n{page_details}"
    return await _call_groq(system, user, max_tokens=2000)


# ─── TOOL 7: LINK BUILDING PLANNER ───────────────────────────────────────────

async def link_building_planner(domain: str, niche: str, current_authority: str = "new") -> str:
    system = """You are an elite Link Building Strategist combining the best of Ahrefs, Semrush, and Moz's link intelligence.

Create a comprehensive link building plan:
1. **Authority Building Roadmap**: Month-by-month plan based on current authority level
2. **Quick Win Opportunities** (get links in 1-2 weeks):
   - Free directory submissions (with actual site names)
   - Resource page link building targets
   - Broken link building approach
3. **Guest Posting Strategy**:
   - How to find targets
   - Pitch template
   - Topic angles that get accepted
4. **HARO / Journalist Outreach**: How to use Help a Reporter Out effectively
5. **Digital PR Ideas**: 10 linkable asset ideas specific to the niche
6. **Local Citation Building**: If applicable, NAP citation sources
7. **Internal Link Optimization**: How to pass link equity effectively
8. **Anchor Text Strategy**: Recommended distribution (branded/naked/exact/partial)
9. **Link Velocity**: Safe monthly link acquisition targets
10. **Red Flags to Avoid**: Link schemes that trigger Google penalties

Format as actionable plan with specific tactics and templates."""

    user = f"Domain: **{domain}**\nNiche: {niche}\nCurrent authority level: {current_authority}\n\nGenerate a comprehensive link building plan."
    return await _call_groq(system, user, max_tokens=2500)
