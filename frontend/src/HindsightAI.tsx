import React, { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = [
  {
    id: "keywords",
    icon: "🔍",
    name: "Keyword Intelligence",
    tagline: "Ahrefs + Semrush",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.4)",
    endpoint: "/hindsight/keywords",
    description: "Discover keyword clusters, search intent, long-tail opportunities, LSI terms and featured snippet gaps.",
    fields: [
      { key: "seed_keyword", label: "Seed Keyword", placeholder: "e.g. best project management software", required: true },
      { key: "niche", label: "Niche / Industry", placeholder: "e.g. SaaS, e-commerce, health" },
    ],
  },
  {
    id: "optimize",
    icon: "📊",
    name: "Content Optimizer",
    tagline: "Surfer SEO",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    endpoint: "/hindsight/optimize",
    description: "Score your content, find missing NLP terms, fix keyword density, and get E-E-A-T recommendations.",
    fields: [
      { key: "target_keyword", label: "Target Keyword", placeholder: "e.g. best CRM software 2024", required: true },
      { key: "url", label: "Page URL (optional)", placeholder: "https://yoursite.com/page" },
      { key: "content", label: "Paste Your Content", placeholder: "Paste the full content of the page you want to optimize...", multiline: true, required: true },
    ],
  },
  {
    id: "write",
    icon: "✍️",
    name: "AI Content Writer",
    tagline: "Jasper AI",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    endpoint: "/hindsight/write",
    description: "Generate rank-ready blog posts, meta tags, landing pages, FAQs, and product descriptions.",
    fields: [
      { key: "topic", label: "Topic", placeholder: "e.g. How to choose project management software", required: true },
      { key: "target_keyword", label: "Target Keyword", placeholder: "e.g. project management software" },
      { key: "content_type", label: "Content Type", type: "select", options: ["blog_post", "meta_tags", "product_description", "landing_page", "faq_section", "schema_markup"] },
      { key: "tone", label: "Tone", type: "select", options: ["professional", "conversational", "authoritative", "friendly", "educational", "persuasive"] },
      { key: "word_count", label: "Word Count", type: "number", placeholder: "800" },
    ],
  },
  {
    id: "audit",
    icon: "🔎",
    name: "Site Audit",
    tagline: "Semrush",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    endpoint: "/hindsight/audit",
    description: "Get a full technical SEO audit: Core Web Vitals, crawlability, on-page issues, and a 30-day action plan.",
    fields: [
      { key: "site_url", label: "Site URL", placeholder: "https://yoursite.com", required: true },
      { key: "site_description", label: "Site Description", placeholder: "e.g. SaaS tool for marketing teams, built on WordPress, 500 pages" },
    ],
  },
  {
    id: "competitor",
    icon: "🕵️",
    name: "Competitor Spy",
    tagline: "Ahrefs",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.4)",
    endpoint: "/hindsight/competitor",
    description: "Reverse-engineer competitors' content strategy, backlink sources, and keyword gaps.",
    fields: [
      { key: "my_domain", label: "Your Domain", placeholder: "yoursite.com", required: true },
      { key: "competitor_domains", label: "Competitor Domains", placeholder: "competitor1.com, competitor2.com, competitor3.com", required: true },
      { key: "target_keyword", label: "Target Keyword / Niche", placeholder: "e.g. project management software" },
    ],
  },
  {
    id: "schema",
    icon: "🗂️",
    name: "Schema Generator",
    tagline: "Rich Results",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    endpoint: "/hindsight/schema",
    description: "Generate valid JSON-LD schema markup to unlock rich results: FAQs, articles, products, events and more.",
    fields: [
      { key: "page_type", label: "Page Type", type: "select", options: ["article", "product", "local_business", "faq", "how_to", "recipe", "event", "course"] },
      { key: "page_details", label: "Page Details", placeholder: "Describe your page: title, main topic, author name, publish date, etc.", multiline: true, required: true },
    ],
  },
  {
    id: "links",
    icon: "🔗",
    name: "Link Building Planner",
    tagline: "Ahrefs + Moz",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.4)",
    endpoint: "/hindsight/links",
    description: "Get a month-by-month link building roadmap, HARO tactics, guest post templates and anchor text strategy.",
    fields: [
      { key: "domain", label: "Your Domain", placeholder: "yoursite.com", required: true },
      { key: "niche", label: "Niche", placeholder: "e.g. SaaS, health & wellness, e-commerce", required: true },
      { key: "current_authority", label: "Current Authority Level", type: "select", options: ["new", "low (DA 1-20)", "medium (DA 21-50)", "high (DA 51+)"] },
    ],
  },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.75, color: "#cbd5e1" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} style={{ color: "#818cf8", fontSize: 16, fontWeight: 700, margin: "20px 0 8px", borderBottom: "1px solid rgba(129,140,248,0.2)", paddingBottom: 6 }}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ color: "#a78bfa", fontSize: 14, fontWeight: 700, margin: "14px 0 6px" }}>{line.slice(4)}</h3>;
        if (line.startsWith("# ")) return <h1 key={i} style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ display: "flex", gap: 8, margin: "3px 0" }}><span style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }}>▸</span><span>{renderInline(line.slice(2))}</span></div>;
        if (/^\d+\. /.test(line)) { const [num, ...rest] = line.split(". "); return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0" }}><span style={{ color: "#6366f1", fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{num}.</span><span>{renderInline(rest.join(". "))}</span></div>; }
        if (line.startsWith("```")) return <div key={i} style={{ display: "none" }} />;
        if (line.startsWith("|")) return <div key={i} style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8", background: "rgba(255,255,255,0.03)", padding: "2px 8px", margin: "1px 0" }}>{line}</div>;
        if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "4px 0" }}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ color: "#e2e8f0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#22c55e" : "#94a3b8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HindsightAI() {
  const [activeTool, setActiveTool] = useState(TOOLS[0]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResult("");
    setFormData({});
  }, [activeTool.id]);

  async function runTool() {
    const required = activeTool.fields.filter(f => f.required);
    for (const f of required) {
      if (!formData[f.key]?.trim()) { alert(`"${f.label}" is required.`); return; }
    }

    setLoading(true);
    setResult("");
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);

    try {
      const body: Record<string, any> = {};
      activeTool.fields.forEach(f => {
        const val = formData[f.key] || (f.type === "number" ? "800" : f.options?.[0] || "");
        body[f.key] = f.type === "number" ? parseInt(val) : val;
      });

      const res = await fetch(`${API}${activeTool.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setResult(data.output || "No output.");
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }

    clearInterval(timerRef.current);
    setLoading(false);
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#e2e8f0",
    padding: "10px 14px", fontSize: 13,
    outline: "none", transition: "border-color 0.2s",
    fontFamily: "inherit"
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#e2e8f0" }}>
      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: "10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -100, right: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 20, fontSize: 12, color: "#818cf8", fontWeight: 600, letterSpacing: 1 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            HINDSIGHT AI — LIVE
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 12px", background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #38bdf8 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
            All-in-One SEO Optimization Engine
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 580, margin: "0 auto 8px" }}>
            Combines the capabilities of Surfer SEO, Ahrefs, Jasper, Semrush & Alli AI into a single powerhouse.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {["Surfer SEO", "Ahrefs", "Jasper", "Semrush", "Alli AI"].map(t => (
              <span key={t} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "3px 12px", fontSize: 11, color: "#94a3b8" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Tool grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginBottom: 32 }}>
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool)}
              style={{
                background: activeTool.id === tool.id ? `linear-gradient(135deg, ${tool.color}22, ${tool.color}11)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeTool.id === tool.id ? tool.color + "66" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s", boxShadow: activeTool.id === tool.id ? `0 0 20px ${tool.glow}` : "none",
                transform: activeTool.id === tool.id ? "translateY(-2px)" : "none"
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{tool.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: activeTool.id === tool.id ? "#e2e8f0" : "#94a3b8", marginBottom: 3 }}>{tool.name}</div>
              <div style={{ fontSize: 10, color: activeTool.id === tool.id ? tool.color : "#475569", fontWeight: 600 }}>{tool.tagline}</div>
            </button>
          ))}
        </div>

        {/* Active tool panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Left: Form */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${activeTool.color}33`, borderRadius: 18, padding: 24, backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${activeTool.color}22`, border: `1px solid ${activeTool.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {activeTool.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#e2e8f0" }}>{activeTool.name}</div>
                <div style={{ fontSize: 11, color: activeTool.color, fontWeight: 600 }}>Powered by {activeTool.tagline}</div>
              </div>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{activeTool.description}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTool.fields.map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {field.label}{field.required && <span style={{ color: activeTool.color }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select style={{ ...inputStyle, appearance: "none" as any }}
                      value={formData[field.key] || field.options![0]}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}>
                      {field.options!.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                    </select>
                  ) : field.multiline ? (
                    <textarea rows={5} style={{ ...inputStyle, resize: "vertical" as any, minHeight: 110 }}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : (
                    <input type={field.type || "text"} style={inputStyle}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>

            <button onClick={runTool} disabled={loading}
              style={{
                marginTop: 20, width: "100%", padding: "13px 24px",
                background: loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${activeTool.color}, ${activeTool.color}cc)`,
                border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
                boxShadow: loading ? "none" : `0 4px 20px ${activeTool.glow}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  Analyzing... {elapsedTime}s
                </>
              ) : (
                <>⚡ Run {activeTool.name}</>
              )}
            </button>
          </div>

          {/* Right: Output */}
          <div ref={outputRef} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, minHeight: 400, backdropFilter: "blur(10px)" }}>
            {!result && !loading && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>{activeTool.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Ready to analyze</div>
                <div style={{ fontSize: 13, color: "#334155" }}>Fill in the form and click Run to get your AI-powered SEO report</div>
              </div>
            )}
            {loading && (
              <div style={{ height: "100%", minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${activeTool.color}33`, borderTop: `3px solid ${activeTool.color}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 14, color: "#64748b" }}>Hindsight AI is analyzing...</div>
                <div style={{ fontSize: 12, color: "#334155" }}>Combining insights from multiple SEO frameworks</div>
              </div>
            )}
            {result && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>Analysis Complete — {activeTool.name}</span>
                  </div>
                  <CopyButton text={result} />
                </div>
                <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                  <MarkdownOutput text={result} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 32, flexWrap: "wrap" }}>
          {[
            { icon: "⚡", label: "Powered by Groq LPU", sub: "Ultra-fast inference" },
            { icon: "🔒", label: "No data stored", sub: "Privacy first" },
            { icon: "💰", label: "100% Free", sub: "No API credits needed" },
            { icon: "🤖", label: "7 Specialized Agents", sub: "One unified engine" },
          ].map(badge => (
            <div key={badge.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px" }}>
              <span>{badge.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{badge.label}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{badge.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 4px; }
      `}</style>
    </div>
  );
}
