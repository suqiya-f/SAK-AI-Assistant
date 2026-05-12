import React from 'react';

/**
 * Compact animated SAK badge (no star/sparkle icon).
 * Used as the assistant avatar and chat empty-state header.
 */
export default function SakBadge({ size = 'md', className = '' }) {
  const dims = {
    sm: { box: 'h-7 w-7', font: 'text-[9px]' },
    md: { box: 'h-9 w-9', font: 'text-[11px]' },
    lg: { box: 'h-14 w-14', font: 'text-[17px]' },
  }[size] || { box: 'h-9 w-9', font: 'text-[11px]' };

  return (
    <div
      className={`relative ${dims.box} rounded-xl bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 flex items-center justify-center shadow-[0_4px_20px_rgba(14,165,233,0.45)] sak-pulse ${className}`}
    >
      <span className="absolute inset-0 rounded-xl ring-1 ring-white/30 pointer-events-none" />
      <span className="sak-shine pointer-events-none" />
      <span className={`relative font-heading font-bold ${dims.font} tracking-[-0.04em] text-white leading-none`}>
        S<span className="text-sky-200">A</span>K
      </span>
      <style>{`
        @keyframes sakPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(14,165,233,0.45); }
          50%      { box-shadow: 0 4px 28px rgba(14,165,233,0.7); }
        }
        .sak-pulse { animation: sakPulse 2.4s ease-in-out infinite; }
        .sak-shine { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; }
        .sak-shine::after {
          content: ''; position: absolute; top: 0; left: -60%;
          width: 60%; height: 100%;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
          transform: skewX(-20deg);
          animation: sakShine 4s ease-in-out infinite;
        }
        @keyframes sakShine {
          0%   { left: -60%; }
          55%  { left: 130%; }
          100% { left: 130%; }
        }
      `}</style>
    </div>
  );
}
