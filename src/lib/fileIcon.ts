export function generateFileIcon(): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(78 186 179)" />
      <stop offset="50%" stop-color="rgb(149 234 228)" />
      <stop offset="100%" stop-color="rgb(149 234 228)" />
    </linearGradient>
    <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgb(149 234 228)" />
      <stop offset="40%" stop-color="rgb(78 186 179)" />
      <stop offset="70%" stop-color="rgb(78 186 179)" />
      <stop offset="100%" stop-color="rgb(50 58 76)" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(149 234 228)" />
      <stop offset="100%" stop-color="rgb(78 186 179)" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="128" cy="128" r="120" fill="rgb(30 32 44)" opacity="0.95"/>
  
  <!-- Outer eye circle -->
  <circle
    cx="128"
    cy="128"
    r="100"
    fill="none"
    stroke="url(#eyeGradient)"
    stroke-width="3"
  />
  
  <!-- Eye shape -->
  <ellipse
    cx="128"
    cy="128"
    rx="94"
    ry="65"
    fill="none"
    stroke="url(#eyeGradient)"
    stroke-width="7"
    filter="url(#glow)"
  />
  
  <!-- Iris -->
  <circle
    cx="128"
    cy="128"
    r="42"
    fill="url(#irisGradient)"
    filter="url(#glow)"
  />
  
  <!-- Pupil -->
  <circle
    cx="128"
    cy="128"
    r="19"
    fill="rgb(30 32 44)"
  />
  
  <!-- Eye highlights -->
  <circle
    cx="118"
    cy="118"
    r="7"
    fill="rgb(255 255 255)"
  />
  
  <circle
    cx="124"
    cy="124"
    r="3"
    fill="rgb(255 255 255)"
  />
  
  <!-- Connection lines -->
  <g>
    <line x1="42" y1="128" x2="64" y2="128" stroke="url(#eyeGradient)" stroke-width="5" stroke-linecap="round" />
    <line x1="192" y1="128" x2="214" y2="128" stroke="url(#eyeGradient)" stroke-width="5" stroke-linecap="round" />
    <line x1="128" y1="42" x2="128" y2="64" stroke="url(#eyeGradient)" stroke-width="5" stroke-linecap="round" />
    <line x1="128" y1="192" x2="128" y2="214" stroke="url(#eyeGradient)" stroke-width="5" stroke-linecap="round" />
  </g>
  
  <!-- Rotating dashed circle -->
  <circle
    cx="128"
    cy="128"
    r="75"
    fill="none"
    stroke="url(#eyeGradient)"
    stroke-width="3"
    stroke-dasharray="10 10"
    opacity="0.7"
  />
  
  <!-- Corner connection nodes -->
  <g>
    <circle cx="64" cy="64" r="4" fill="url(#eyeGradient)" />
    <circle cx="192" cy="64" r="4" fill="url(#eyeGradient)" />
    <circle cx="64" cy="192" r="4" fill="url(#eyeGradient)" />
    <circle cx="192" cy="192" r="4" fill="url(#eyeGradient)" />
  </g>
  
  <!-- Corner connection lines -->
  <path
    d="M 75 75 L 85 85 M 171 85 L 181 75 M 75 181 L 85 171 M 181 181 L 171 171"
    stroke="url(#eyeGradient)"
    stroke-width="3"
    stroke-linecap="round"
  />
  
  <!-- Lock badge -->
  <g transform="translate(180, 180)">
    <!-- Lock background circle -->
    <circle cx="0" cy="0" r="32" fill="rgb(30 32 44)" stroke="url(#lockGradient)" stroke-width="3"/>
    
    <!-- Lock shackle -->
    <path
      d="M -10 -2 L -10 -8 C -10 -14 -5 -18 0 -18 C 5 -18 10 -14 10 -8 L 10 -2"
      fill="none"
      stroke="url(#lockGradient)"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    
    <!-- Lock body -->
    <rect
      x="-12"
      y="-2"
      width="24"
      height="16"
      rx="3"
      fill="url(#lockGradient)"
    />
    
    <!-- Lock keyhole -->
    <circle cx="0" cy="4" r="3" fill="rgb(30 32 44)"/>
    <rect x="-1.5" y="5" width="3" height="5" rx="1" fill="rgb(30 32 44)"/>
  </g>
</svg>`

  return svg
}

export function createFileIconDataUrl(): string {
  const svg = generateFileIcon()
  const base64 = btoa(svg)
  return `data:image/svg+xml;base64,${base64}`
}

export function downloadFileIcon(fileName: string = 'releye-icon.svg') {
  const svg = generateFileIcon()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  
  URL.revokeObjectURL(url)
}
