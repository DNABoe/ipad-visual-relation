import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function GridAnalysisHelper() {
  const [analysis, setAnalysis] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSparkAvailable, setIsSparkAvailable] = useState(false)

  useEffect(() => {
    setIsSparkAvailable(
      typeof window !== 'undefined' && 
      !!(window as any).spark && 
      typeof (window as any).spark.llm === 'function'
    )
  }, [])

  const runAnalysis = async () => {
    if (!isSparkAvailable) {
      setAnalysis('This analysis tool is only available in the Spark development environment.')
      return
    }

    setIsAnalyzing(true)
    
    const codeContext = ((window as any).spark.llmPrompt as any)`
# Grid Toggle and Canvas Settings Analysis

## Issue Description
There are potential problems with the grid toggle button and canvas settings not working properly.

## Code Components

### 1. WorkspaceToolbar.tsx (Grid Toggle)
\`\`\`typescript
const [settings, setSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
const showGrid = settings?.showGrid ?? true

const toggleGrid = async () => {
  const newValue = !showGrid
  await setSettings((current) => ({ ...DEFAULT_APP_SETTINGS, ...current, showGrid: newValue }))
  await new Promise(resolve => setTimeout(resolve, 100))
  window.dispatchEvent(new CustomEvent('settings-changed'))
  onRefreshCanvas()
  toast.success(newValue ? 'Grid enabled' : 'Grid disabled')
}
\`\`\`

### 2. SettingsDialog.tsx (Settings Panel)
\`\`\`typescript
const [appSettings, setAppSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)

<Switch
  id="show-grid-toggle"
  checked={appSettings?.showGrid ?? true}
  onCheckedChange={async (checked) => {
    await setAppSettings((current) => ({ ...DEFAULT_APP_SETTINGS, ...current, showGrid: checked }))
    window.dispatchEvent(new CustomEvent('settings-changed'))
    onRefreshCanvas?.()
    toast.success(checked ? 'Grid enabled' : 'Grid disabled')
  }}
/>
\`\`\`

### 3. WorkspaceCanvas.tsx (Grid Rendering)
\`\`\`typescript
const [settings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
const [previousShowGrid, setPreviousShowGrid] = useState<boolean | undefined>(undefined)
const [forceUpdateKey, setForceUpdateKey] = useState(0)

const showGrid = settings?.showGrid ?? DEFAULT_APP_SETTINGS.showGrid
const gridSize = settings?.gridSize ?? DEFAULT_APP_SETTINGS.gridSize
const gridOpacity = settings?.gridOpacity ?? DEFAULT_APP_SETTINGS.gridOpacity

useEffect(() => {
  const handleSettingsChange = () => {
    setForceUpdateKey(prev => prev + 1)
  }
  
  window.addEventListener('settings-changed', handleSettingsChange)
  return () => window.removeEventListener('settings-changed', handleSettingsChange)
}, [])

useEffect(() => {
  setForceUpdateKey(prev => prev + 1)
}, [settings?.showGrid, settings?.gridSize, settings?.gridOpacity, settings?.snapToGrid, settings?.organicLines])

useEffect(() => {
  const canvas = controller.canvasRef.current
  if (!canvas) return

  const { x, y, scale } = controller.transform.transform
  const scaledGridSize = gridSize * scale
  
  canvas.style.setProperty('--grid-size', \`\${scaledGridSize}px\`)
  canvas.style.setProperty('--grid-opacity', \`\${gridOpacity / 100}\`)
  canvas.style.setProperty('--grid-x', \`\${x}px\`)
  canvas.style.setProperty('--grid-y', \`\${y}px\`)
  
  if (showGrid) {
    if (previousShowGrid === false) {
      canvas.classList.remove('canvas-grid-fade-out')
      canvas.classList.add('canvas-grid')
      void canvas.offsetHeight
      canvas.classList.add('canvas-grid-fade-in')
      
      const timeout = setTimeout(() => {
        canvas.classList.remove('canvas-grid-fade-in')
      }, 350)
      
      setPreviousShowGrid(true)
      return () => clearTimeout(timeout)
    } else if (previousShowGrid === undefined) {
      canvas.classList.add('canvas-grid')
      setPreviousShowGrid(true)
    } else {
      canvas.classList.add('canvas-grid')
      canvas.classList.remove('canvas-grid-fade-in', 'canvas-grid-fade-out')
    }
  } else {
    if (previousShowGrid === true) {
      canvas.classList.add('canvas-grid-fade-out')
      
      const timeout = setTimeout(() => {
        canvas.classList.remove('canvas-grid', 'canvas-grid-fade-out')
      }, 350)
      
      setPreviousShowGrid(false)
      return () => clearTimeout(timeout)
    } else if (previousShowGrid === undefined) {
      canvas.classList.remove('canvas-grid', 'canvas-grid-fade-in', 'canvas-grid-fade-out')
      setPreviousShowGrid(false)
    } else {
      canvas.classList.remove('canvas-grid', 'canvas-grid-fade-in', 'canvas-grid-fade-out')
    }
  }
}, [gridSize, showGrid, gridOpacity, controller.transform.transform.x, controller.transform.transform.y, controller.transform.transform.scale, controller.canvasRef, previousShowGrid, forceUpdateKey])
\`\`\`

### 4. CSS (index.css)
\`\`\`css
.canvas-grid {
  background-color: var(--canvas-bg);
  position: relative;
}

.canvas-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, oklch(0.88 0.18 185 / var(--grid-opacity, 0.15)) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.88 0.18 185 / var(--grid-opacity, 0.15)) 1px, transparent 1px);
  background-size: var(--grid-size, 20px) var(--grid-size, 20px);
  background-position: var(--grid-x, 0) var(--grid-y, 0);
  pointer-events: none;
  opacity: 1;
  z-index: 0;
}
\`\`\`

### 5. Data Flow
- useKV hook with key 'app-settings' stores settings
- DEFAULT_APP_SETTINGS provides fallback values
- WorkspaceToolbar and SettingsDialog both modify settings
- WorkspaceCanvas reads settings and renders grid
- Custom 'settings-changed' event triggers canvas updates

## Questions to Analyze

1. **Race Conditions**: Are there race conditions between the multiple useKV hooks reading/writing 'app-settings'?
2. **Stale Closures**: Could the toggle function be capturing stale values of 'settings'?
3. **Update Timing**: Is the 100ms delay in toggleGrid sufficient or could it cause issues?
4. **Event Propagation**: Is the custom 'settings-changed' event being properly received?
5. **Default Values**: Could the spreading of DEFAULT_APP_SETTINGS be overwriting user changes?
6. **State Synchronization**: Are the three components (Toolbar, Settings, Canvas) staying in sync?
7. **CSS Application**: Could the CSS classes not be applied properly due to timing issues?
8. **forceUpdateKey**: Is the forceUpdateKey mechanism working correctly to force re-renders?
9. **Multiple Updates**: What happens when both the dialog and toolbar try to update settings simultaneously?
10. **Functional Updates**: Should setSettings use functional updates consistently?

Please provide a comprehensive analysis identifying:
- All potential bugs and race conditions
- Root causes of why grid toggle might not work
- Specific code patterns that could fail
- Recommendations for fixes
- Priority order of issues to address
`

    try {
      const result = await (window as any).spark.llm(codeContext, 'gpt-4o')
      setAnalysis(result)
    } catch (error) {
      setAnalysis('Error running analysis: ' + String(error))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Grid Toggle & Canvas Settings Analysis</h1>
        <p className="text-muted-foreground mb-4">
          This tool uses AI to analyze potential issues with grid toggle and canvas settings functionality.
          {!isSparkAvailable && (
            <span className="block mt-2 text-warning font-semibold">
              ⚠️ This feature is only available in the Spark development environment.
            </span>
          )}
        </p>
        
        <Button onClick={runAnalysis} disabled={isAnalyzing || !isSparkAvailable} className="mb-6">
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>

        {analysis && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Analysis Results:</h2>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-[600px] overflow-y-auto">
              {analysis}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
