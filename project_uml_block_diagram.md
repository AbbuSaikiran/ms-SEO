# WarpIndex — Full Project Architecture & UML Block Diagrams

This document contains comprehensive engineering specifications, block diagrams, and UML diagrams for the **WarpIndex (Hindsight SEO & Citation Agent)** platform.

---

## 1. High-Level System Block Diagram

```mermaid
graph TD
    subgraph SENSORS ["1. Data Ingestion & Signal Capture"]
        GSC["Google Search Console API"]
        CRAWL["Headless Web Crawler"]
        CIT_MON["Citation & Brand Mention Monitor"]
        COMP_SCRAPE["Competitor SERP Scraper"]
        GIT_WEBHOOK["GitHub Repo Webhook / Commit Ingest"]
    end

    subgraph INGESTION_BUS ["2. Normalization & Ingestion Bus"]
        NORMALIZER["Data Validator & Normalizer"]
        JOB_QUEUE["Async Task Queue"]
        LOCAL_LOG["Local SQLite Event DB (seo_memory.db)"]
    end

    subgraph AGENT_CORE ["3. Multi-Agent Reasoning Core (FastAPI)"]
        ORCH["Agent Orchestrator"]
        OBS_AGENT["Search Observation Agent"]
        AUDIT_AGENT["Technical SEO Audit Agent"]
        CITE_AGENT["Citation Intelligence Agent"]
        COMP_AGENT["Competitor Spy Agent"]
        PLAN_AGENT["Experiment Planning Agent"]
        SAFE_AGENT["Verification & Safety Guardrails"]
    end

    subgraph HINDSIGHT_LAYER ["4. Hindsight Persistent Memory (Vectorize.io)"]
        RETAIN_OP["Retain API (Store ranking/code events)"]
        RECALL_OP["Recall API (Temporal & entity search)"]
        REFLECT_OP["Reflect API (Strategic belief consolidation)"]
        MEMORY_BANK[("Hindsight Cloud Memory Bank: seo-agent-bank")]
    end

    subgraph EXECUTION_LAYER ["5. Controlled Execution & Deployment"]
        HUMAN_REVIEW{"Human Approval Gate"}
        DIFF_ENGINE["AST / Code Diff Generator"]
        GITHUB_PR["GitHub PR & Commit Engine"]
        CMS_PUSH["CMS Webhook & Headless Deployer"]
        ROLLBACK_MGR["Automated Rollback Manager"]
    end

    subgraph CLIENT_LAYER ["6. Presentation & Management (React / TS)"]
        STUDIO_UI["AIAgentStudio (Live Chat & Trace)"]
        HINDSIGHT_UI["HindsightAI Studio (5-in-1 Tools)"]
        MEMORY_UI["SEOMemoryAgent (Temporal Inspector)"]
        PROJECTS_UI["Multi-Project Management"]
    end

    %% Signal Flow
    SENSORS --> NORMALIZER
    NORMALIZER --> JOB_QUEUE
    NORMALIZER --> LOCAL_LOG
    JOB_QUEUE --> ORCH

    %% Agent Flow
    ORCH --> OBS_AGENT
    ORCH --> AUDIT_AGENT
    ORCH --> CITE_AGENT
    ORCH --> COMP_AGENT
    ORCH --> PLAN_AGENT

    %% Memory Loops
    OBS_AGENT & AUDIT_AGENT & CITE_AGENT & COMP_AGENT & PLAN_AGENT <--> RETAIN_OP & RECALL_OP & REFLECT_OP
    RETAIN_OP & RECALL_OP & REFLECT_OP <--> MEMORY_BANK

    %% Safety & Execution
    PLAN_AGENT --> SAFE_AGENT
    SAFE_AGENT --> HUMAN_REVIEW
    HUMAN_REVIEW -->|Approved| DIFF_ENGINE
    DIFF_ENGINE --> GITHUB_PR & CMS_PUSH
    GITHUB_PR & CMS_PUSH --> ROLLBACK_MGR
    ROLLBACK_MGR -.->|Post-Deploy Outcomes| RETAIN_OP

    %% Client Interactions
    CLIENT_LAYER <--> ORCH
    CLIENT_LAYER <--> MEMORY_BANK
```

---

## 2. UML Component Diagram

```mermaid
componentDiagram
    package "Frontend (React + Vite + Tailwind)" {
        [AIAgentStudio Component] as UI_Studio
        [HindsightAI Component] as UI_Hindsight
        [SEOMemoryAgent Component] as UI_Memory
        [GitHub Client (lib/github.ts)] as UI_GitClient
    }

    package "Backend API (FastAPI)" {
        [REST API Router (main.py)] as APIRouter
        [Agent Orchestrator] as Orchestrator
        [Hindsight Memory Client (memory/hindsight.py)] as HindsightClient
        [Local SQLite Engine (seo_memory_agent.py)] as SQLiteEngine
        [LLM Model Router (Groq / OpenAI)] as LLMRouter
    }

    package "Specialized Agent Workers" {
        [Search Observation Agent] as Agent_Obs
        [SEO Audit Agent] as Agent_Audit
        [Citation Agent] as Agent_Cite
        [Competitor Agent] as Agent_Comp
        [Experiment Planner] as Agent_Plan
        [Safety Guardrail] as Agent_Safe
    }

    package "External Services" {
        database "Vectorize.io (Hindsight Cloud)" as Ext_Hindsight
        database "SQLite (seo_memory.db)" as Ext_SQLite
        cloud "GitHub REST API" as Ext_GitHub
        cloud "Groq Llama-3.3 / GPT-OSS" as Ext_Groq
    }

    %% Frontend to Backend
    UI_Studio --> APIRouter : HTTP POST /agent/run
    UI_Hindsight --> APIRouter : HTTP POST /hindsight/*
    UI_Memory --> APIRouter : HTTP GET/POST /memory/*
    UI_Studio --> UI_GitClient : Direct repo inspections
    UI_GitClient --> Ext_GitHub : Octokit / REST API (with Bearer Token)

    %% Backend internals
    APIRouter --> Orchestrator
    APIRouter --> HindsightClient
    APIRouter --> SQLiteEngine
    
    Orchestrator --> Agent_Obs
    Orchestrator --> Agent_Audit
    Orchestrator --> Agent_Cite
    Orchestrator --> Agent_Comp
    Orchestrator --> Agent_Plan
    Agent_Plan --> Agent_Safe

    %% Agents to LLM & Storage
    Agent_Obs & Agent_Audit & Agent_Cite & Agent_Comp & Agent_Plan --> LLMRouter
    LLMRouter --> Ext_Groq
    HindsightClient --> Ext_Hindsight : Async SDK (Retain/Recall/Reflect)
    SQLiteEngine --> Ext_SQLite
```

---

## 3. UML Sequence Diagram: End-to-End Optimization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Engineer / User
    participant UI as AIAgentStudio (Frontend)
    participant API as FastAPI Backend
    participant Orch as Agent Orchestrator
    participant Mem as Hindsight Memory (Vectorize)
    participant LLM as Groq / Llama-3.3 Engine
    participant Git as GitHub API

    User->>UI: Submit inquiry: "Optimize landing page meta & schema"
    UI->>API: POST /agent/run { prompt, selected_files, github_token }
    
    API->>Mem: async_recall_seo_memory("Landing page schema & meta history")
    Mem-->>API: Return past ranking experiments, failed tags & entity graph
    
    API->>Orch: Dispatch task with context & recalled memory
    Orch->>LLM: Evaluate on-page SEO & generate structured JSON-LD & meta tags
    LLM-->>Orch: Return optimized code diff & rationale
    
    Orch->>API: Pass proposed changes to Safety Verifier
    API->>Mem: async_retain_seo_memory("Generated schema experiment for /")
    Mem-->>API: Event Retained (Bank: seo-agent-bank)
    
    API-->>UI: Return Agent Response & Code Diff Preview
    
    User->>UI: Click "Deploy to GitHub"
    UI->>Git: PUT /repos/{owner}/{repo}/contents/{path} (Bearer Token)
    Git-->>UI: Commit 200 OK (Branch updated / PR Created)
    UI-->>User: Show Live Commit Confirmation & PR Link
```

---

## 4. UML Activity / State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle

    state "Signal Ingestion" as Ingest {
        [*] --> FetchRankingData
        FetchRankingData --> CrawlPageStructure
        CrawlPageStructure --> DetectCompetitorMoves
    }

    state "Memory Recall & Context Building" as MemoryLookup {
        QueryHindsightBank --> RetrieveTemporalEvents
        RetrieveTemporalEvents --> ReflectOnPastFailures
    }

    state "Multi-Agent Synthesis" as Synthesis {
        RunAudit --> GenerateKeywordStrategy
        GenerateKeywordStrategy --> DraftCodeModifications
        DraftCodeModifications --> SchemaSyntaxValidation
    }

    state "Safety & Verification Gate" as SafetyGate {
        CheckE_E_A_T --> ValidateCanonicalRules
        ValidateCanonicalRules --> EvaluateRiskScore
    }

    state "Execution & Retain" as Execution {
        CreateGitHubPR --> RetainExperimentInHindsight
        RetainExperimentInHindsight --> MonitorPostDeploySERP
    }

    Idle --> Ingest : Scheduled Trigger / User Prompt
    Ingest --> MemoryLookup : Form Context
    MemoryLookup --> Synthesis : Enriched Prompt
    Synthesis --> SafetyGate : Candidate Changes
    
    SafetyGate --> Execution : Risk Score < Threshold & Approved
    SafetyGate --> Idle : Rejected / Human Override

    Execution --> Idle : Experiment Completed & Tracked
```

---

## 5. UML Class & Entity Relationship Diagram

```mermaid
classDiagram
    class HindsightClient {
        +String api_endpoint
        +String api_key
        +String bank_id
        +async_retain_seo_memory(content, metadata, tags) Dict
        +async_recall_seo_memory(query, max_tokens, budget) List
        +async_reflect_seo_memory(query) Dict
        +async_get_hindsight_status() Dict
    }

    class RankingHistory {
        +Int id
        +String keyword
        +Int position
        +String url
        +String search_engine
        +DateTime recorded_at
        +String notes
    }

    class OptimizationEvent {
        +Int id
        +String event_type
        +String description
        +String url
        +String keyword
        +Int impact_score
        +DateTime recorded_at
        +String outcome_notes
    }

    class CompetitorMove {
        +Int id
        +String competitor_domain
        +String move_type
        +String description
        +String affected_keyword
        +DateTime recorded_at
    }

    class AgentOrchestrator {
        +dispatch_query(prompt, context)
        +invoke_tool(tool_name, params)
        +synthesize_recommendations()
    }

    class GitHubIntegration {
        +String owner
        +String repo
        +String token
        +getRepoTree()
        +getFileContent(path)
        +pushCodeToGitHub(path, content, message)
    }

    HindsightClient <.. AgentOrchestrator : Recalls/Retains Context
    OptimizationEvent --> HindsightClient : Synced to Cloud
    RankingHistory --> HindsightClient : Synced to Cloud
    CompetitorMove --> HindsightClient : Synced to Cloud
    AgentOrchestrator --> GitHubIntegration : Creates PRs / Writes Code
```

---

## 6. Data Flow Diagram (DFD Level 1)

```
 [Google Search Console / SERP]
               │
               ▼ (Raw Performance Metrics)
    ┌──────────────────────┐
    │ 1.0 Signal Ingestion │ ────► [(DB: SQLite seo_memory.db)]
    └──────────────────────┘
               │
               ▼ (Normalized SEO Records)
    ┌──────────────────────┐
    │ 2.0 Memory Retain &  │ ◄───► [(Hindsight Vectorize Memory Bank)]
    │     Recall Engine    │
    └──────────────────────┘
               │
               ▼ (Temporal & Entity Enriched Context)
    ┌──────────────────────┐
    │ 3.0 Agent Synthesis  │ ◄───► [(Groq / Llama-3.3 LLMs)]
    │     & Plan Generator │
    └──────────────────────┘
               │
               ▼ (Proposed Diff / Schema Markup)
    ┌──────────────────────┐
    │ 4.0 Verification &   │
    │     Safety Check     │
    └──────────────────────┘
               │
               ▼ (Approved Patch)
    ┌──────────────────────┐
    │ 5.0 GitHub Action &  │ ────► [Target GitHub Repository]
    │     PR Deployment    │
    └──────────────────────┘
```
