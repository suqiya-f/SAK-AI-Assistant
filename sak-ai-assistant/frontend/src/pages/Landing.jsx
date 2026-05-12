import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, MessageSquare, Image as ImageIcon, Languages,
  BookmarkPlus, Sparkles, ShieldCheck, Moon, Send, Wand2,
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const HERO_BG = "https://images.unsplash.com/photo-1776875097847-49bd9bcf1eca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwyfHxhaSUyMHRlY2hub2xvZ3klMjBkYXNoYm9hcmQlMjBkYXJrJTIwYmx1ZXxlbnwwfHx8fDE3Nzg1ODAzMjN8MA&ixlib=rb-4.1.0&q=85";

const FEATURES = [
  { icon: MessageSquare, title: 'Smart Chat', desc: 'Markdown-rich conversations with context awareness.' },
  { icon: ImageIcon, title: 'Image Studio', desc: 'Generate stunning visuals with Nano Banana.' },
  { icon: Languages, title: 'Translate 15+', desc: 'High-quality translations powered by Claude.' },
  { icon: BookmarkPlus, title: 'Notes & Bookmarks', desc: 'Save insights and links to revisit anytime.' },
  { icon: ShieldCheck, title: 'Secure Auth', desc: 'JWT + bcrypt, your data stays yours.' },
  { icon: Moon, title: 'Dark Mode', desc: 'A premium look in any light.' },
];

const LANGS = ['English','Español','Français','Deutsch','日本語','中文','한국어','العربية','हिन्दी','Português','Italiano','Русский','اردو','Türkçe','Nederlands','Svenska'];

const PROMPTS = [
  { you: 'Draft a launch tweet for SAK AI.', ai: '🚀 Meet SAK AI — your intelligent companion for ideas, images & translation. Built with love by Suqiya. #SAKAI' },
  { you: 'Explain quantum computing simply.', ai: '⚛️ Imagine bits that can be 0 and 1 at the same time — that\'s a qubit. They let computers explore many possibilities in parallel.' },
  { you: 'Generate a logo idea for a coffee brand.', ai: '☕ A minimal steam swirl forming the letter "C", set in warm caramel & charcoal. Modern, friendly, memorable.' },
  { you: '¿Cómo se dice "good morning" en japonés?', ai: '🌸 おはようございます (Ohayō gozaimasu) — used in formal mornings.' },
];

function useTyping(text, speed = 18) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

function ChatPreview() {
  const [idx, setIdx] = useState(0);
  const { you, ai } = PROMPTS[idx];
  const youT = useTyping(you, 22);
  const aiT = useTyping(youT.length >= you.length ? ai : '', 14);

  useEffect(() => {
    const totalMs = (you.length * 22) + (ai.length * 14) + 2200;
    const id = setTimeout(() => setIdx((i) => (i + 1) % PROMPTS.length), totalMs);
    return () => clearTimeout(id);
  }, [idx, you.length, ai.length]);

  return (
    <div className="relative rounded-2xl border border-sky-500/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(14,165,233,0.18)] float-card">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-sky-500/80">SAK · live</div>
      </div>
      <div className="mt-4 space-y-3 min-h-[170px]">
        <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20 p-3 text-sm">
          <span className="font-semibold text-sky-700 dark:text-sky-300">You: </span>
          {youT}
          {youT.length < you.length && <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-sky-500 animate-pulse" />}
        </div>
        {youT.length >= you.length && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">SAK AI: </span>
            {aiT}
            {aiT.length < ai.length && <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-sky-500 animate-pulse" />}
          </div>
        )}
      </div>
      <div className="mt-3 rounded-xl border border-dashed border-sky-400/40 p-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span className="flex-1">Type a message…</span>
        <span className="h-7 w-7 rounded-lg bg-gradient-to-r from-sky-400 to-sky-600 grid place-items-center text-white">
          <Send className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function FloatingTiles() {
  // animated decorative tiles around the chat preview
  return (
    <>
      <div className="hidden lg:block absolute -top-10 -left-12 w-28 h-28 rounded-2xl bg-gradient-to-br from-sky-300 to-sky-500 shadow-[0_10px_40px_rgba(14,165,233,0.4)] grid place-items-center text-white tile-float tile-float-1">
        <Wand2 className="h-10 w-10" />
      </div>
      <div className="hidden lg:block absolute -bottom-8 -right-6 w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl grid place-items-center tile-float tile-float-2">
        <Languages className="h-8 w-8 text-sky-500" />
      </div>
      <div className="hidden md:block absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg tile-float tile-float-3 grid place-items-center text-white">
        <Sparkles className="h-7 w-7" />
      </div>
    </>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              data-testid="get-started-btn"
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-glow-sky"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-40 dark:opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white dark:from-slate-950/40 dark:via-slate-950/85 dark:to-slate-950" />
          {/* Animated blobs */}
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-50/60 dark:bg-sky-500/10 px-3 py-1.5 text-xs font-medium tracking-wide text-sky-700 dark:text-sky-300 shimmer-badge">
              <Sparkles className="h-3.5 w-3.5" /> Created by Suqiya
            </div>
            <h1 className="mt-6 font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05]">
              Turning Ideas into{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600 word-shimmer">
                Intelligent Experiences
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              SAK AI is your all-in-one assistant for smart chat, image generation,
              translation, and creative workflows — beautifully designed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                data-testid="hero-cta-btn"
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-glow-sky"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <FloatingTiles />
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* Languages marquee */}
      <section className="relative overflow-hidden border-y border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40">
        <div className="marquee py-4">
          <div className="marquee-track">
            {[...LANGS, ...LANGS].map((l, i) => (
              <span key={i} className="mx-6 text-sm font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Features</div>
          <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-medium tracking-tight">
            Everything you need to think, create, and ship.
          </h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-testid={`feature-card-${i}`}
              className="reveal-card rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-500/15 dark:to-sky-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              <div className="mt-4 h-px w-0 bg-gradient-to-r from-sky-400 to-sky-600 hover-bar transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-800 p-10 md:p-14 text-white">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-sky-100/90">Ready when you are</div>
            <h3 className="mt-3 font-heading text-3xl md:text-4xl font-semibold tracking-tighter">
              Start creating with SAK AI in 30 seconds.
            </h3>
            <p className="mt-3 text-sky-50/90 max-w-lg">
              Free to try. No credit card. Built with love by Suqiya.
            </p>
            <Link
              to="/auth"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-sky-700 hover:text-sky-900 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div>© {new Date().getFullYear()} SAK AI — Created by Suqiya</div>
          <div className="flex gap-4">
            <span>#SAKAI</span>
            <span>#CreatedBySuqiya</span>
          </div>
        </div>
      </footer>

      {/* Local animations */}
      <style>{`
        /* Floating blobs */
        .blob {
          position: absolute; border-radius: 9999px; filter: blur(60px);
          opacity: 0.45;
        }
        .blob-1 {
          top: -120px; left: -80px; width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(56,189,248,0.6), transparent 70%);
          animation: blobMove1 14s ease-in-out infinite;
        }
        .blob-2 {
          top: 30%; right: -120px; width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(125,211,252,0.55), transparent 70%);
          animation: blobMove2 18s ease-in-out infinite;
        }
        .blob-3 {
          bottom: -100px; left: 40%; width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(14,165,233,0.45), transparent 70%);
          animation: blobMove3 22s ease-in-out infinite;
        }
        @keyframes blobMove1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes blobMove2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(0.95); }
        }
        @keyframes blobMove3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.05); }
        }

        /* Floating chat card */
        .float-card { animation: floatY 5s ease-in-out infinite; }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Decorative tiles around the chat card */
        .tile-float-1 { animation: floatTilt 6s ease-in-out infinite; }
        .tile-float-2 { animation: floatTilt 7s ease-in-out 0.5s infinite reverse; }
        .tile-float-3 { animation: floatTilt 8s ease-in-out 1s infinite; }
        @keyframes floatTilt {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%     { transform: translateY(-14px) rotate(4deg); }
        }

        /* Word shimmer on the gradient heading */
        .word-shimmer {
          background-size: 200% 100%;
          animation: wordShimmer 4s linear infinite;
        }
        @keyframes wordShimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Subtle shimmer on the badge */
        .shimmer-badge { position: relative; overflow: hidden; }
        .shimmer-badge::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: badgeShine 3.5s ease-in-out infinite;
        }
        @keyframes badgeShine { to { transform: translateX(100%); } }

        /* Feature cards reveal */
        .reveal-card {
          opacity: 0; transform: translateY(20px);
          animation: cardIn 700ms ease-out forwards;
        }
        @keyframes cardIn { to { opacity: 1; transform: translateY(0); } }
        .reveal-card:hover .hover-bar { width: 100%; }

        /* Marquee */
        .marquee { width: 100%; overflow: hidden; }
        .marquee-track {
          display: inline-flex; white-space: nowrap;
          animation: marqueeRun 28s linear infinite;
        }
        @keyframes marqueeRun {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
