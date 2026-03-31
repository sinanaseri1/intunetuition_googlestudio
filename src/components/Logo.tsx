export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="green-stripes" width="8" height="120" patternUnits="userSpaceOnUse">
          <rect width="4" height="120" fill="#6ebf8b" />
        </pattern>
        <pattern id="yellow-stripes" width="8" height="120" patternUnits="userSpaceOnUse">
          <rect width="4" height="120" fill="#f2d04b" />
        </pattern>
      </defs>
      
      <g opacity="0.9">
        {/* Left green circle */}
        <circle cx="100" cy="60" r="30" fill="url(#green-stripes)" />
        {/* Middle-left yellow circle */}
        <circle cx="150" cy="60" r="40" fill="url(#yellow-stripes)" />
        {/* Middle green wave/diamond */}
        <path d="M 210 10 C 240 10, 250 60, 250 60 C 250 60, 240 110, 210 110 C 180 110, 170 60, 170 60 C 170 60, 180 10, 210 10 Z" fill="url(#green-stripes)" />
        {/* Right yellow circle */}
        <circle cx="280" cy="60" r="30" fill="url(#yellow-stripes)" />
      </g>

      <text x="200" y="72" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="42" textAnchor="middle" fill="#1a1a1a" letterSpacing="-1.5">
        in tune tuition
      </text>
    </svg>
  );
}
