import React from 'react';

/**
 * Animated SAK monogram logo — replaces the previous sparkle-star.
 * - Gradient sky-blue tile with rounded corners
 * - "SAK" letters with the "A" in cyan accent
 * - Subtle pulse glow + hover lift
 * - Small "by Suqiya" tag only when size="lg"
 */
export default function Logo({ size = 'md' }) {
  const dims = {
    sm: { tile: 'h-7 w-7', font: 'text-[10px]', title: 'text-base' },
    md: { tile: 'h-9 w-9', font: 'text-[12px]', title: 'text-lg' },
    lg: { tile: 'h-12 w-12', font: 'text-[15px]', title: 'text-2xl' },
  }[size] || { tile: 'h-9 w-9', font: 'text-[12px]', title: 'text-lg' };

  return (
    <div className="flex items-center gap-2.5 group" data-testid="brand-logo">
      <div
        className={`relative ${dims.tile} rounded-xl bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 flex items-center justify-center shadow-[0_6px_24px_rgba(14,165,233,0.4)] transition-transform duration-300 group-hover:-translate-y-0.5 logo-pulse`}
      >
        {/* Inner highlight */}
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/30 pointer-events-none" />
        {/* Shine sweep */}
        <span className="logo-shine pointer-events-none" />
        {/* Monogram */}
        <span className={`relative font-heading font-bold ${dims.font} tracking-[-0.04em] text-white leading-none`}>
          S<span className="text-sky-200">A</span>K
        </span>
      </div>
      <div className="leading-tight">
        <div className={`font-heading ${dims.title} font-semibold tracking-tight text-slate-900 dark:text-white`}>
          SAK <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600">AI</span>
        </div>
        {size === 'lg' && (
          <div className="text-xs text-slate-500 dark:text-slate-400">by Suqiya</div>
        )}
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 6px 24px rgba(14,165,233,0.40); }
          50%      { box-shadow: 0 6px 32px rgba(14,165,233,0.65); }
        }
        .logo-pulse { animation: logoPulse 2.6s ease-in-out infinite; }

        .logo-shine {
          position: absolute; inset: 0; border-radius: inherit; overflow: hidden;
        }
        .logo-shine::after {
          content: ''; position: absolute; top: 0; left: -60%;
          width: 60%; height: 100%;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
          transform: skewX(-20deg);
          animation: logoShine 3.6s ease-in-out infinite;
        }
        @keyframes logoShine {
          0%   { left: -60%; }
          55%  { left: 130%; }
          100% { left: 130%; }
        }
      `}</style>
    </div>
  );
}
