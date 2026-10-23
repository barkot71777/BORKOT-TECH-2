import React from 'react';

interface BorkotTechLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'monogram';
  theme?: 'dark' | 'light' | 'auto';
  subtitle?: 'en' | 'bn' | 'none';
}

export const BorkotTechLogo: React.FC<BorkotTechLogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'dark',
  subtitle = 'bn'
}) => {
  const isDark = theme === 'dark' || theme === 'auto';

  // Distinctive SVG BT Monogram Symbol:
  // Hexagonal shield with geometric circuit lines forming interlocking 'B' & 'T'
  const MonogramSymbol = (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-9 h-9 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="btCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="btHexBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <filter id="btGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagon Shield with Cyber Notch */}
        <polygon
          points="32,3 58,18 58,46 32,61 6,46 6,18"
          fill="url(#btHexBg)"
          stroke="url(#btCyanGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Circuit tracks and accents */}
        <path
          d="M16 22 L24 22 L28 26 L28 38 L24 42 L16 42"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        <circle cx="16" cy="22" r="1.5" fill="#38bdf8" />
        <circle cx="16" cy="42" r="1.5" fill="#38bdf8" />

        {/* Interlocking Monogram: 'B' on the left, 'T' extending over and through */}
        {/* Stem of B and T */}
        <path
          d="M24 16 L24 48"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Upper lobe of B */}
        <path
          d="M24 18 H35 C38.5 18 41 20.5 41 24 C41 27.5 38.5 30 35 30 H24"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Lower lobe of B */}
        <path
          d="M24 30 H36 C39.8 30 43 33 43 37 C43 41 39.8 44 36 44 H24"
          stroke="#06b6d4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* T Crossbar on top extending across */}
        <path
          d="M19 16 H49"
          stroke="url(#btCyanGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Core processor dot */}
        <circle cx="48" cy="16" r="2" fill="#22d3ee" filter="url(#btGlow)" />
        <circle cx="43" cy="37" r="1.5" fill="#38bdf8" />
      </svg>
    </div>
  );

  if (variant === 'monogram') {
    return <div className={`inline-flex items-center ${className}`}>{MonogramSymbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {MonogramSymbol}

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight font-extrabold text-xl leading-none">
          <span className={isDark ? 'text-white' : 'text-slate-900'}>BORKOT</span>
          <span className="text-cyan-500 ml-1.5 font-black">TECH</span>
        </div>

        {subtitle !== 'none' && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {subtitle === 'bn' ? (
              <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                বরকত টেক
              </span>
            ) : (
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Premier Tech & Gaming
              </span>
            )}
            <span className="w-1 h-1 rounded-full bg-cyan-400 opacity-70"></span>
            <span className={`text-[9px] uppercase font-mono tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              BD
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
