import React, { useEffect, useState } from 'react';

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 3500);
    const t2 = setTimeout(() => onDone?.(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      data-testid="splash-screen"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#020617] transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Star field */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-sky-300"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.2 + Math.random() * 0.7,
              animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Soft radial halo */}
      <div className="absolute h-[40rem] w-[40rem] rounded-full bg-sky-500/15 blur-[100px]" />

      <div className="relative flex flex-col items-center" style={{ width: 320 }}>
        {/* Orbit rings */}
        <div className="relative h-44 w-44 flex items-center justify-center">
          <div className="orbit orbit-1" />
          <div className="orbit orbit-2" />
          <div className="orbit orbit-3" />

          {/* Orbiting dots */}
          <div className="dot-orbit dot-orbit-1"><span className="dot" /></div>
          <div className="dot-orbit dot-orbit-2"><span className="dot dot-amber" /></div>

          {/* Monogram core */}
          <div className="monogram">
            <span className="ml letter-s">S</span>
            <span className="ml letter-a">A</span>
            <span className="ml letter-k">K</span>
          </div>
        </div>

        {/* Title reveal (typewriter) */}
        <div className="mt-8 h-8 overflow-hidden">
          <div className="title font-heading text-2xl font-medium tracking-[0.35em] text-white">
            SAK AI ASSISTANT
          </div>
        </div>

        {/* Tagline */}
        <div className="tagline mt-2 text-[10px] uppercase tracking-[0.6em] text-sky-400/80">
          by Suqiya
        </div>

        {/* Dots loader */}
        <div className="mt-8 flex gap-2">
          <span className="ldot" />
          <span className="ldot ldot-2" />
          <span className="ldot ldot-3" />
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.15; transform: scale(0.6); }
          to   { opacity: 1;    transform: scale(1.2); }
        }

        /* Orbit rings */
        .orbit {
          position: absolute;
          border-radius: 9999px;
          border: 1px solid rgba(56,189,248,0.25);
          opacity: 0;
          animation: orbitIn 700ms ease-out forwards, orbitSpin linear infinite;
        }
        .orbit-1 {
          height: 88px; width: 88px;
          animation-delay: 150ms, 700ms; animation-duration: 700ms, 6s;
          border-color: rgba(56,189,248,0.45);
        }
        .orbit-2 {
          height: 132px; width: 132px;
          animation-delay: 300ms, 700ms; animation-duration: 700ms, 9s;
          border-style: dashed;
          border-color: rgba(125,211,252,0.35);
        }
        .orbit-3 {
          height: 176px; width: 176px;
          animation-delay: 450ms, 700ms; animation-duration: 700ms, 14s;
          border-color: rgba(14,165,233,0.2);
        }
        @keyframes orbitIn {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes orbitSpin {
          to { transform: rotate(360deg); }
        }

        /* Orbiting dots */
        .dot-orbit {
          position: absolute;
          border-radius: 9999px;
          animation: orbitSpin linear infinite;
          opacity: 0;
        }
        .dot-orbit-1 {
          height: 132px; width: 132px;
          animation-duration: 4s;
          animation-delay: 600ms;
          animation-name: orbitSpin, fadeIn;
          animation-duration: 4s, 500ms;
          animation-iteration-count: infinite, 1;
          animation-fill-mode: forwards, forwards;
        }
        .dot-orbit-2 {
          height: 176px; width: 176px;
          animation-name: orbitSpinR, fadeIn;
          animation-duration: 7s, 500ms;
          animation-delay: 800ms, 800ms;
          animation-iteration-count: infinite, 1;
          animation-fill-mode: forwards, forwards;
        }
        @keyframes orbitSpinR { to { transform: rotate(-360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dot {
          position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
          width: 8px; height: 8px; border-radius: 9999px;
          background: #38bdf8;
          box-shadow: 0 0 16px #38bdf8, 0 0 4px #fff;
        }
        .dot-amber { background: #fbbf24; box-shadow: 0 0 14px #fbbf24, 0 0 4px #fff; }

        /* Monogram letters */
        .monogram {
          position: relative;
          display: flex; gap: 2px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 36px;
          letter-spacing: -0.04em;
          color: #f8fafc;
        }
        .monogram::before {
          content: '';
          position: absolute; inset: -10px -14px;
          border-radius: 18px;
          background: radial-gradient(closest-side, rgba(14,165,233,0.55), transparent 70%);
          filter: blur(8px);
          z-index: -1;
          animation: pulseGlow 2s ease-in-out infinite alternate;
        }
        .ml {
          display: inline-block;
          opacity: 0; transform: translateY(20px) rotateX(-90deg);
          animation: letterIn 700ms cubic-bezier(.2,.9,.2,1.2) forwards;
          text-shadow: 0 0 18px rgba(56,189,248,0.7);
        }
        .letter-s { animation-delay: 700ms; }
        .letter-a { animation-delay: 900ms; color: #38bdf8; }
        .letter-k { animation-delay: 1100ms; }
        @keyframes letterIn {
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes pulseGlow {
          from { opacity: 0.5; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.1); }
        }

        /* Typewriter title */
        .title {
          width: 0;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid #38bdf8;
          animation: typing 1.4s steps(16, end) 1500ms forwards, caret 700ms steps(1) 1500ms 4 alternate;
        }
        @keyframes typing { to { width: 100%; } }
        @keyframes caret { 50% { border-color: transparent; } }

        .tagline { opacity: 0; animation: fadeIn 600ms ease-out 3000ms forwards; }

        /* Loader dots */
        .ldot {
          width: 6px; height: 6px; border-radius: 9999px;
          background: #38bdf8;
          opacity: 0;
          animation: ldot 1.2s ease-in-out 2400ms infinite;
        }
        .ldot-2 { animation-delay: 2550ms; }
        .ldot-3 { animation-delay: 2700ms; }
        @keyframes ldot {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
