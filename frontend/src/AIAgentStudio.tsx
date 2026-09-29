import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  FileCode,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  Check,
  Search,
  AlertCircle,
  Sparkles,
  Layers,
  Send,
  Brain,
  GitPullRequest,
  Terminal,
  Play,
  UploadCloud,
  Copy,
  CornerDownLeft,
  Trash2
} from 'lucide-react';
import { getRepoTree, getFileContent, parseGitHubUrl, getUserRepos, pushCodeToGitHub } from './lib/github';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface KnowledgeFile {
  path: string;
  content: string;
  size?: number;
  sha?: string;
}

export default function AIAgentStudio() {
  const location = useLocation();
  const initialRepoState = location.state || {};

  // Repository state
  const [owner, setOwner] = useState<string>(initialRepoState.owner || 'AbbuSaikiran');
  const [repo, setRepo] = useState<string>(initialRepoState.repo || 'ms-SEO');
  const [repoUrlInput, setRepoUrlInput] = useState<string>(initialRepoState.owner && initialRepoState.repo ? `${initialRepoState.owner}/${initialRepoState.repo}` : 'AbbuSaikiran/ms-SEO');
  const [githubToken, setGithubToken] = useState<string>(() => {
    const stored = localStorage.getItem('github_token');
    if (stored && !stored.startsWith('github_pat_11BIEM7GQ0vKu3QhoqttMt')) return stored;
    const envToken = (import.meta as any).env?.VITE_GITHUB_TOKEN || '';
    if (envToken) localStorage.setItem('github_token', envToken);
    return envToken || stored || '';
  });
  const [userRepos, setUserRepos] = useState<any[]>([]);

  // Tree and selection state
  const [rawTree, setRawTree] = useState<any[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [fileFilter, setFileFilter] = useState('');
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);

  // UI modals and loading
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalTab, setModalTab] = useState<'select-repo' | 'select-files'>('select-files');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  // Hindsight Memory State (Vectorize.io)
  const [isHindsightModalOpen, setIsHindsightModalOpen] = useState(false);
  const [hindsightStatus, setHindsightStatus] = useState<any>(null);
  const [hindsightMemories, setHindsightMemories] = useState<any[]>([]);
  const [isHindsightReflecting, setIsHindsightReflecting] = useState(false);
  const [hindsightReflection, setHindsightReflection] = useState<{ text: string; facts: string[] } | null>(null);
  const [hindsightQuery, setHindsightQuery] = useState('SEO optimizations');
  const [isHindsightLoading, setIsHindsightLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/hindsight/status')
      .then(res => res.json())
      .then(data => setHindsightStatus(data))
      .catch(() => setHindsightStatus({ connected: false }));
  }, []);

  const handleRecallMemories = async (query = hindsightQuery) => {
    setIsHindsightLoading(true);
    try {
      const res = await fetch('http://localhost:8000/hindsight/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setHindsightMemories(data.memories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHindsightLoading(false);
    }
  };

  const handleReflectMemories = async () => {
    setIsHindsightReflecting(true);
    try {
      const res = await fetch('http://localhost:8000/hindsight/memory/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Consolidated SEO strategy and website optimization history' })
      });
      const data = await res.json();
      setHindsightReflection(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHindsightReflecting(false);
    }
  };

  // Automated GitHub SEO Agent state
  const [isAutoPROpen, setIsAutoPROpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState('https://example.com');
  const [baseBranch, setBaseBranch] = useState('main');
  const [isDryRun, setIsDryRun] = useState(true);
  const [isAutoPRRunning, setIsAutoPRRunning] = useState(false);
  const [autoPROutput, setAutoPROutput] = useState<string | null>(null);
  const [autoPRError, setAutoPRError] = useState<string | null>(null);

  const handleRunAutoSEOAgent = async (dryRunOverride?: boolean) => {
    const runAsDry = dryRunOverride !== undefined ? dryRunOverride : isDryRun;
    setIsDryRun(runAsDry);
    setIsAutoPRRunning(true);
    setAutoPRError(null);
    setAutoPROutput(null);
    try {
      const res = await fetch('http://localhost:8000/github/seo/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          github_token: githubToken,
          site_url: siteUrl,
          base_branch: baseBranch,
          dry_run: runAsDry
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutoPROutput(data.output);
      } else {
        setAutoPRError(data.error || 'Automation agent failed');
      }
    } catch (e: any) {
      setAutoPRError(e.message || 'Network error communicating with agent backend');
    } finally {
      setIsAutoPRRunning(false);
    }
  };

  // Direct Push to GitHub state
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushFilePath, setPushFilePath] = useState('index.html');
  const [pushCodeContent, setPushCodeContent] = useState('');
  const [pushCommitMessage, setPushCommitMessage] = useState('chore(seo): update metadata and tags');
  const [pushBranch, setPushBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; url?: string; sha?: string; error?: string } | null>(null);

  const openPushModalWithFile = (filePath: string, defaultContent?: string) => {
    setPushFilePath(filePath);
    const existing = knowledgeFiles.find(f => f.path === filePath);
    setPushCodeContent(defaultContent !== undefined ? defaultContent : (existing?.content || ''));
    setPushCommitMessage(`chore(seo): update ${filePath} via WarpIndex Agent`);
    setPushResult(null);
    setIsPushModalOpen(true);
  };

  const handlePushCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken) {
      setPushResult({ success: false, error: 'Please provide a GitHub Personal Access Token (PAT) with repo contents write access.' });
      return;
    }
    if (!pushFilePath.trim() || !pushCodeContent) {
      setPushResult({ success: false, error: 'File path and content cannot be empty.' });
      return;
    }
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await pushCodeToGitHub(
        owner,
        repo,
        pushFilePath.trim(),
        pushCodeContent,
        pushCommitMessage.trim() || `chore(seo): update ${pushFilePath}`,
        githubToken,
        pushBranch.trim() || 'main'
      );

      const fileUrl = `https://github.com/${owner}/${repo}/blob/${pushBranch || 'main'}/${pushFilePath.trim()}`;
      setPushResult({
        success: true,
        url: fileUrl,
        sha: res.content?.sha || res.commit?.sha
      });

      // Retain event in Hindsight Cloud
      fetch('http://localhost:8000/hindsight/memory/retain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Pushed code directly to GitHub repository ${owner}/${repo} file: ${pushFilePath}. Commit: ${pushCommitMessage}.`,
          tags: ['github-push', `${owner}/${repo}`, pushFilePath]
        })
      }).catch(() => { });

      // Add assistant confirmation to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `🚀 **Pushed to GitHub Successfully!**\n\n- **Repository:** \`${owner}/${repo}\`\n- **File:** \`${pushFilePath}\`\n- **Branch:** \`${pushBranch}\`\n- **Commit:** "${pushCommitMessage}"\n\n[View file on GitHub](${fileUrl})`
        }
      ]);
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message || 'Failed to push code to GitHub repository. Check token permissions.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; filesAttached?: string[] }>>([
    {
      role: 'assistant',
      text: `Hello! I am your **WarpIndex SEO Architect & Agent**. 

I can crawl your code, map keyword clusters, evaluate technical metadata, and write rank-ready copy. 

Connect a GitHub repository using the **+** button below or select files from your project knowledge to give me exact codebase context!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic suggestion chips for SEO architecture & strategy
  const PROMPT_SUGGESTIONS = [
    { label: '🔍 Audit Meta & Head Tags', prompt: 'Audit my site HTML meta tags, OpenGraph data, title hierarchy, and robots meta directives. Provide precise recommendations.' },
    { label: '🗺️ Topic Cluster & Keyword Map', prompt: 'Create an SEO topic cluster map with pillar pages, high-intent sub-topics, search intent classifications, and internal linking structure.' },
    { label: '🧩 Generate Schema JSON-LD', prompt: 'Generate rich Schema.org JSON-LD structured data for Organization, WebSite, Article, and FAQPage with valid semantic properties.' },
    { label: '⚡ Robots.txt & Sitemap Guide', prompt: 'Analyze and generate optimized robots.txt directives and XML sitemap configuration to maximize crawl budget efficiency.' },
    { label: '🧠 Hindsight Reflection', prompt: 'Reflect on our past SEO actions and provide strategic next steps to improve rankings and organic search traffic.' },
    { label: '🎯 Keyword Gap Analysis', prompt: 'Analyze top search competitors and identify high-opportunity organic keyword gaps with low difficulty.' }
  ];

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 180)}px`;
    }
  }, [input]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Close + menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial load of repository tree
  useEffect(() => {
    if (owner && repo) {
      loadRepository(owner, repo, githubToken);
    }
  }, []);

  // If token is updated, fetch user repos
  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('github_token', githubToken);
      getUserRepos(githubToken)
        .then(repos => {
          if (Array.isArray(repos)) setUserRepos(repos);
        })
        .catch(() => { });
    }
  }, [githubToken]);

  const loadRepository = async (targetOwner: string, targetRepo: string, token?: string) => {
    setIsTreeLoading(true);
    setStatusError(null);
    try {
      const data = await getRepoTree(targetOwner, targetRepo, token || undefined);
      if (data && data.tree) {
        const filesOnly = data.tree.filter((item: any) => item.type === 'blob');
        setRawTree(filesOnly);
        setOwner(targetOwner);
        setRepo(targetRepo);

        // Pre-select recommended SEO files by default if none selected
        if (selectedPaths.length === 0) {
          const recommended = filesOnly
            .map((f: any) => f.path)
            .filter((p: string) =>
              p.endsWith('index.html') ||
              p.endsWith('package.json') ||
              p.endsWith('robots.txt') ||
              p.endsWith('sitemap.xml') ||
              p.includes('App.tsx') ||
              p.includes('App.jsx') ||
              p.endsWith('README.md')
            )
            .slice(0, 6);

          if (recommended.length > 0) {
            setSelectedPaths(recommended);
            fetchAndSetKnowledge(targetOwner, targetRepo, recommended, token);
          }
        }
        setModalTab('select-files');
      } else {
        setStatusError('Could not find files in this repository.');
      }
    } catch (err: any) {
      console.error('Failed to load repo', err);
      setStatusError(err.message || 'Failed to connect to repository. Check repository visibility or provide a GitHub token.');
    } finally {
      setIsTreeLoading(false);
    }
  };

  const handleConnectRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGitHubUrl(repoUrlInput);
    if (!parsed) {
      setStatusError('Invalid GitHub repository format. Use owner/repo or full URL (e.g. facebook/react)');
      return;
    }
    loadRepository(parsed.owner, parsed.repo, githubToken);
  };

  const toggleFilePath = (path: string) => {
    setSelectedPaths(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const selectSEORecommended = () => {
    const recommended = rawTree
      .map(f => f.path)
      .filter(p =>
        p.endsWith('index.html') ||
        p.endsWith('package.json') ||
        p.endsWith('robots.txt') ||
        p.endsWith('sitemap.xml') ||
        p.includes('App.tsx') ||
        p.includes('App.jsx') ||
        p.endsWith('README.md') ||
        p.endsWith('next.config.js') ||
        p.endsWith('vite.config.ts')
      );
    setSelectedPaths(recommended);
  };

  const fetchAndSetKnowledge = async (tOwner: string, tRepo: string, paths: string[], token?: string) => {
    setIsSyncing(true);
    const loadedFiles: KnowledgeFile[] = [];

    for (const p of paths.slice(0, 10)) {
      try {
        const fileData = await getFileContent(tOwner, tRepo, p, token || undefined);
        const safeContent = fileData.content.length > 25000
          ? fileData.content.slice(0, 25000) + '\n\n...[Truncated for token optimization]...'
          : fileData.content;

        loadedFiles.push({
          path: p,
          content: safeContent,
          size: fileData.size || fileData.content.length,
          sha: fileData.sha
        });
      } catch (e) {
        console.warn(`Could not load ${p}`, e);
      }
    }

    setKnowledgeFiles(loadedFiles);
    setIsSyncing(false);
    return loadedFiles;
  };

  const handleSaveSelectedFiles = async () => {
    const loaded = await fetchAndSetKnowledge(owner, repo, selectedPaths, githubToken);
    setIsGitHubModalOpen(false);

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: `✅ **GitHub Knowledge Updated**: Connected to **${owner}/${repo}** with **${loaded.length} file(s)** indexed into active context:\n\n${loaded.map(f => `- \`${f.path}\` (${Math.round((f.size || 0) / 1024)} KB)`).join('\n')}\n\nYou can now ask me to analyze metadata, generate schema, audit page hierarchy, or optimize keywords directly based on this code.`
      }
    ]);
  };

  const handleSyncNow = async () => {
    if (selectedPaths.length === 0) {
      setIsGitHubModalOpen(true);
      return;
    }
    const loaded = await fetchAndSetKnowledge(owner, repo, selectedPaths, githubToken);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: `🔄 **Repository Synced**: Refetched latest code for **${loaded.length} files** from \`${owner}/${repo}\`.`
      }
    ]);
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend) return;

    const attachedFileNames = knowledgeFiles.map(f => f.path);
    setMessages(prev => [...prev, {
      role: 'user',
      text: promptToSend,
      filesAttached: attachedFileNames.length > 0 ? attachedFileNames : undefined
    }]);

    if (!customPrompt) setInput('');
    setIsTyping(true);

    try {
      let finalPrompt = promptToSend;
      if (knowledgeFiles.length > 0) {
        const contextHeader = [
          `[CONNECTED GITHUB REPOSITORY: ${owner}/${repo}]`,
          `The following files from the repository are loaded into context:`,
          ...knowledgeFiles.map(f => `\n--- FILE: ${f.path} ---\n${f.content}\n--- END OF FILE: ${f.path} ---`),
          `\n[USER INQUIRY / TASK]:`,
          promptToSend
        ].join('\n');
        finalPrompt = contextHeader;
      }

      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, model: selectedModel })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.output }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to AI backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const totalKbSelected = knowledgeFiles.reduce((acc, curr) => acc + (curr.size || curr.content.length || 0), 0) / 1024;

  const filteredTree = rawTree.filter(item =>
    !fileFilter || item.path.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left Chat Window */}
      <div className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-2xl flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(0,102,255,0.1)]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#111]/70 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00FFAA] rounded-xl flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(0,255,170,0.4)]">
                AI
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0A0A0A] rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">WarpIndex SEO Agent</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Groq 120B Active</span>
              </div>
              <p className="text-xs text-gray-400">Autonomous SEO Architect with GitHub Knowledge Integration</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Hindsight Cloud Status Button */}
            <button
              onClick={() => {
                setIsHindsightModalOpen(true);
                handleRecallMemories();
              }}
              className="flex items-center space-x-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-lg transition text-purple-200"
              title="View Hindsight Cloud Memory & Run Strategic Reflection"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">Hindsight Memory</span>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded-full">Bank: seo-agent</span>
            </button>

            {owner && repo && (
              <button
                onClick={() => setIsGitHubModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition text-gray-200"
                title="Manage GitHub repository files"
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#00FFAA]" />
                <span className="truncate max-w-[120px]">{owner}/{repo}</span>
                <span className="bg-[#00FFAA]/20 text-[#00FFAA] text-[10px] px-1.5 py-0.2 rounded-full">{knowledgeFiles.length} files</span>
              </button>
            )}

            {/* Model Selector Dropdown */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-[#1A1A1A] hover:bg-[#222] border border-white/15 px-2.5 py-1.5 rounded-lg text-white font-medium focus:outline-none focus:border-[#00FFAA]/50 transition cursor-pointer"
            >
              <option value="gpt-4o">🤖 OpenAI GPT-4o (User Key)</option>
              <option value="gpt-4o-mini">✨ OpenAI GPT-4o-mini</option>
              <option value="hindsight-ai">🧠 Hindsight AI (Groq 120B)</option>
              <option value="openai/gpt-oss-20b">⚡ Groq 20B (Ultra-fast)</option>
            </select>

            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition text-gray-300"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Knowledge Indicator Bar (if repo files connected) */}
        {knowledgeFiles.length > 0 && (
          <div className="px-6 py-2 bg-gradient-to-r from-[#0066FF]/10 via-[#00FFAA]/5 to-transparent border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-gray-300">
              <GithubIcon className="w-4 h-4 text-[#00FFAA]" />
              <span className="font-medium text-white">{owner}/{repo}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">{knowledgeFiles.length} files in knowledge ({totalKbSelected.toFixed(1)} KB)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex items-center space-x-1 text-xs text-[#00FFAA] hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setIsGitHubModalOpen(true)}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                Change files
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm p-4.5 bg-gradient-to-br from-[#0066FF] to-[#0052cc] text-white shadow-[0_4px_20px_rgba(0,102,255,0.25)] border border-blue-400/20">
                  {msg.filesAttached && msg.filesAttached.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-white/20">
                      <span className="text-[10px] uppercase font-bold text-white/80 flex items-center gap-1">
                        <GithubIcon className="w-3 h-3" /> Context:
                      </span>
                      {msg.filesAttached.map((f, fi) => (
                        <span key={fi} className="text-[11px] bg-black/30 border border-white/20 px-2 py-0.5 rounded-md font-mono">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-white/30">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 max-w-[90%] group">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00FFAA] flex items-center justify-center text-black font-extrabold text-xs shrink-0 shadow-[0_0_15px_rgba(0,255,170,0.35)] mt-1">
                    AI
                  </div>

                  <div className="flex-1 rounded-2xl rounded-tl-sm p-5 bg-[#131316]/95 text-gray-100 border border-white/10 shadow-xl hover:border-white/20 transition-all space-y-3">
                    {/* Assistant Message Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/5 text-[11px] text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">WarpIndex SEO Agent</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Groq 120B / OpenAI
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, i)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] text-gray-300 hover:text-white transition"
                        title="Copy response"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Message Body */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-200">
                      {msg.text}
                    </div>

                    {/* Quick Push to GitHub Action if code is detected */}
                    {(msg.text.includes('```') || msg.text.includes('<html') || msg.text.includes('<!DOCTYPE') || msg.text.includes('robots.txt')) && (
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-[#00FFAA]" /> Code & SEO recommendation ready
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const codeMatch = msg.text.match(/```(?:html|json|xml|javascript|typescript|bash|txt)?\n([\s\S]*?)```/);
                            const contentToPush = codeMatch ? codeMatch[1] : msg.text;
                            openPushModalWithFile('index.html', contentToPush);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold rounded-lg text-xs transition shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Push to GitHub</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00FFAA] flex items-center justify-center text-black font-extrabold text-xs shrink-0 shadow-[0_0_12px_rgba(0,255,170,0.3)] mt-1 animate-pulse">
                AI
              </div>
              <div className="bg-[#131316] text-gray-200 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex space-x-2.5 items-center shadow-lg">
                <span className="text-xs text-gray-400 mr-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00FFAA] animate-pulse" /> WarpIndex reasoning with Hindsight memory...
                </span>
                <span className="w-2 h-2 bg-[#00FFAA] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-[#00FFAA] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Modern Prompt Studio & Input Area */}
        <div className="p-4 bg-[#0d0d10]/95 backdrop-blur-2xl border-t border-white/10 z-20 space-y-3">

          {/* Quick Prompt Suggestion Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00FFAA]" /> Quick Prompts:
            </span>
            {PROMPT_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInput(s.prompt);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
                className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/20 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white whitespace-nowrap transition-all duration-150 shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Connected Context Files Pills (if repo files selected) */}
          {knowledgeFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                <GithubIcon className="w-3 h-3 text-[#00FFAA]" /> Attached ({knowledgeFiles.length}):
              </span>
              {knowledgeFiles.slice(0, 4).map((kf, ki) => (
                <span
                  key={ki}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[11px] text-gray-300 font-mono"
                >
                  <FileCode className="w-3 h-3 text-emerald-400" />
                  <span className="max-w-[130px] truncate">{kf.path}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setKnowledgeFiles(prev => prev.filter(f => f.path !== kf.path));
                      setSelectedPaths(prev => prev.filter(p => p !== kf.path));
                    }}
                    className="hover:text-red-400 text-gray-500 ml-0.5"
                    title="Remove file"
                  >
                    ×
                  </button>
                </span>
              ))}
              {knowledgeFiles.length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="text-[10px] text-gray-400 hover:text-[#00FFAA] underline"
                >
                  +{knowledgeFiles.length - 4} more
                </button>
              )}
            </div>
          )}

          {/* The Glassmorphic Input Capsule */}
          <form
            onSubmit={handleSend}
            className="relative rounded-2xl bg-[#131316] border border-white/10 hover:border-white/20 focus-within:border-[#00FFAA]/50 focus-within:ring-2 focus-within:ring-[#00FFAA]/20 transition-all duration-200 shadow-xl overflow-hidden"
          >
            {/* Multi-line auto-expanding Textarea */}
            <div className="px-4 pt-3.5 pb-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={knowledgeFiles.length > 0
                  ? `Ask WarpIndex about ${owner}/${repo} (${knowledgeFiles.length} files attached)...`
                  : "Ask AI to generate keywords, map topics, audit code, or write rank-ready content..."}
                className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none leading-relaxed min-h-[44px] max-h-[180px] scrollbar-hide font-sans"
              />
            </div>

            {/* Bottom Toolbar inside the capsule */}
            <div className="px-3 pb-2.5 pt-1.5 flex items-center justify-between border-t border-white/5 bg-black/20">

              {/* Left Action Buttons */}
              <div className="flex items-center gap-2">
                {/* The + Button */}
                <div className="relative" ref={addMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition flex items-center justify-center group"
                    title="Attach files or connect repo"
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-45 text-[#00FFAA]' : 'group-hover:rotate-90'}`} />
                    <span className="text-[11px] font-medium ml-1.5 text-gray-300 group-hover:text-white hidden sm:inline">Add Context</span>
                  </button>

                  {/* Claude-Style Add Menu Dropdown */}
                  {isAddMenuOpen && (
                    <div className="absolute bottom-11 left-0 w-64 bg-[#181818] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1.5 tracking-wider">
                        Add Repository Knowledge
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          setIsGitHubModalOpen(true);
                          setModalTab('select-files');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
                      >
                        <GithubIcon className="w-4 h-4 text-[#00FFAA]" />
                        <div>
                          <div className="font-medium text-xs">Add from GitHub</div>
                          <div className="text-[10px] text-gray-400">Select files & folders from repo</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          setIsGitHubModalOpen(true);
                          setModalTab('select-repo');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-[#0066FF]" />
                        <div>
                          <div className="font-medium text-xs">Switch Repository URL</div>
                          <div className="text-[10px] text-gray-400">Paste public or private repo link</div>
                        </div>
                      </button>

                      <div className="my-1 border-t border-white/10"></div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          selectSEORecommended();
                          handleSaveSelectedFiles();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-medium text-xs">Load SEO Essentials</div>
                          <div className="text-[10px] text-gray-400">Auto-add HTML, robots, sitemap</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Hindsight Cloud indicator pill */}
                <button
                  type="button"
                  onClick={() => setIsHindsightModalOpen(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 rounded-lg text-[11px] text-purple-300 transition"
                  title="Hindsight Memory Active (Bank: seo-agent-bank)"
                >
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span>Hindsight</span>
                </button>

                {/* Model badge */}
                <span className="hidden lg:flex items-center gap-1 text-[11px] text-gray-400 font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {selectedModel.replace('openai/', '')}
                </span>
              </div>

              {/* Right Side: Clear + Counter + Send Button */}
              <div className="flex items-center gap-2">
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-xs transition"
                    title="Clear text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                  {input.length > 0 ? `${input.length} chars` : '↵ to send'}
                </span>

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-2 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black text-xs font-bold rounded-xl transition duration-150 hover:opacity-95 hover:shadow-[0_0_18px_rgba(0,255,170,0.4)] active:scale-95 disabled:opacity-30 disabled:shadow-none flex items-center gap-1.5"
                >
                  {isTyping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                      <CornerDownLeft className="w-3 h-3 text-black/70" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>

          {/* Footer Subtext */}
          <div className="flex items-center justify-between px-1 text-[10px] text-gray-500">
            <span>
              Tip: Press <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-gray-400">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-gray-400">Shift + Enter</kbd> for newline
            </span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Memory & Codebase Synced
            </span>
          </div>

        </div>

        {/* Decorative Ambient Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#0066FF]/10 blur-[120px] rounded-full pointer-events-none"></div>
      </div>

      {/* Right Sidebar: Repository Context & Quick Actions */}
      <div className="w-80 flex flex-col gap-6">

        {/* Connected Repository Card (Claude Project Knowledge Style) */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFAA]/10 blur-[40px] rounded-full"></div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#00FFAA] uppercase tracking-wider flex items-center gap-1.5">
              <GithubIcon className="w-3.5 h-3.5" /> Project Knowledge
            </h4>
            <button
              onClick={() => {
                setIsGitHubModalOpen(true);
                setModalTab('select-files');
              }}
              className="text-[11px] text-gray-400 hover:text-white underline"
            >
              Edit
            </button>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-sm truncate">{owner}/{repo}</div>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">main</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {knowledgeFiles.length > 0 ? `${knowledgeFiles.length} file(s) attached • ${totalKbSelected.toFixed(1)} KB context` : 'No files selected yet.'}
            </p>
          </div>

          {/* List of currently indexed files */}
          {knowledgeFiles.length > 0 && (
            <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto scrollbar-hide">
              {knowledgeFiles.map((f, fi) => (
                <div key={fi} className="flex items-center justify-between text-[11px] bg-white/5 px-2.5 py-1 rounded-lg text-gray-300">
                  <span className="truncate flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-[#00FFAA]" /> {f.path}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{Math.round((f.size || 0) / 1024)} KB</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#00FFAA]' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
            </button>

            <button
              onClick={() => {
                setIsGitHubModalOpen(true);
                setModalTab('select-files');
              }}
              className="px-3 py-2 bg-[#00FFAA]/10 hover:bg-[#00FFAA]/20 border border-[#00FFAA]/30 rounded-xl text-xs font-medium text-[#00FFAA] transition"
            >
              + Files
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <button
              onClick={() => setIsAutoPROpen(true)}
              className="flex items-center justify-center space-x-1.5 py-2 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black rounded-xl text-xs font-bold transition hover:opacity-90 shadow-md"
              title="Autonomous PR Agent: crawls HTML, creates sitemap + robots.txt, and opens a Pull Request"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Auto SEO PR</span>
            </button>

            <button
              onClick={() => openPushModalWithFile('index.html')}
              className="flex items-center justify-center space-x-1.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
              title="Push direct commit to GitHub repository"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Push to GitHub</span>
            </button>
          </div>
        </div>

        {/* Hindsight Memory Card (Vectorize.io) */}
        <div className="bg-[#111] border border-purple-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full"></div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> Hindsight Memory
            </h4>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
              Vectorize Cloud
            </span>
          </div>

          <div className="bg-black/40 border border-purple-500/20 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">Bank: seo-agent-bank</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Temporal & entity tracking active. Remembers site edits, ranking shifts, and code optimizations.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsHindsightModalOpen(true);
                handleReflectMemories();
              }}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Reflect</span>
            </button>

            <button
              onClick={() => {
                setIsHindsightModalOpen(true);
                handleRecallMemories();
              }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-300 transition"
              title="Inspect recalled memories"
            >
              Recall
            </button>
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/10 blur-[40px] rounded-full"></div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-[#0066FF]" /> LLM Strategy Engine</span>
            <span className="text-[10px] text-[#00FFAA] font-mono">Active</span>
          </h4>

          <div className="p-3 border border-[#00FFAA]/30 bg-[#00FFAA]/5 rounded-xl flex items-center space-x-3 mb-2">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
            <div>
              <div className="text-sm font-bold text-white capitalize">{selectedModel.replace('openai/', '')}</div>
              <div className="text-[10px] text-emerald-400 font-medium">OpenAI Key Configured • Groq 120B Fallback Active</div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Dual-engine resilience: Runs with OpenAI API key with automatic failover to Groq 120B on credit limits.
          </p>
        </div>
      </div>

      {/* CLAUDE-STYLE GITHUB INTEGRATION MODAL */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-2.5">
                <GithubIcon className="w-5 h-5 text-[#00FFAA]" />
                <h3 className="font-bold text-white text-base">Add from GitHub</h3>
              </div>
              <button
                onClick={() => setIsGitHubModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-black/20 px-6">
              <button
                onClick={() => setModalTab('select-files')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${modalTab === 'select-files' ? 'border-[#00FFAA] text-[#00FFAA]' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                Select Files & Folders ({rawTree.length} found)
              </button>
              <button
                onClick={() => setModalTab('select-repo')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${modalTab === 'select-repo' ? 'border-[#00FFAA] text-[#00FFAA]' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                Change Repository
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {statusError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              {modalTab === 'select-repo' ? (
                /* Tab 1: Select / Enter Repository */
                <div className="space-y-5">
                  <form onSubmit={handleConnectRepo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        GitHub Repository URL or Path
                      </label>
                      <input
                        type="text"
                        value={repoUrlInput}
                        onChange={(e) => setRepoUrlInput(e.target.value)}
                        placeholder="e.g. AbbuSaikiran/ms-SEO or https://github.com/owner/repo"
                        className="w-full bg-[#1A1A1A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFAA]/50 focus:ring-1 focus:ring-[#00FFAA]/50"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">Works with public repositories and private repositories you grant access to.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        GitHub Personal Access Token (Optional)
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx (Optional for public repos, required for private repos)"
                        className="w-full bg-[#1A1A1A] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFAA]/50"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">Stored securely in your local browser for repo indexing.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isTreeLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black font-semibold rounded-xl text-sm transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isTreeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GithubIcon className="w-4 h-4" />}
                      <span>{isTreeLoading ? 'Fetching Repository...' : 'Fetch Repository Tree'}</span>
                    </button>
                  </form>

                  {/* Quick Select from user's repos if token present */}
                  {userRepos.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Your Recent GitHub Repositories:
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {userRepos.map((ur) => (
                          <button
                            key={ur.id}
                            type="button"
                            onClick={() => {
                              setRepoUrlInput(ur.full_name);
                              loadRepository(ur.owner.login, ur.name, githubToken);
                            }}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left text-xs truncate transition flex items-center space-x-2"
                          >
                            <GithubIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-white truncate">{ur.full_name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: File Browser & Selection (Project Knowledge) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fileFilter}
                        onChange={(e) => setFileFilter(e.target.value)}
                        placeholder="Search files (e.g. index, html, config)..."
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00FFAA]/50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={selectSEORecommended}
                      className="px-3 py-2 bg-[#00FFAA]/10 hover:bg-[#00FFAA]/20 border border-[#00FFAA]/30 text-[#00FFAA] rounded-xl text-xs font-medium transition shrink-0"
                    >
                      ⚡ SEO Essentials
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>
                      Selected <strong className="text-white">{selectedPaths.length}</strong> of {rawTree.length} files
                    </span>
                    <div className="space-x-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPaths(rawTree.map(f => f.path).slice(0, 15))}
                        className="hover:text-white underline"
                      >
                        Select Top 15
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPaths([])}
                        className="hover:text-white underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* File List Tree View */}
                  <div className="border border-white/10 rounded-xl bg-black/30 divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {filteredTree.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500">
                        {isTreeLoading ? 'Loading repository tree...' : 'No files matched your search.'}
                      </div>
                    ) : (
                      filteredTree.map((item) => {
                        const isSelected = selectedPaths.includes(item.path);
                        return (
                          <div
                            key={item.path}
                            onClick={() => toggleFilePath(item.path)}
                            className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition select-none ${isSelected ? 'bg-[#00FFAA]/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                          >
                            <div className="flex items-center space-x-2.5 truncate pr-2">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#00FFAA] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-500 shrink-0" />
                              )}
                              <FileCode className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate font-mono">{item.path}</span>
                            </div>

                            <span className="text-[10px] text-gray-500 font-mono shrink-0">
                              {item.size ? `${Math.round(item.size / 1024)} KB` : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {modalTab === 'select-files' ? `${selectedPaths.length} files selected for agent context` : `Connected: ${owner}/${repo}`}
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 rounded-xl transition"
                >
                  Cancel
                </button>
                {modalTab === 'select-files' && (
                  <button
                    type="button"
                    onClick={handleSaveSelectedFiles}
                    disabled={isSyncing || selectedPaths.length === 0}
                    className="px-5 py-2 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black text-xs font-bold rounded-xl transition hover:opacity-90 disabled:opacity-40 flex items-center space-x-1.5"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isSyncing ? 'Fetching...' : 'Add Files to Knowledge'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HINDSIGHT MEMORY & REFLECTION MODAL (Vectorize.io) */}
      {isHindsightModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-purple-500/20 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-sm">Hindsight Memory Engine</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Cloud Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Official Vectorize.io Memory Bank: <span className="text-purple-300 font-mono">seo-agent-bank</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHindsightModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Telemetry Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Status</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">API Version</div>
                  <div className="text-xs font-semibold text-white mt-1 font-mono">
                    {hindsightStatus?.api_version || '0.10.1'}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Memory Mode</div>
                  <div className="text-xs font-semibold text-purple-300 mt-1 font-mono">
                    Temporal + Entity
                  </div>
                </div>
              </div>

              {/* Recall Section */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-purple-400" /> Recall Context Memories
                  </h4>
                  <span className="text-[10px] text-gray-400">Semantic & Temporal Retrieval</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hindsightQuery}
                    onChange={(e) => setHindsightQuery(e.target.value)}
                    placeholder="Query memories (e.g. SEO optimizations, title tags)..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    onClick={() => handleRecallMemories()}
                    disabled={isHindsightLoading}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isHindsightLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Recall</span>
                  </button>
                </div>

                {hindsightMemories.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {hindsightMemories.map((m, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-2.5 text-xs text-gray-200">
                        <div className="font-mono text-[10px] text-purple-400 mb-1 flex items-center justify-between">
                          <span>Memory #{idx + 1}</span>
                          <span>Hindsight Cloud</span>
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strategic Reflection Section */}
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Deep Strategic Reflection
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Synthesizes high-level beliefs and rules across historical SEO actions
                    </p>
                  </div>
                  <button
                    onClick={handleReflectMemories}
                    disabled={isHindsightReflecting}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl transition hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isHindsightReflecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Reflect Now</span>
                  </button>
                </div>

                {hindsightReflection && (
                  <div className="mt-3 bg-black/60 border border-purple-500/30 rounded-lg p-3 text-xs space-y-2">
                    <div className="text-gray-200 leading-relaxed font-sans">
                      {hindsightReflection.text}
                    </div>
                    {hindsightReflection.facts && hindsightReflection.facts.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <div className="text-[10px] font-mono text-purple-300 uppercase mb-1">Key Derived Facts</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
                          {hindsightReflection.facts.map((fact, fi) => (
                            <li key={fi}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">
                Endpoint: https://api.hindsight.vectorize.io
              </span>
              <button
                onClick={() => setIsHindsightModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 rounded-xl transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AUTONOMOUS GITHUB SEO PR AGENT MODAL */}
      {isAutoPROpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#00FFAA]/20 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-xl flex items-center justify-center text-[#00FFAA]">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-sm">Autonomous GitHub SEO PR Agent</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Fast-Glob + Cheerio + LLM
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Target: <span className="text-white font-mono">{owner}/{repo}</span> (Branch: <span className="font-mono text-gray-300">{baseBranch}</span>)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAutoPROpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Target & URL settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-300 font-medium block mb-1">Production Site URL</label>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFAA]/50 font-mono"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Used for sitemap.xml and robots.txt canonicals</span>
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-medium block mb-1">Base Branch</label>
                  <input
                    type="text"
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFAA]/50 font-mono"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Branch to clone and base the PR against</span>
                </div>
              </div>

              {/* GitHub PAT Token */}
              <div>
                <label className="text-[11px] text-gray-300 font-medium block mb-1">GitHub Personal Access Token (PAT)</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value);
                    localStorage.setItem('github_token', e.target.value);
                  }}
                  placeholder="ghp_xxx or github_pat_xxx (Contents: Read/Write, Pull requests: Read/Write)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFAA]/50 font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">Stored locally in your browser. Fine-grained PAT with Contents & Pull requests permissions</span>
              </div>

              {/* Action Buttons */}
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Execution Mode</div>
                  <div className="text-[11px] text-gray-400">
                    Dry-run generates changes & prints git diff. Live run pushes a branch and opens a Pull Request.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunAutoSEOAgent(true)}
                    disabled={isAutoPRRunning || !githubToken}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white rounded-xl transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isAutoPRRunning && isDryRun ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>Run Dry-Run</span>
                  </button>

                  <button
                    onClick={() => handleRunAutoSEOAgent(false)}
                    disabled={isAutoPRRunning || !githubToken}
                    className="px-4 py-2 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black text-xs font-bold rounded-xl transition hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 shadow-md"
                  >
                    {isAutoPRRunning && !isDryRun ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                    <span>Create Live PR</span>
                  </button>
                </div>
              </div>

              {/* Execution Console Output */}
              {(autoPROutput || autoPRError || isAutoPRRunning) && (
                <div className="bg-black border border-white/15 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#00FFAA]" /> Console Output
                    </span>
                    {isAutoPRRunning && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Crawling & Generating...
                      </span>
                    )}
                  </div>

                  {autoPROutput && (
                    <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed scrollbar-hide">
                      {autoPROutput}
                    </pre>
                  )}

                  {autoPRError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Error
                      </div>
                      <pre className="font-mono text-[11px] whitespace-pre-wrap">{autoPRError}</pre>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                All created optimizations automatically retain into <span className="text-purple-300 font-mono">Hindsight Cloud</span>
              </span>
              <button
                onClick={() => setIsAutoPROpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIRECT PUSH CODE TO GITHUB MODAL */}
      {isPushModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-sm">Push Code to GitHub</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Direct Commit
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Repository: <span className="text-white font-mono">{owner}/{repo}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPushModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePushCode} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* File & Branch selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-300 font-medium block mb-1">Target File Path</label>
                    <input
                      type="text"
                      value={pushFilePath}
                      onChange={(e) => {
                        const newPath = e.target.value;
                        setPushFilePath(newPath);
                        const existing = knowledgeFiles.find(f => f.path === newPath);
                        if (existing) setPushCodeContent(existing.content);
                      }}
                      placeholder="e.g. index.html or public/robots.txt"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-300 font-medium block mb-1">Target Branch</label>
                    <input
                      type="text"
                      value={pushBranch}
                      onChange={(e) => setPushBranch(e.target.value)}
                      placeholder="main"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                {/* Commit Message */}
                <div>
                  <label className="text-[11px] text-gray-300 font-medium block mb-1">Commit Message</label>
                  <input
                    type="text"
                    value={pushCommitMessage}
                    onChange={(e) => setPushCommitMessage(e.target.value)}
                    placeholder="chore(seo): update title tags and metadata"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Code Content */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-gray-300 font-medium">Code / File Content</label>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {pushCodeContent.length} characters
                    </span>
                  </div>
                  <textarea
                    value={pushCodeContent}
                    onChange={(e) => setPushCodeContent(e.target.value)}
                    placeholder="Paste or edit HTML / code here to push directly to GitHub..."
                    required
                    rows={10}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-y leading-relaxed"
                  />
                </div>

                {/* Result Feedback */}
                {pushResult && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${pushResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      {pushResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span>{pushResult.success ? 'Commit pushed to GitHub successfully!' : 'Push failed'}</span>
                    </div>
                    {pushResult.url && (
                      <div className="text-[11px] pt-1">
                        <a href={pushResult.url} target="_blank" rel="noreferrer" className="underline text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1">
                          <span>View file on GitHub</span> <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {pushResult.error && (
                      <div className="text-[11px] font-mono whitespace-pre-wrap">{pushResult.error}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Direct GitHub REST API Commit (Pushes to origin)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPushModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPushing || !pushCodeContent}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center gap-1.5 shadow-md"
                  >
                    {isPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>{isPushing ? 'Pushing...' : 'Push to GitHub'}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
