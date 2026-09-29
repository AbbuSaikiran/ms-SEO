import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { simpleGit } from "simple-git";
import * as cheerio from "cheerio";
import fg from "fast-glob";
import { Octokit } from "@octokit/rest";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// ---- Config (set as environment variables or in .env) ----
const {
  GITHUB_TOKEN,            // fine-grained PAT: Contents + Pull requests (read/write) on ONE repo
  ANTHROPIC_API_KEY,
  GROQ_API_KEY,            // optional fallback if Anthropic key not present
  OPENAI_API_KEY,          // optional fallback
  VECTORIZE_API_KEY,       // optional Hindsight Cloud integration
  VECTORIZE_API_ENDPOINT = "https://api.hindsight.vectorize.io",
  HINDSIGHT_BANK_ID = "seo-agent-bank",
  OWNER,                   // e.g. "your-user"
  REPO,                    // e.g. "your-repo"
  SITE_URL,                // e.g. "https://example.com"
  BASE_BRANCH = "main",
  DRY_RUN,                 // set to 1 to skip push + PR
} = process.env;

// Verify required configs
const required = { GITHUB_TOKEN, OWNER, REPO, SITE_URL };
for (const [k, v] of Object.entries(required)) {
  if (!v) throw new Error(`Missing env var: ${k}`);
}

if (!ANTHROPIC_API_KEY && !GROQ_API_KEY && !OPENAI_API_KEY) {
  throw new Error(`Missing LLM key: Provide ANTHROPIC_API_KEY or GROQ_API_KEY or OPENAI_API_KEY`);
}

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ---- Helper: Retain optimization event in Hindsight ----
async function retainInHindsight(content) {
  const apiKey = VECTORIZE_API_KEY || process.env.VECTORIZE_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch(`${VECTORIZE_API_ENDPOINT}/v1/banks/${HINDSIGHT_BANK_ID}/retain`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        tags: ["github-agent", "seo-pr", `${OWNER}/${REPO}`]
      })
    });
    if (res.ok) {
      console.log("🧠 Retained in Hindsight memory bank:", HINDSIGHT_BANK_ID);
    }
  } catch (e) {
    // Non-fatal
  }
}

// ---- Helper: run git bypassing Windows Credential Manager ----
// Windows GCM intercepts git network operations even when the token is embedded
// in the URL. We fix this by running git with its own isolated HOME directory
// containing a .gitconfig that explicitly clears credential.helper.
let _gitHome = null;
async function getGitHome() {
  if (_gitHome) return _gitHome;
  _gitHome = await fs.mkdtemp(path.join(os.tmpdir(), "seo-git-home-"));
  // Write a minimal .gitconfig that clears the credential helper
  await fs.writeFile(
    path.join(_gitHome, ".gitconfig"),
    `[credential]\n\thelper = \n[user]\n\tname = seo-agent\n\temail = seo-agent@users.noreply.github.com\n`
  );
  return _gitHome;
}

function gitExec(args, cwd) {
  // Runs git synchronously with env vars that completely bypass GCM
  const gitHome = _gitHome; // must be pre-populated via getGitHome()
  execFileSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      HOME: gitHome,                 // custom HOME so git uses our .gitconfig
      USERPROFILE: gitHome,          // Windows equivalent of HOME
      GIT_CONFIG_NOSYSTEM: "1",      // ignore /etc/gitconfig
      GIT_TERMINAL_PROMPT: "0",      // never prompt for credentials
      GCM_INTERACTIVE: "Never",      // disable GCM interactive mode
    },
  });
}

// ---- 1. Import repo ----
async function cloneRepo() {
  const gitHome = await getGitHome();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "seo-agent-"));
  // Embed the token in the URL so both clone AND push are authenticated
  const authedUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git`;
  console.log(`Cloning https://github.com/${OWNER}/${REPO}.git (branch: ${BASE_BRANCH})...`);
  // Use direct git subprocess to bypass Windows Credential Manager
  execFileSync("git", ["clone", "--depth", "1", "--branch", BASE_BRANCH, authedUrl, dir], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      HOME: gitHome,
      USERPROFILE: gitHome,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
      GCM_INTERACTIVE: "Never",
    },
  });
  // Use simple-git for non-network operations (checkout, add, commit)
  const git = simpleGit(dir);
  return { dir, git, authedUrl };
}

// ---- 2. Generate SEO with Claude (or Groq / OpenAI fallback) ----
async function seoFor(text, file) {
  let raw = "{}";

  if (anthropic) {
    // Anthropic Claude
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system:
        "You are an SEO expert. Reply with JSON only, no markdown: " +
        '{"title":"<=60 chars","description":"<=155 chars","og_title":"","og_description":""}',
      messages: [{ role: "user", content: `Page: ${file}\n\n${text.slice(0, 6000)}` }],
    });
    raw = msg.content.find((b) => b.type === "text")?.text ?? "{}";
  } else if (GROQ_API_KEY) {
    // Groq Ultra-Fast Fallback (openai/gpt-oss-120b or llama-3.3-70b-versatile)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: 'You are an SEO expert. Reply with JSON only, no markdown: {"title":"<=60 chars","description":"<=155 chars","og_title":"","og_description":""}'
          },
          {
            role: "user",
            content: `Page: ${file}\n\n${text.slice(0, 6000)}`
          }
        ]
      })
    });
    const data = await groqRes.json();
    raw = data.choices?.[0]?.message?.content ?? "{}";
  } else if (OPENAI_API_KEY) {
    // OpenAI fallback
    const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: 'You are an SEO expert. Reply with JSON only, no markdown: {"title":"<=60 chars","description":"<=155 chars","og_title":"","og_description":""}'
          },
          {
            role: "user",
            content: `Page: ${file}\n\n${text.slice(0, 6000)}`
          }
        ]
      })
    });
    const data = await oaiRes.json();
    raw = data.choices?.[0]?.message?.content ?? "{}";
  }

  const seo = JSON.parse(raw.replace(/```json|```/g, "").trim());
  // enforce limits
  seo.title = String(seo.title ?? "").slice(0, 60);
  seo.description = String(seo.description ?? "").slice(0, 155);
  seo.og_title = String(seo.og_title || seo.title).slice(0, 70);
  seo.og_description = String(seo.og_description || seo.description).slice(0, 200);
  return seo;
}

// ---- 3. Apply SEO to an HTML file ----
async function applySeo(file) {
  const html = await fs.readFile(file, "utf8");
  const $ = cheerio.load(html);
  if (!$("head").length) return false;

  const seo = await seoFor($("body").text().replace(/\s+/g, " ").trim(), file);
  if (!seo.title) return false;

  $('head title, head meta[name="description"], head meta[property^="og:"]').remove();
  $("head").append(
    $("<title>").text(seo.title),
    $("<meta>").attr({ name: "description", content: seo.description }),
    $("<meta>").attr({ property: "og:title", content: seo.og_title }),
    $("<meta>").attr({ property: "og:description", content: seo.og_description }),
    $("<meta>").attr({ property: "og:type", content: "website" }),
  );
  await fs.writeFile(file, $.html());
  return true;
}

// ---- 4. sitemap.xml + robots.txt ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function writeSitemap(root, pages) {
  const today = new Date().toISOString().slice(0, 10);
  const site = SITE_URL.replace(/\/$/, "");
  const urls = pages
    .map((p) => {
      let rel = path.relative(root, p).split(path.sep).join("/");
      rel = rel.replace(/(^|\/)index\.html$/, "$1");
      return `  <url><loc>${esc(`${site}/${rel}`)}</loc><lastmod>${today}</lastmod></url>`;
    })
    .join("\n");

  await fs.writeFile(
    path.join(root, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  await fs.writeFile(
    path.join(root, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`,
  );
}

// ---- 5. Main: branch, commit, push, PR ----
async function main() {
  console.log(`Starting GitHub SEO Agent on ${OWNER}/${REPO}...`);
  const { dir: root, git, authedUrl } = await cloneRepo();
  const branch = `ai-seo-${Date.now()}`;
  await git.checkoutLocalBranch(branch);

  const files = await fg("**/*.html", {
    cwd: root,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
  });

  console.log(`Found ${files.length} HTML files.`);
  const done = [];
  for (const f of files) {
    try {
      if (await applySeo(f)) {
        done.push(f);
        console.log("✔", path.relative(root, f));
      }
    } catch (e) {
      console.warn("✖ skipped", path.relative(root, f), e.message);
    }
  }
  await writeSitemap(root, done);

  await git.add("-A");
  if (DRY_RUN) {
    console.log(await git.diff(["--cached", "--stat"]));
    console.log(`Dry run: nothing pushed. Working copy at ${root}`);
    return;
  }

  // Configure git identity for the commit
  await git.addConfig("user.name", "seo-agent");
  await git.addConfig("user.email", "seo-agent@users.noreply.github.com");
  await git.commit("chore(seo): add meta tags, sitemap.xml, robots.txt");

  // Push the new branch using direct git subprocess to bypass Windows Credential Manager
  console.log(`Pushing branch ${branch} to origin...`);
  try {
    gitExec(["push", "--set-upstream", authedUrl, branch], root);
  } catch (pushErr) {
    console.error("❌ git push failed. Check that GITHUB_TOKEN has 'contents: write' permission.");
    const msg = pushErr.stderr?.toString() || pushErr.message;
    console.error(msg);
    throw new Error(msg);
  }

  // Open a pull request via the GitHub API
  console.log("Opening pull request...");
  let pr;
  try {
    const res = await octokit.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: "chore(seo): AI SEO update",
      head: branch,
      base: BASE_BRANCH,
      body: `Auto-generated meta tags for ${done.length} pages, plus \`sitemap.xml\` and \`robots.txt\`. Please review before merging.`,
    });
    pr = res.data;
  } catch (prErr) {
    console.error("❌ PR creation failed. Check that GITHUB_TOKEN has 'pull-requests: write' permission.");
    console.error(prErr.message);
    throw prErr;
  }

  console.log("✅ PR created:", pr.html_url);

  // Retain to Hindsight Memory
  await retainInHindsight(
    `GitHub SEO Agent created PR ${pr.html_url} on ${OWNER}/${REPO}. Optimized ${done.length} HTML pages with title tags, description, OpenGraph metadata, sitemap.xml, and robots.txt.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
