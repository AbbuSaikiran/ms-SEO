import { useState, useEffect } from 'react';
import { Search, GitBranch, Lock, ChevronDown, CheckCircle2, Loader2, Github } from 'lucide-react';
import { supabase } from './lib/supabase';

const Projects = ({ session }: { session: any }) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [githubUser, setGithubUser] = useState<any>(null);

  useEffect(() => {
    // Look for GitHub token from current session or local storage
    const providerToken = session?.provider_token;
    
    if (providerToken) {
      fetchGitHubData(providerToken);
    } else {
      const storedToken = localStorage.getItem('github_token');
      if (storedToken) {
        fetchGitHubData(storedToken);
      }
    }
  }, [session]);

  const fetchGitHubData = async (token: string) => {
    setLoading(true);
    try {
      localStorage.setItem('github_token', token);
      
      // Fetch User
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userData.login) setGithubUser(userData);

      // Fetch Repos
      const repoRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=15', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const repoData = await repoRes.json();
      if (Array.isArray(repoData)) {
        setRepos(repoData);
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('github_token');
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user',
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Let's build something new.</h1>
          <p className="text-white/50 mt-1">To deploy a new Project, import an existing Git Repository or get started with a Template.</p>
        </div>
      </div>

      <div className="flex gap-8 max-w-5xl">
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold mb-4">Import Git Repository</h2>
              
              <div className="flex gap-3 mb-6">
                <button 
                  onClick={!githubUser ? connectGitHub : undefined}
                  className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <GitBranch size={16} />
                  {githubUser ? githubUser.login : 'Connect GitHub'}
                  {githubUser && <ChevronDown size={14} className="ml-1 text-white/50" />}
                </button>
                
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search repositories..." 
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Repo List */}
              <div className="flex flex-col gap-2">
                {loading ? (
                  <div className="flex items-center justify-center p-8 text-white/40">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : repos.length > 0 ? (
                  repos.map((repo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-lg transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10 text-white/70">
                          {repo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repo.name}</span>
                            {repo.private && <Lock size={12} className="text-white/40" />}
                          </div>
                          <span className="text-white/40 text-xs text-nowrap">
                            Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                        Import
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <GitBranch size={24} className="mx-auto text-white/30 mb-2" />
                    <h3 className="font-medium text-white/70 mb-1">No repositories found</h3>
                    <p className="text-sm text-white/40 mb-4">Connect your GitHub account to import repositories.</p>
                    <button 
                      onClick={connectGitHub}
                      className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Connect GitHub
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {repos.length > 0 && (
              <div className="p-4 bg-[#0A0A0A] border-t border-white/10 mt-auto text-center">
                <button className="text-sm text-white/50 hover:text-white transition-colors">
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          {/* Provider Selection */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 text-center">
            <h3 className="text-sm font-medium text-white/70 mb-4">Select a Git provider to import an existing project.</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={connectGitHub}
                className="flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <GitBranch size={18} />
                {githubUser ? 'GitHub Connected' : 'Connect GitHub'}
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white/30 cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium">
                <GitBranch size={18} />
                GitLab
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white/30 cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium">
                <div className="w-4 h-4 bg-white/20 rounded-sm" /> 
                Bitbucket
              </button>
            </div>
          </div>

          {/* Current Projects Preview */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center justify-between">
              Recent Projects
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60">3 Active</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              {[
                { name: 'bits', url: 'bits-beige.vercel.app' },
                { name: 'sybrai-beta', url: 'sybrai-beta-theta.vercel.app' },
                { name: 'sybrai-website', url: 'sybrai-website.vercel.app' }
              ].map((proj, i) => (
                <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{proj.name}</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-xs text-white/40">{proj.url}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
