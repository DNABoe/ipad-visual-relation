import { Warning, ArrowClockwise, ArrowSquareOut } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'

interface SparkNotAvailableErrorProps {
  diagnosticInfo?: {
    hostname: string
    sparkExists: boolean
    kvExists: boolean
  }
}

export function SparkNotAvailableError({ diagnosticInfo }: SparkNotAvailableErrorProps) {
  const isCustomDomain = diagnosticInfo?.hostname && 
    !diagnosticInfo.hostname.includes('github') && 
    !diagnosticInfo.hostname.includes('localhost')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <Warning className="w-8 h-8 text-destructive" weight="fill" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">GitHub Spark Runtime Required</CardTitle>
              <CardDescription className="text-base">
                This application requires the GitHub Spark runtime environment to function.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isCustomDomain && (
            <Alert className="border-warning bg-warning/10">
              <AlertDescription className="text-sm">
                <strong>Custom Domain Detected:</strong> You're accessing this app from {diagnosticInfo?.hostname}.
                Custom domains do not have access to the GitHub Spark runtime.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Why isn't the app working?
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                RelEye uses GitHub Spark's secure cloud storage (KV) to save your authentication credentials 
                and workspace data. This storage system is only available when the app runs through GitHub Spark's 
                runtime environment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                How can I fix this?
              </h3>
              <p className="text-sm text-muted-foreground ml-8 mb-3">
                You need to access this application through its GitHub Spark URL instead of the custom domain.
              </p>
              <div className="ml-8 p-4 bg-muted rounded-lg">
                <p className="text-xs font-mono text-muted-foreground mb-2">GitHub Spark URL format:</p>
                <code className="text-xs font-mono">https://[your-username].github.io/[spark-app-name]/</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                Alternative: Deploy without Spark
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                To use this app on a custom domain, the codebase needs to be modified to use a different 
                storage backend (such as a MySQL database with API server) instead of GitHub Spark KV.
                This requires significant code changes.
              </p>
            </div>
          </div>

          {diagnosticInfo && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Diagnostic Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-muted-foreground">Hostname:</div>
                <div>{diagnosticInfo.hostname}</div>
                
                <div className="text-muted-foreground">Spark Runtime:</div>
                <div className={diagnosticInfo.sparkExists ? 'text-success' : 'text-destructive'}>
                  {diagnosticInfo.sparkExists ? '✓ Available' : '✗ Not found'}
                </div>
                
                <div className="text-muted-foreground">KV Storage:</div>
                <div className={diagnosticInfo.kvExists ? 'text-success' : 'text-destructive'}>
                  {diagnosticInfo.kvExists ? '✓ Available' : '✗ Not found'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex-1"
            >
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.open('https://github.com/features/spark', '_blank')}
              className="flex-1"
            >
              <ArrowSquareOut className="w-4 h-4 mr-2" />
              Learn About GitHub Spark
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
