import { Warning, ArrowClockwise } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface SparkNotAvailableErrorProps {
  diagnosticInfo?: {
    hostname: string
    sparkExists: boolean
    kvExists: boolean
  }
}

export function SparkNotAvailableError({ diagnosticInfo }: SparkNotAvailableErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <Warning className="w-8 h-8 text-destructive" weight="fill" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Browser Storage Not Available</CardTitle>
              <CardDescription className="text-base">
                This application requires browser storage to function properly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Why isn't the app working?
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                RelEye uses browser localStorage for session management. Your browser may have storage disabled 
                or you may be in private/incognito mode.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                How can I fix this?
              </h3>
              <ul className="text-sm text-muted-foreground ml-8 space-y-2">
                <li>• Ensure cookies and site data are enabled in your browser</li>
                <li>• Exit private/incognito mode</li>
                <li>• Check that browser storage isn't disabled by extensions</li>
                <li>• Try a different browser if the issue persists</li>
              </ul>
            </div>
          </div>

          {diagnosticInfo && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Diagnostic Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-muted-foreground">Hostname:</div>
                <div>{diagnosticInfo.hostname}</div>
                
                <div className="text-muted-foreground">Backend API:</div>
                <div>https://releye.boestad.com/api</div>
                
                <div className="text-muted-foreground">localStorage:</div>
                <div className={typeof window !== 'undefined' && window.localStorage ? 'text-success' : 'text-destructive'}>
                  {typeof window !== 'undefined' && window.localStorage ? '✓ Available' : '✗ Not available'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="default"
              className="w-full"
            >
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
