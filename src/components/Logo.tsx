interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function Logo({ size = 48, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.50 0.20 250)" />
            <stop offset="100%" stopColor="oklch(0.65 0.15 200)" />
          </linearGradient>
          <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.70 0.18 200)" />
            <stop offset="70%" stopColor="oklch(0.50 0.20 250)" />
            <stop offset="100%" stopColor="oklch(0.35 0.15 250)" />
          </radialGradient>
        </defs>
        
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="url(#eyeGradient)"
          strokeWidth="2"
          opacity="0.3"
        />
        
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="28"
          fill="none"
          stroke="url(#eyeGradient)"
          strokeWidth="3"
        />
        
        <circle
          cx="50"
          cy="50"
          r="18"
          fill="url(#irisGradient)"
        />
        
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="oklch(0.15 0.02 250)"
        />
        
        <circle
          cx="46"
          cy="46"
          r="3"
          fill="oklch(0.95 0.01 250)"
          opacity="0.8"
        />
        
        <path
          d="M 20 50 L 32 50 M 68 50 L 80 50 M 50 20 L 50 32 M 50 68 L 50 80"
          stroke="url(#eyeGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        <circle
          cx="50"
          cy="50"
          r="32"
          fill="none"
          stroke="url(#eyeGradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.4"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>
        
        <g opacity="0.5">
          <line x1="32" y1="38" x2="28" y2="34" stroke="url(#eyeGradient)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="38" x2="72" y2="34" stroke="url(#eyeGradient)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="62" x2="28" y2="66" stroke="url(#eyeGradient)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="62" x2="72" y2="66" stroke="url(#eyeGradient)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NetEye
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">
            Relationship Network
          </span>
        </div>
      )}
    </div>
  )
}
