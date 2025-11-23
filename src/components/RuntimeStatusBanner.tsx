import { useEffect, useState } from 'react'
import { Info, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function RuntimeStatusBanner() {
  const [isSparkAvailable, setIsSparkAvailable] = useState<boolean | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const checkSparkAvailability = () => {
      const available = !!(
        typeof window !== 'undefined' &&
        (window as any).spark &&
        typeof (window as any).spark.kv === 'object'
      )
      setIsSparkAvailable(available)
    }

    checkSparkAvailability()
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (isSparkAvailable === null || isSparkAvailable || isDismissed) {
    return null
  }

  return (
    <div className="bg-muted/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Info size={18} className="text-primary flex-shrink-0" weight="fill" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Standalone Mode:</span> Using browser storage. 
            For AI-powered features and enhanced persistence, deploy in Spark environment.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  )
}
