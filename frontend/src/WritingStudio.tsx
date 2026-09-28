import { useState } from 'react';

export default function WritingStudio() {
  const [content, setContent] = useState('Start writing your SEO-optimized content here...');

  return (
    <div className="flex flex-col h-[70vh] bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editor Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-3 bg-[#1A1A1A] border-b border-white/5">
        <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Bold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path></svg>
        </button>
        <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Italic">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
        </button>
        <div className="w-px h-5 bg-white/10 mx-2"></div>
        <button className="flex items-center px-3 py-1.5 bg-[#5A00FF]/20 text-[#00FFAA] hover:bg-[#5A00FF]/40 border border-[#5A00FF]/50 rounded-lg text-sm font-medium transition ml-auto">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI Optimize
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex">
        {/* Main Text Area */}
        <textarea
          className="flex-1 bg-transparent p-6 text-gray-300 resize-none focus:outline-none leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {/* Sidebar Insights */}
        <div className="w-64 bg-[#151515] border-l border-white/5 p-4 flex flex-col space-y-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SEO Score</div>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold text-[#00FFAA]">85</span>
              <span className="text-sm text-gray-500 mb-1">/ 100</span>
            </div>
            <div className="w-full h-1.5 bg-[#222] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FFAA] w-[85%]"></div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Keywords</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-[#00FFAA]/10 text-[#00FFAA] border border-[#00FFAA]/20 rounded text-[10px] font-medium">ai tools (3/5)</span>
              <span className="px-2 py-1 bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 rounded text-[10px] font-medium">seo writing (1/4)</span>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-medium">content generation (0/2)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
