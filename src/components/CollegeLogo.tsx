import React from 'react';

interface CollegeLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  className = '',
  size = 'md',
  showText = false
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dimMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  };

  const dim = dimMap[size] || 40;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Alpine Degree College Khanpur Crest SVG */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
      >
        {/* Outer Circle Background */}
        <circle cx="100" cy="100" r="96" fill="#15803d" stroke="#047857" strokeWidth="3" />
        
        {/* Outer Ring Gold/White Border */}
        <circle cx="100" cy="100" r="80" fill="#fde68a" stroke="#ffffff" strokeWidth="2.5" />
        
        {/* Inner Peach Oval Background */}
        <circle cx="100" cy="100" r="66" fill="#fcd34d" opacity="0.2" />
        <ellipse cx="100" cy="100" rx="60" ry="60" fill="#fbcfe8" opacity="0.25" />
        <circle cx="100" cy="100" r="60" fill="#fef3c7" />

        {/* Text on Curved Ring */}
        <path id="textCircleTop" d="M 28 100 A 72 72 0 1 1 172 100" fill="none" />
        <path id="textCircleBottom" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />

        {/* Outer Ring Text Top */}
        <text fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="0.8">
          <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle">
            ALPINE DEGREE COLLEGE (REGD.)
          </textPath>
        </text>

        {/* Outer Ring Text Bottom */}
        <text fill="#ffffff" fontSize="14" fontWeight="900" letterSpacing="1.2">
          <textPath href="#textCircleBottom" startOffset="50%" textAnchor="middle">
            KHANPUR
          </textPath>
        </text>

        {/* Decorative Stars on Outer Ring */}
        {/* Left Stars */}
        <polygon points="34,80 37,87 45,87 38,92 41,99 34,94 27,99 30,92 23,87 31,87" fill="#ffffff" />
        <polygon points="26,104 29,111 37,111 30,116 33,123 26,118 19,123 22,116 15,111 23,111" fill="#ffffff" />
        <polygon points="36,130 39,137 47,137 40,142 43,149 36,144 29,149 32,142 25,137 33,137" fill="#ffffff" />

        {/* Right Stars */}
        <polygon points="166,80 169,87 177,87 170,92 173,99 166,94 159,99 162,92 155,87 163,87" fill="#ffffff" />
        <polygon points="174,104 177,111 185,111 178,116 181,123 174,118 167,123 170,116 163,111 171,111" fill="#ffffff" />
        <polygon points="164,130 167,137 175,137 168,142 171,149 164,144 157,149 160,142 153,137 161,137" fill="#ffffff" />

        {/* Inner Shield Body */}
        <path
          d="M 68 52 C 85 52 92 42 100 40 C 108 42 115 52 132 52 C 132 100 120 135 100 152 C 80 135 68 100 68 52 Z"
          fill="#1e1b4b"
          stroke="#312e81"
          strokeWidth="2"
        />

        {/* Grid pattern on shield */}
        <path
          d="M 68 70 H 132 M 68 90 H 132 M 68 110 H 132 M 75 130 H 125 M 85 52 V 145 M 100 40 V 152 M 115 52 V 145"
          stroke="#4338ca"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* Globe at top of Shield */}
        <circle cx="100" cy="68" r="16" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Globe Continents & Latitudes */}
        <ellipse cx="100" cy="68" rx="16" ry="6" fill="none" stroke="#e0f2fe" strokeWidth="1" />
        <ellipse cx="100" cy="68" rx="7" ry="16" fill="none" stroke="#e0f2fe" strokeWidth="1" />
        <path d="M 88 64 C 92 60 100 62 104 58 M 92 72 C 98 70 106 74 112 70" stroke="#10b981" strokeWidth="2" fill="none" />

        {/* Ribbon - "TOWARDS ACADEMIC EXCELLENCE" */}
        <path
          d="M 46 100 L 60 92 L 140 92 L 154 100 L 142 108 L 58 108 Z"
          fill="#312e81"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        {/* Ribbon Fold Tails */}
        <path d="M 46 100 L 58 108 L 58 116 Z" fill="#1e1b4b" />
        <path d="M 154 100 L 142 108 L 142 116 Z" fill="#1e1b4b" />

        <text x="100" y="98" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">
          TOWARDS
        </text>
        <text x="100" y="105" fill="#fef08a" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
          ACADEMIC EXCELLENCE
        </text>

        {/* Open Book at bottom of Shield */}
        <g transform="translate(100, 130)">
          {/* Left Page */}
          <path d="M -18 0 C -10 -4 -4 -2 0 2 L 0 14 C -4 10 -10 8 -18 12 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Right Page */}
          <path d="M 18 0 C 10 -4 4 -2 0 2 L 0 14 C 4 10 10 8 18 12 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Book Spine */}
          <path d="M 0 2 L 0 14" stroke="#475569" strokeWidth="1.5" />
          {/* Book text lines */}
          <line x1="-14" y1="4" x2="-4" y2="2" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="-14" y1="7" x2="-4" y2="5" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="4" y1="2" x2="14" y2="4" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="4" y1="5" x2="14" y2="7" stroke="#cbd5e1" strokeWidth="1" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white leading-tight text-sm tracking-tight">
            Alpine Degree College
          </span>
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
            Khanpur • Affiliated with IUB
          </span>
        </div>
      )}
    </div>
  );
};
