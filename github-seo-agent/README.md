# GitHub SEO Automation Agent

Autonomous GitHub SEO Agent that clones your repository, crawls all HTML files with `cheerio` & `fast-glob`, generates optimized meta tags with Claude / Groq, writes `sitemap.xml` & `robots.txt`, and automatically creates a Pull Request on GitHub.

## 🚀 Quick Start (CLI)

```bash
cd github-seo-agent
npm install
```

### Configure Environment Variables

Create `.env` (or export in shell):

```bash
export GITHUB_TOKEN=github_pat_xxx
export ANTHROPIC_API_KEY=sk-ant-xxx   # Or GROQ_API_KEY=gsk_xxx
export OWNER=your-user
export REPO=your-repo
export SITE_URL=https://example.com
export BASE_BRANCH=main

# Hindsight Cloud Memory
export VECTORIZE_API_KEY=hsk_xxx
export HINDSIGHT_BANK_ID=seo-agent-bank
```

### Run

```bash
# Dry run: generates changes, prints git diff, pushes nothing
npm run dry-run

# Live run: creates a branch (ai-seo-<timestamp>), commits, pushes, and opens a Pull Request
npm start
```

## 🌐 Web Studio Integration

You can also run this agent directly inside the **WarpIndex AI Agent Studio** UI:
1. Open the web interface at `http://localhost:5173`.
2. In the right sidebar under **Project Knowledge**, click **Autonomous SEO PR Agent**.
3. Choose **Run Dry-Run** to preview the diff, or **Create Live PR** to automatically open a Pull Request on GitHub.
4. All optimizations and Pull Requests are retained in **Hindsight Cloud Memory** (`Vectorize.io`).
