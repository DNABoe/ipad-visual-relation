interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
  animated?: boolean
}

export function Logo({ size = 48, showText = true, className = '', animated = true }: LogoProps) {
  const gradientId = `eyeGradient-${Math.random().toString(36).substr(2, 9)}`
  const irisGradientId = `irisGradient-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`
  
  const primaryColor = 'oklch(0.65 0.11 185)'
  const accentColor = 'oklch(0.88 0.18 185)'
  const secondaryColor = 'oklch(0.3 0.04 230)'
  const backgroundColor = 'oklch(0.15 0.02 240)'
  const foregroundColor = 'oklch(1 0 0)'
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={accentColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
          <radialGradient id={irisGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="40%" stopColor={primaryColor} />
            <stop offset="70%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </radialGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
        />
        
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="30"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.5"
          filter={`url(#${glowId})`}
        />
        
        <circle
          cx="50"
          cy="50"
          r="20"
          fill={`url(#${irisGradientId})`}
          filter={`url(#${glowId})`}
        />
        
        <circle
          cx="50"
          cy="50"
          r="9"
          fill={backgroundColor}
        />
        
        <circle
          cx="45"
          cy="45"
          r="3.5"
          fill={foregroundColor}
        />
        
        <circle
          cx="48"
          cy="48"
          r="1.5"
          fill={foregroundColor}
        />
        
        <g>
          <line x1="20" y1="50" x2="30" y2="50" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="50" x2="80" y2="50" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="20" x2="50" y2="30" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="70" x2="50" y2="80" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeDasharray="5 5"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="20s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        
        <g>
          <circle cx="30" cy="30" r="2" fill={`url(#${gradientId})`} />
          <circle cx="70" cy="30" r="2" fill={`url(#${gradientId})`} />
          <circle cx="30" cy="70" r="2" fill={`url(#${gradientId})`} />
          <circle cx="70" cy="70" r="2" fill={`url(#${gradientId})`} />
        </g>
        
        <path
          d="M 35 35 L 40 40 M 60 40 L 65 35 M 35 65 L 40 60 M 65 65 L 60 60"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div className="flex flex-col items-start">
          <span className="text-5xl font-bold tracking-tight leading-none bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent drop-shadow-lg">RelEye</span>
          <span className="text-sm text-muted-foreground tracking-[0.15em] uppercase leading-tight mt-2 font-medium">
            Relationship<br/>Network
          </span>
        </div>
      )}
    </div>
  );
}
