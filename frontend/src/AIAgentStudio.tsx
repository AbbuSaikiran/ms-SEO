import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRepoTree } from './lib/github';

export default function AIAgentStudio() {
  const location = useLocation();
  const { repo, owner } = location.state || {};

  const [messages, setMessages] = useState([
    { role: 'assistant', text: repo ? `Hello! I see you've imported the repository **${owner}/${repo}**. I am your AI SEO Agent. Loading your repository context...` : 'Hello! I am your AI SEO Agent. Give me a topic or URL, and I will generate a complete content strategy, keyword clusters, and write SEO-optimized drafts for you.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (owner && repo) {
      const token = localStorage.getItem('github_token');
      if (token) {
        getRepoTree(owner, repo, token)
          .then(data => {
            if (data.tree) {
              setMessages(prev => [...prev, { role: 'assistant', text: `Success! I have securely indexed ${data.tree.length} files from your repository using your read/write permissions. You can now ask me to read specific files or write new optimizations directly back to GitHub.` }]);
            }
          })
          .catch(err => {
            console.error('Failed to load repo tree', err);
            setMessages(prev => [...prev, { role: 'assistant', text: `Failed to index repository. Please ensure you have connected GitHub with the correct permissions.` }]);
          });
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `No GitHub token found. Please connect your GitHub account in the Projects tab to allow me to read and write code.` }]);
      }
    }
  }, [owner, repo]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      // Find the selected model
      const modelRadio = document.querySelector('input[name="model"]:checked') as HTMLInputElement;
      let modelStr = "hindsight-ai"; // Default to Hindsight AI (Groq 120B Flagship)
      if (modelRadio) {
        const labelText = modelRadio.nextElementSibling?.textContent || "";
        if (labelText.includes("Hindsight AI")) modelStr = "hindsight-ai";
      }

      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, model: modelStr })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.output }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to AI backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left Chat Window */}
      <div className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-2xl flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(0,102,255,0.1)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#111]/50 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00FFAA] rounded-xl flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(0,255,170,0.4)]">
                AI
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0A0A0A] rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">WarpIndex Agent</h3>
              <p className="text-xs text-emerald-400 font-medium">Online & Ready</p>
            </div>
          </div>
          <button className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition text-gray-300">
            Clear Chat
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#0066FF] text-white rounded-br-none shadow-[0_0_15px_rgba(0,102,255,0.3)]' : 'bg-[#1A1A1A] text-gray-200 border border-white/5 rounded-bl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#1A1A1A] text-gray-200 border border-white/5 rounded-2xl rounded-bl-none p-4 flex space-x-2 items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#111]/80 backdrop-blur-xl border-t border-white/5 z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI to generate keywords, map topics, or write content..."
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-[#00FFAA]/50 focus:ring-1 focus:ring-[#00FFAA]/50 transition shadow-inner"
            />
            <button type="submit" className="absolute right-2 p-2 bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50" disabled={!input.trim()}>
              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V6m0 0l-5 5m5-5l5 5"></path></svg>
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-gray-500">AI can make mistakes. Verify important SEO data.</span>
          </div>
        </div>

        {/* Decorative Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5A00FF]/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      {/* Right Settings/Context Panel */}
      <div className="w-80 flex flex-col gap-6">
        {repo && (
          <div className="bg-[#111] border border-[#00FFAA]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFAA]/10 blur-[40px] rounded-full"></div>
            <h4 className="text-xs font-bold text-[#00FFAA] uppercase tracking-wider mb-2">Connected Repository</h4>
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              <div className="text-sm font-medium text-white truncate">{owner}/{repo}</div>
            </div>
            <p className="text-[10px] text-gray-400">Context loaded. The AI agent is ready to analyze this codebase.</p>
          </div>
        )}

        {/* Model Selector */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/10 blur-[40px] rounded-full"></div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">AI Model Connection</h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border border-[#00FFAA]/30 bg-[#00FFAA]/5 rounded-xl cursor-pointer">
              <input type="radio" name="model" className="form-radio text-[#00FFAA] bg-black border-white/20 focus:ring-0" defaultChecked />
              <div>
                <div className="text-sm font-bold text-white">Hindsight AI</div>
                <div className="text-[10px] text-emerald-400">All-in-one SEO Optimization Engine</div>
              </div>
            </label>
            
            <div className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              Powered by advanced LLMs. Combines the capabilities of Surfer SEO, Ahrefs, Jasper, Semrush, and Alli AI into a single optimization powerhouse.
            </div>
          </div>
        </div>

        {/* Action Presets */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 shadow-lg flex-1">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { icon: '🗺️', label: 'Generate Topic Map' },
              { icon: '📝', label: 'Write SEO Article' },
              { icon: '🔍', label: 'Audit Competitor URL' },
              { icon: '📊', label: 'Cluster Keywords' }
            ].map((action, i) => (
              <button key={i} className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition text-left group">
                <span className="text-lg bg-black p-1.5 rounded-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
