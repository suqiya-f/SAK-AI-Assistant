import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../lib/auth';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/app');
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
        <Link to="/"><Logo /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left: pitch */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-sky-50 via-white to-white dark:from-sky-950/30 dark:via-slate-950 dark:to-slate-950 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-600/20 blur-3xl" />
          <div className="relative max-w-md">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">SAK AI Assistant</div>
            <h2 className="mt-4 font-heading text-4xl xl:text-5xl font-semibold tracking-tighter">
              Welcome to your intelligent workspace.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Chat with AI, generate images, translate languages, and capture ideas — all
              in one beautifully crafted experience by Suqiya.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {mode === 'login' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Welcome back to SAK AI.'
                : 'Join SAK AI in seconds — no credit card required.'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4" data-testid="auth-form">
              {mode === 'register' && (
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    data-testid="name-input"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  data-testid="email-input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  data-testid="password-input"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              {err && (
                <div data-testid="auth-error" className="rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-sm px-3 py-2">
                  {err}
                </div>
              )}

              <button
                data-testid="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-5 py-3 text-sm font-medium text-white transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <button
              data-testid="auth-toggle-mode"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}
              className="mt-6 text-sm text-sky-600 dark:text-sky-400 hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
