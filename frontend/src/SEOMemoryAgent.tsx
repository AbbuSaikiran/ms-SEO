import React, { useState, useEffect } from "react";

const API = "http://localhost:8000";

interface RankingEntry { id: number; keyword: string; position: number; url: string; search_engine: string; recorded_at: string; notes: string; }
interface OptimizationEntry { id: number; event_type: string; description: string; keyword: string; impact_score: number; recorded_at: string; outcome_notes: string; }
interface CompetitorEntry { id: number; competitor_domain: string; move_type: string; description: string; affected_keyword: string; recorded_at: string; }
interface CitationEntry { id: number; source_url: string; brand_name: string; citation_type: string; domain_authority: number; recorded_at: string; }

const EVENT_TYPES = ["content", "technical", "backlink", "meta", "schema"];
const MOVE_TYPES = ["content_update", "new_page", "backlink_gain", "ranking_jump"];
const CITATION_TYPES = ["backlink", "brand_mention", "nap_citation"];

function ImpactBadge({ score }: { score: number }) {
  const color = score > 2 ? "#22c55e" : score > 0 ? "#84cc16" : score < -2 ? "#ef4444" : score < 0 ? "#f97316" : "#64748b";
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{score > 0 ? `+${score}` : score}/5</span>;
}

export default function SEOMemoryAgent() {
  const [tab, setTab] = useState<"dashboard" | "rankings" | "optimizations" | "competitors" | "citations" | "analyze">("dashboard");
  const [history, setHistory] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeQuestion, setAnalyzeQuestion] = useState("What should I do next to improve my SEO based on my history?");
  const [analyzeKeyword, setAnalyzeKeyword] = useState("");

  // Log forms
  const [rankForm, setRankForm] = useState({ keyword: "", position: "", url: "", search_engine: "Google", notes: "" });
  const [optForm, setOptForm] = useState({ event_type: "content", description: "", url: "", keyword: "", impact_score: "0", outcome_notes: "" });
  const [compForm, setCompForm] = useState({ competitor_domain: "", move_type: "content_update", description: "", affected_keyword: "" });
  const [citeForm, setCiteForm] = useState({ source_url: "", brand_name: "", citation_type: "brand_mention", mention_text: "", domain_authority: "0" });
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    const res = await fetch(`${API}/agent/full-history`);
    const data = await res.json();
    setHistory(data);
  }

  async function logRanking() {
    const res = await fetch(`${API}/agent/log-ranking`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rankForm, position: parseInt(rankForm.position) }) });
    await res.json();
    setFormMsg(`✅ Ranking logged for "${rankForm.keyword}" at position ${rankForm.position}`);
    setRankForm({ keyword: "", position: "", url: "", search_engine: "Google", notes: "" });
    fetchHistory();
  }

  async function logOptimization() {
    await fetch(`${API}/agent/log-optimization`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...optForm, impact_score: parseInt(optForm.impact_score) }) });
    setFormMsg(`✅ Optimization event logged`);
    setOptForm({ event_type: "content", description: "", url: "", keyword: "", impact_score: "0", outcome_notes: "" });
    fetchHistory();
  }

  async function logCompetitor() {
    await fetch(`${API}/agent/log-competitor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(compForm) });
    setFormMsg(`✅ Competitor move logged`);
    setCompForm({ competitor_domain: "", move_type: "content_update", description: "", affected_keyword: "" });
    fetchHistory();
  }

  async function logCitation() {
    await fetch(`${API}/agent/log-citation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...citeForm, domain_authority: parseInt(citeForm.domain_authority) }) });
    setFormMsg(`✅ Citation logged`);
    setCiteForm({ source_url: "", brand_name: "", citation_type: "brand_mention", mention_text: "", domain_authority: "0" });
    fetchHistory();
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisResult("");
    const res = await fetch(`${API}/agent/analyze`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: analyzeKeyword, question: analyzeQuestion, session_id: `session-${Date.now()}` })
    });
    const d = await res.json();
    setAnalysisResult(d.output || "No response.");
    setAnalyzing(false);
    fetchHistory();
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box"
  };
  const btnStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13
  };
  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: 16, marginBottom: 12
  };

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "rankings", label: "📈 Log Ranking" },
    { id: "optimizations", label: "⚙️ Log Optimization" },
    { id: "competitors", label: "🕵️ Competitors" },
    { id: "citations", label: "🔗 Citations" },
    { id: "analyze", label: "🧠 AI Analyze" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#e2e8f0", minHeight: "100vh", padding: "24px 0" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #818cf8, #a78bfa, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🧠 SEO & Citation Memory Agent
          </h1>
          <p style={{ color: "#94a3b8", margin: "6px 0 0", fontSize: 14 }}>
            Remembers your full ranking history, optimizations, competitor moves & citations. Makes smarter recommendations over time.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as any); setFormMsg(""); }}
              style={{ ...btnStyle, background: tab === t.id ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", fontSize: 12, padding: "8px 14px" }}>
              {t.label}
            </button>
          ))}
        </div>

        {formMsg && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#22c55e" }}>{formMsg}</div>}

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Rankings Logged", value: history?.rankings?.length ?? 0, icon: "📈", color: "#818cf8" },
                { label: "Optimizations", value: history?.optimizations?.length ?? 0, icon: "⚙️", color: "#a78bfa" },
                { label: "Competitor Moves", value: history?.competitors?.length ?? 0, icon: "🕵️", color: "#f59e0b" },
                { label: "Citations", value: history?.citations?.length ?? 0, icon: "🔗", color: "#38bdf8" },
                { label: "AI Sessions", value: history?.past_recommendations?.length ?? 0, icon: "🧠", color: "#22c55e" },
              ].map(stat => (
                <div key={stat.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {history?.rankings?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#818cf8" }}>📈 Recent Rankings</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ color: "#64748b" }}>{["Keyword", "Position", "Engine", "Date", "Notes"].map(h => <th key={h} style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>)}</tr></thead>
                  <tbody>{history.rankings.slice(0, 10).map((r: RankingEntry) => (
                    <tr key={r.id}><td style={{ padding: "6px 8px" }}>{r.keyword}</td><td style={{ padding: "6px 8px", fontWeight: 700, color: r.position <= 3 ? "#22c55e" : r.position <= 10 ? "#f59e0b" : "#ef4444" }}>#{r.position}</td><td style={{ padding: "6px 8px", color: "#64748b" }}>{r.search_engine}</td><td style={{ padding: "6px 8px", color: "#64748b" }}>{r.recorded_at.slice(0, 10)}</td><td style={{ padding: "6px 8px", color: "#94a3b8" }}>{r.notes}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {history?.optimizations?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#a78bfa" }}>⚙️ Recent Optimizations</h3>
                {history.optimizations.slice(0, 6).map((o: OptimizationEntry) => (
                  <div key={o.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ background: "rgba(99,102,241,0.2)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#818cf8", flexShrink: 0 }}>{o.event_type}</span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div>{o.description}</div>
                      {o.keyword && <div style={{ color: "#64748b", marginTop: 2 }}>Keyword: {o.keyword}</div>}
                    </div>
                    <ImpactBadge score={o.impact_score} />
                    <span style={{ color: "#64748b", fontSize: 11 }}>{o.recorded_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            {history?.past_recommendations?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#22c55e" }}>🧠 Last AI Analysis</h3>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {history.past_recommendations[0]?.recommendation?.slice(0, 600)}...
                </div>
              </div>
            )}

            {(!history || (history.rankings.length === 0 && history.optimizations.length === 0)) && (
              <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No history yet</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Start logging rankings, optimizations, and competitor moves.<br />The agent will remember everything and make smarter recommendations over time.</div>
              </div>
            )}
          </div>
        )}

        {/* ── LOG RANKING ── */}
        {tab === "rankings" && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 16px", color: "#818cf8" }}>📈 Log Keyword Ranking</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Keyword *</label><input style={inputStyle} value={rankForm.keyword} onChange={e => setRankForm({ ...rankForm, keyword: e.target.value })} placeholder="e.g. best seo tools" /></div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Position *</label><input style={inputStyle} type="number" value={rankForm.position} onChange={e => setRankForm({ ...rankForm, position: e.target.value })} placeholder="e.g. 7" /></div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Page URL</label><input style={inputStyle} value={rankForm.url} onChange={e => setRankForm({ ...rankForm, url: e.target.value })} placeholder="https://yoursite.com/page" /></div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Search Engine</label>
                <select style={inputStyle} value={rankForm.search_engine} onChange={e => setRankForm({ ...rankForm, search_engine: e.target.value })}>
                  {["Google", "Bing", "DuckDuckGo", "Yahoo"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 12, color: "#64748b" }}>Notes</label><input style={inputStyle} value={rankForm.notes} onChange={e => setRankForm({ ...rankForm, notes: e.target.value })} placeholder="Any relevant context..." /></div>
            </div>
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={logRanking} disabled={!rankForm.keyword || !rankForm.position}>Log Ranking</button>
          </div>
        )}

        {/* ── LOG OPTIMIZATION ── */}
        {tab === "optimizations" && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 16px", color: "#a78bfa" }}>⚙️ Log Optimization Event</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Event Type *</label>
                <select style={inputStyle} value={optForm.event_type} onChange={e => setOptForm({ ...optForm, event_type: e.target.value })}>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Related Keyword</label><input style={inputStyle} value={optForm.keyword} onChange={e => setOptForm({ ...optForm, keyword: e.target.value })} placeholder="e.g. seo tools 2024" /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 12, color: "#64748b" }}>Description *</label><textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={optForm.description} onChange={e => setOptForm({ ...optForm, description: e.target.value })} placeholder="What did you change? e.g. Rewrote meta title and added FAQ schema to /blog/seo-guide" /></div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Page URL</label><input style={inputStyle} value={optForm.url} onChange={e => setOptForm({ ...optForm, url: e.target.value })} placeholder="https://yoursite.com/page" /></div>
              <div><label style={{ fontSize: 12, color: "#64748b" }}>Impact Score (-5 to +5)</label><input style={inputStyle} type="number" min={-5} max={5} value={optForm.impact_score} onChange={e => setOptForm({ ...optForm, impact_score: e.target.value })} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 12, color: "#64748b" }}>Outcome Notes</label><input style={inputStyle} value={optForm.outcome_notes} onChange={e => setOptForm({ ...optForm, outcome_notes: e.target.value })} placeholder="What happened after? e.g. Position improved from 12 to 5 within 2 weeks" /></div>
            </div>
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={logOptimization} disabled={!optForm.description}>Log Event</button>
          </div>
        )}

        {/* ── COMPETITORS ── */}
        {tab === "competitors" && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px", color: "#f59e0b" }}>🕵️ Log Competitor Move</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Competitor Domain *</label><input style={inputStyle} value={compForm.competitor_domain} onChange={e => setCompForm({ ...compForm, competitor_domain: e.target.value })} placeholder="competitor.com" /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Move Type *</label>
                  <select style={inputStyle} value={compForm.move_type} onChange={e => setCompForm({ ...compForm, move_type: e.target.value })}>
                    {MOVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 12, color: "#64748b" }}>Description *</label><textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={compForm.description} onChange={e => setCompForm({ ...compForm, description: e.target.value })} placeholder="e.g. Published a 5000-word guide on 'best seo tools' outranking our page" /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Affected Keyword</label><input style={inputStyle} value={compForm.affected_keyword} onChange={e => setCompForm({ ...compForm, affected_keyword: e.target.value })} placeholder="e.g. best seo tools" /></div>
              </div>
              <button style={{ ...btnStyle, marginTop: 16 }} onClick={logCompetitor} disabled={!compForm.competitor_domain || !compForm.description}>Log Move</button>
            </div>
            {history?.competitors?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 12px", color: "#f59e0b", fontSize: 15 }}>Recent Competitor Moves</h3>
                {history.competitors.map((c: CompetitorEntry) => (
                  <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#f59e0b" }}>{c.competitor_domain}</span>
                      <span style={{ background: "rgba(245,158,11,0.15)", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#f59e0b" }}>{c.move_type}</span>
                      <span style={{ color: "#64748b", marginLeft: "auto" }}>{c.recorded_at.slice(0, 10)}</span>
                    </div>
                    <div style={{ color: "#94a3b8" }}>{c.description}</div>
                    {c.affected_keyword && <div style={{ color: "#64748b", marginTop: 2 }}>Keyword: {c.affected_keyword}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CITATIONS ── */}
        {tab === "citations" && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px", color: "#38bdf8" }}>🔗 Log Citation / Brand Mention</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 12, color: "#64748b" }}>Source URL *</label><input style={inputStyle} value={citeForm.source_url} onChange={e => setCiteForm({ ...citeForm, source_url: e.target.value })} placeholder="https://referring-site.com/page" /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Brand Name *</label><input style={inputStyle} value={citeForm.brand_name} onChange={e => setCiteForm({ ...citeForm, brand_name: e.target.value })} placeholder="Your Brand Name" /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Citation Type</label>
                  <select style={inputStyle} value={citeForm.citation_type} onChange={e => setCiteForm({ ...citeForm, citation_type: e.target.value })}>
                    {CITATION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Domain Authority (0-100)</label><input style={inputStyle} type="number" min={0} max={100} value={citeForm.domain_authority} onChange={e => setCiteForm({ ...citeForm, domain_authority: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Mention Text</label><input style={inputStyle} value={citeForm.mention_text} onChange={e => setCiteForm({ ...citeForm, mention_text: e.target.value })} placeholder="Excerpt of text mentioning your brand..." /></div>
              </div>
              <button style={{ ...btnStyle, marginTop: 16 }} onClick={logCitation} disabled={!citeForm.source_url || !citeForm.brand_name}>Log Citation</button>
            </div>
            {history?.citations?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 12px", color: "#38bdf8", fontSize: 15 }}>Recent Citations</h3>
                {history.citations.map((c: CitationEntry) => (
                  <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#38bdf8", flex: 1 }}>{c.source_url}</span>
                      <span style={{ background: "rgba(56,189,248,0.15)", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#38bdf8" }}>{c.citation_type}</span>
                      {c.domain_authority > 0 && <span style={{ color: "#f59e0b", fontSize: 11 }}>DA {c.domain_authority}</span>}
                      <span style={{ color: "#64748b" }}>{c.recorded_at.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI ANALYZE ── */}
        {tab === "analyze" && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 6px", color: "#22c55e" }}>🧠 AI Memory Analysis</h3>
              <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 16px" }}>The agent reads your full history and generates prioritized, context-aware SEO recommendations.</p>
              <div style={{ display: "grid", gap: 12 }}>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Focus Keyword (optional)</label><input style={inputStyle} value={analyzeKeyword} onChange={e => setAnalyzeKeyword(e.target.value)} placeholder="Leave empty for full site analysis" /></div>
                <div><label style={{ fontSize: 12, color: "#64748b" }}>Your Question</label><textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={analyzeQuestion} onChange={e => setAnalyzeQuestion(e.target.value)} /></div>
              </div>
              <button style={{ ...btnStyle, marginTop: 16, opacity: analyzing ? 0.7 : 1 }} onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? "🧠 Analyzing history..." : "🧠 Run Memory Analysis"}
              </button>
            </div>
            {analysisResult && (
              <div style={{ ...cardStyle, borderColor: "rgba(34,197,94,0.3)" }}>
                <h3 style={{ margin: "0 0 12px", color: "#22c55e", fontSize: 15 }}>📋 Agent Recommendation</h3>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{analysisResult}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
