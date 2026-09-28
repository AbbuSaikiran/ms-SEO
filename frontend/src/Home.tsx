import { useState } from 'react';
import { TopHeader } from './App';

// This is the Home/Dashboard component that was requested
export default function Home() {
  return (
    <div className="flex flex-col text-white">
      <TopHeader title="Dashboard" />
      {/* KPI Row */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center text-xs text-emerald-400 mb-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></span> Last Update: 2 min ago
            </div>
            <h2 className="text-3xl font-bold">All KPI's<br/>Updates</h2>
            <a href="#" className="text-xs text-blue-400 hover:underline mt-2 inline-block">See in Detail →</a>
          </div>

          <div className="flex space-x-4">
            {[
              { title: 'Total Organic Traffic', val: '12.5k', change: '+15.4%', color: 'emerald' },
              { title: 'SEO Score', val: '84/100', change: '+3.02', color: 'emerald' },
              { title: 'Human Score', val: '92%', change: '-1.05%', color: 'red' },
              { title: 'Total Content Output', val: '148,200', change: '+12%', color: 'emerald' },
            ].map((kpi, i) => (
              <div key={i} className="w-56 bg-gradient-to-b from-[#1c1c24] to-[#14141a] border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:border-white/10 transition cursor-pointer">
                <span className="text-xs text-gray-400 font-medium">{kpi.title}</span>
                <div className="flex items-baseline space-x-2 mt-4">
                  <span className="text-3xl font-bold">{kpi.val}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${kpi.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{kpi.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="flex space-x-6">
        <div className="flex-1 bg-[#111] border border-white/5 rounded-2xl p-6">
          <div className="text-xs text-[#0066FF] font-medium mb-1">📈 Growth Trends</div>
          <h3 className="text-xl font-bold mb-6">Performance Analytics</h3>
          <table className="w-full text-left text-sm mt-4">
            <thead className="text-xs text-gray-500 bg-[#1A1A1A] rounded-lg">
              <tr>
                <th className="px-4 py-3 rounded-l-lg font-medium">No</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Traffic</th>
                <th className="px-4 py-3 font-medium">SEO Score</th>
                <th className="px-4 py-3 rounded-r-lg font-medium">Human Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { id: '#1', title: 'How to map SEO clusters', traffic: '4,200', seo: '98/100', human: '95%' },
                { id: '#2', title: 'Best SEO agent tools', traffic: '3,150', seo: '92/100', human: '88%' },
                { id: '#3', title: 'AI content scaling strategies', traffic: '2,800', seo: '85/100', human: '91%' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition cursor-pointer">
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-xs text-[#00FFAA] hover:underline">{row.title}</td>
                  <td className="px-4 py-3 text-xs">{row.traffic}</td>
                  <td className="px-4 py-3"><span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{row.seo}</span></td>
                  <td className="px-4 py-3"><span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{row.human}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-[320px] bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="text-xs text-[#0066FF] font-medium mb-1">📊 Plan Usage</div>
          <h3 className="text-lg font-bold mb-8">Professional Plan</h3>
          <div className="relative flex justify-center mb-8">
            <svg className="w-48 h-24" viewBox="0 0 100 50">
              <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
              <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="20" />
              <defs><linearGradient id="gradient"><stop offset="0%" stopColor="#0066FF" /><stop offset="100%" stopColor="#00FFAA" /></linearGradient></defs>
            </svg>
            <div className="absolute bottom-0 text-center flex flex-col items-center">
              <span className="text-[10px] text-gray-400">Words Generated</span>
              <span className="text-xl font-bold text-[#00FFAA]">85k<span className="text-gray-500 text-sm">/100k</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
