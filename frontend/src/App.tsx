import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AIAgentStudio from './AIAgentStudio';
import Projects from './Projects';
import Home from './Home';
import SEOMemoryAgent from './SEOMemoryAgent';
import HindsightAI from './HindsightAI';

// ==========================================
// LANDING PAGE & AUTH SCREEN
// ==========================================
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden font-sans text-white">
      {/* Brand Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#5A00FF]/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0066FF]/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00FFAA] rounded-xl flex items-center justify-center font-bold text-black text-xl shadow-[0_0_15px_rgba(0,255,170,0.4)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">SEO Map Agent</span>
        </div>
      </nav>

      {/* Hero Content + Auth */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto w-full px-8 gap-16 relative z-10">
        
        {/* Left: Hero Copy */}
        <div className="flex-1 text-left">
          <div className="inline-flex items-center space-x-2 bg-[#5A00FF]/20 border border-[#5A00FF]/50 text-[#00FFAA] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00FFAA] animate-pulse"></span>
            <span>AI-Powered SEO Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Dominate Search with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] via-[#00FFAA] to-[#5A00FF]">Interactive Maps</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-xl">
            Build production-quality topic clusters, execute AI-driven keyword research, and write rank-ready content all from one unified studio.
          </p>
        </div>

        {/* Right: Auth Card */}
        <div className="w-full max-w-md p-8 bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,102,255,0.15)] relative">
          
          <div className="flex mb-8 bg-black/40 rounded-lg p-1 border border-white/5 relative">
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#111] rounded-md transition-all duration-300 ease-in-out border border-white/10 shadow-sm"
              style={{ left: isLogin ? '4px' : 'calc(50% + 2px)' }}
            ></div>
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 py-2 text-sm font-medium transition-colors relative z-10 ${isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 py-2 text-sm font-medium transition-colors relative z-10 ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Create Account
          </button>
        </div>

        <form className="space-y-4" onSubmit={async (e) => { 
          e.preventDefault(); 
          onLogin(); 
        }}>
          
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isLogin ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input type="text" placeholder="John Doe" className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input type="email" placeholder="you@example.com" className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              {isLogin && <a href="#" className="text-xs text-[#00FFAA] hover:text-[#00FFAA]/80">Forgot password?</a>}
            </div>
            <input type="password" placeholder="••••••••" className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition" />
          </div>

          <button type="submit" className="w-full bg-[#0066FF] hover:bg-[#0055DD] text-white font-medium py-3 rounded-lg mt-6 transition-all duration-200 shadow-[0_0_20px_rgba(0,102,255,0.4)] transform hover:scale-[1.02]">
            {isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button 
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: window.location.origin,
              },
            });
            if (error) console.error("Google login failed", error.message);
          }}
          className="w-full mt-6 bg-[#0A0A0A] hover:bg-white/5 border border-white/10 text-white font-medium py-3 rounded-lg flex items-center justify-center transition"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SIDEBAR COMPONENT
// ==========================================
function Sidebar({ handleLogout, session }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { name: 'Projects', path: '/projects' }, 
    { name: 'AI SEO Agent', path: '/agent' }, 
    { name: '🧠 Memory Agent', path: '/memory' },
    { name: '⚡ Hindsight AI', path: '/hindsight' },
    { name: 'Analytics', path: '/analytics' }
  ];
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-[280px] bg-[#0A0A0A] border-r border-white/10 flex flex-col shrink-0 rounded-r-[30px] my-2 ml-2 overflow-hidden relative">
      <div className="p-6 h-full flex flex-col relative z-10">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#00FFAA] rounded-lg flex items-center justify-center text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          </div>
          <span className="text-xl font-bold tracking-wide">SEO Map Agent</span>
          <button onClick={handleLogout} className="ml-auto bg-white/5 hover:bg-white/10 rounded p-1 text-[#0066FF]" title="Log Out">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-tight">Welcome Back 👋,<br/>{session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}</h2>
          <p className="text-xs text-gray-500 mt-2 font-medium">Last Login: Today</p>
        </div>

        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Overview</div>
        <nav className="space-y-1 mb-8">
          <button 
            onClick={() => navigate('/')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/') ? 'bg-[#0066FF]/10 text-white border border-[#0066FF]/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className={`w-4 h-4 ${isActive('/') ? 'text-[#00FFAA]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span>Dashboard</span>
            {isActive('/') && <div className="ml-auto w-1 h-4 bg-[#00FFAA] rounded-full shadow-[0_0_10px_#00FFAA]"></div>}
          </button>
        </nav>

        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Features</div>
        <nav className="space-y-1 mb-8">
          {navItems.map(item => (
            <button 
              key={item.name} 
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive(item.path) ? 'bg-[#0066FF]/10 text-white border border-[#0066FF]/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
              <svg className={`w-4 h-4 ${isActive(item.path) ? 'text-[#00FFAA]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span>{item.name}</span>
              {isActive(item.path) && <div className="ml-auto w-1 h-4 bg-[#00FFAA] rounded-full shadow-[0_0_10px_#00FFAA]"></div>}
            </button>
          ))}
        </nav>

        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">System</div>
        <nav className="space-y-1">
          <button 
            onClick={() => navigate('/integrations')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/integrations') ? 'bg-white/10 text-white border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <svg className={`w-4 h-4 ${isActive('/integrations') ? 'text-purple-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            <span>Integrations</span>
            {isActive('/integrations') && <div className="ml-auto w-1 h-4 bg-purple-500 rounded-full"></div>}
          </button>
        </nav>

        {/* Upgrade Card */}
        <div className="mt-auto pt-4 relative">
          <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#5A00FF]/20 border border-[#0066FF]/30 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA]/10 to-[#0066FF]/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <h4 className="font-semibold text-white mb-1">Unlock To Pro</h4>
            <p className="text-[10px] text-gray-400 mb-3 leading-tight">Write 10x faster and unlock advanced SEO insights to dominate Google.</p>
            <button onClick={() => navigate('/upgrade')} className="w-full bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black text-xs font-bold py-2 rounded-lg shadow-[0_0_15px_rgba(0,255,170,0.4)] transition transform hover:scale-[1.02]">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ==========================================
// TOP HEADER COMPONENT
// ==========================================
export function TopHeader({ title }: { title: string }) {
  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex items-center text-sm font-medium text-gray-400">
        <svg className="w-4 h-4 mr-2 text-[#00FFAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        App <span className="mx-2">/</span> <span className="text-white">{title}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search..." className="bg-[#111] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#0066FF] w-64 transition" />
        </div>
        <div className="flex items-center space-x-2 bg-[#111] border border-white/5 pl-2 pr-3 py-1.5 rounded-full cursor-pointer hover:border-white/20 transition">
          <img src="https://ui-avatars.com/api/?name=User&background=0066FF&color=fff" alt="User" className="w-6 h-6 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function GenericPage({ title, description, icon }: any) {
  return (
    <>
      <TopHeader title={title} />
      <div className="flex-1 flex flex-col items-center justify-center h-[70%] text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#0066FF]/20 to-[#00FFAA]/20 rounded-full flex items-center justify-center mb-6 border border-[#0066FF]/30 shadow-2xl">
          <span className="text-4xl">{icon}</span>
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-gray-400 max-w-md mx-auto">{description}</p>
        <button className="mt-8 bg-[#0066FF] hover:bg-[#0055DD] text-white px-6 py-2 rounded-lg font-medium transition shadow-[0_0_15px_rgba(0,102,255,0.4)]">
          Launch Module
        </button>
      </div>
    </>
  );
}

function UpgradePage() {
  const navigate = useNavigate();
  return (
    <>
      <TopHeader title="Upgrade to Pro" />
      <div className="flex-1 flex items-center justify-center h-[80%]">
        <div className="bg-[#111] p-10 rounded-3xl border border-[#0066FF]/30 max-w-xl text-center shadow-[0_0_50px_rgba(0,102,255,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-[#0066FF]/40 blur-[80px]"></div>
          <h2 className="text-4xl font-bold mb-4 relative z-10">Dominate Google <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00FFAA]">Faster</span></h2>
          <p className="text-gray-400 mb-8 relative z-10">Write 10x faster and unlock advanced AI SEO insights. Get 1,000,000 words generated, unlimited audits, and premium API access.</p>
          <button className="bg-gradient-to-r from-[#0066FF] to-[#00FFAA] text-black w-full py-4 rounded-xl font-bold shadow-lg transform transition hover:scale-[1.02]">
            Upgrade for $49/mo
          </button>
          <button className="mt-4 text-xs text-gray-500 hover:text-white" onClick={() => navigate('/')}>Go back to Dashboard</button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function MainLayout({ session, setSession }: { session: any, setSession: any }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans flex overflow-hidden">
      <Sidebar handleLogout={() => { supabase.auth.signOut(); setSession(null); }} session={session} />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto px-8 py-6 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects session={session} />} />
          <Route path="/agent" element={<><TopHeader title="AI SEO Agent" /><AIAgentStudio /></>} />
          <Route path="/memory" element={<SEOMemoryAgent />} />
          <Route path="/hindsight" element={<HindsightAI />} />
          <Route path="/analytics" element={<GenericPage title="Analytics" description="Track organic traffic, rankings, and AI-driven growth metrics." icon="📈" />} />
          <Route path="/integrations" element={<GenericPage title="System Integrations" description="Connect your Google Search Console, CMS, Analytics, and external data sources." icon="🔌" />} />
          <Route path="/upgrade" element={<UpgradePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">Loading...</div>;
  }

  const isAuthenticated = session !== null;

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setSession({ user: { email: 'demo@example.com' } })} />;
  }
  
  return (
    <BrowserRouter>
      <MainLayout session={session} setSession={setSession} />
    </BrowserRouter>
  );
}
