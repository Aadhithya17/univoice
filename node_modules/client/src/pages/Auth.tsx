import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Mail, Lock, User as UserIcon, CheckCircle, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { signup, verifyEmail, login, setGuestMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'select' | 'login' | 'signup'>('select');
  
  // Form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect target after auth
  const from = (location.state as any)?.from?.pathname || '/';

  const generateRandomUsername = () => {
    const adjectives = [
      'stealthy', 'silent', 'curious', 'flying', 'neon', 'cosmic', 'retro', 'mystic', 
      'wise', 'brave', 'swift', 'clever', 'hidden', 'digital', 'shadow', 'quantum', 
      'spectral', 'solar', 'astral', 'cyber'
    ];
    const nouns = [
      'scholar', 'badger', 'panther', 'eagle', 'falcon', 'wizard', 'ranger', 'phoenix', 
      'coder', 'hacker', 'owl', 'fox', 'wolf', 'pioneer', 'voyager', 'warden', 
      'monk', 'knight', 'titan', 'scout'
    ];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(10 + Math.random() * 90);
    
    setUsername(`${adj}_${noun}_${num}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        toast(`Welcome back, ${data.user.username}!`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setLoading(true);

    try {
      const data = await signup(username, email, password);
      if (data.success) {
        toast(`Welcome to UniVoice, ${data.user.username}!`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black light-theme:bg-white px-4 py-8 overflow-y-auto w-full">
      <div className="w-full max-w-md space-y-5 glass-panel p-6 rounded-2xl border border-slate-800 light-theme:border-slate-200 shadow-2xl relative overflow-hidden my-4">
        
        {/* Academic logo and badge */}
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-500 mb-2">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white light-theme:text-slate-900">
            Uni<span className="text-brand-500 font-black">Voice</span>
          </h1>
          <p className="mt-1 text-[10px] text-slate-500 light-theme:text-slate-400 uppercase tracking-widest font-bold">
            Private Campus Confessions
          </p>
        </div>

        {/* 1. Selector Mode Screen */}
        {mode === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-200">
                Are you a new user or already a user?
              </h2>
              <p className="text-[11px] text-slate-550 mt-0.5">
                Choose an option below to enter the secure campus portal.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <button
                onClick={() => setMode('login')}
                className="w-full p-4 rounded-xl border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-left transition-all duration-300 group flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-brand-400 transition-colors">
                    I am already a user (Sign In)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Sign in with your email and password.
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => setMode('signup')}
                className="w-full p-4 rounded-xl border border-slate-800 hover:border-brand-500/50 hover:bg-brand-500/5 text-left transition-all duration-300 group flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-brand-400 transition-colors">
                    I am a new user (Create Account)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Register and choose an anonymous student handle.
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Login Mode Window */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">College Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9 text-xs py-1.5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 text-xs py-1.5"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 btn-primary font-bold text-xs">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setMode('select')}
              className="w-full py-1.5 bg-slate-900/50 hover:bg-slate-900 text-slate-400 rounded-lg text-[11px] font-semibold border border-slate-800 transition-colors"
            >
              Back to Options
            </button>
          </form>
        )}

        {/* 3. Signup Mode Window */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3 animate-fade-in">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400">Anonymous Username</label>
                <button
                  type="button"
                  onClick={generateRandomUsername}
                  className="text-[10px] text-brand-450 hover:underline font-bold transition-all"
                >
                  Suggest a Name
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                  <UserIcon size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="blue_scholar"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-9 pr-20 text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={generateRandomUsername}
                  className="absolute right-2 px-2 py-0.5 text-[9px] bg-slate-850 hover:bg-slate-800 text-slate-300 rounded font-semibold border border-slate-800 transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="text-[9px] text-slate-550 light-theme:text-slate-400">
                Letters, numbers & underscores only. Feel free to randomize.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">College Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9 text-xs py-1.5"
                />
              </div>
              <p className="text-[9px] text-slate-550 light-theme:text-slate-400">
                Used to verify active student enrollment format.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 text-xs py-1.5"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 btn-primary font-bold text-xs">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => setMode('select')}
              className="w-full py-1.5 bg-slate-900/50 hover:bg-slate-900 text-slate-400 rounded-lg text-[11px] font-semibold border border-slate-800 transition-colors"
            >
              Back to Options
            </button>
          </form>
        )}

        {/* Footer switches */}
        <div className="pt-3 border-t border-slate-850 light-theme:border-slate-100 text-center">
          {mode === 'login' && (
            <p className="text-[11px] text-slate-400">
              New to the community?{' '}
              <button onClick={() => setMode('signup')} className="text-brand-455 hover:underline font-bold">
                Create an account
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-[11px] text-slate-400">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-brand-455 hover:underline font-bold">
                Sign In
              </button>
            </p>
          )}

          {mode === 'select' && (
            <p className="text-[10px] text-slate-500">
              UniVoice securely validates university domains before granting access.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
export default Auth;
