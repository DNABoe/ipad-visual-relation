import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Flask, CheckCircle, XCircle } from '@phosphor-icons/react'
import { runStorageTests } from '@/lib/storageTest'

interface StorageDiagnosticProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StorageDiagnostic({ open, onOpenChange }: StorageDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{
    success: boolean
    message: string
    details: string[]
  } | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setResults(null)
    
    const testResults = await runStorageTests()
    setResults(testResults)
    setIsRunning(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Flask className="w-6 h-6 text-primary" weight="duotone" />
            </div>
            <div>
              <DialogTitle className="text-xl">Storage Diagnostic</DialogTitle>
              <DialogDescription>
                Test cloud storage connectivity and functionality
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About Storage</CardTitle>
              <CardDescription className="text-sm">
                RelEye uses Spark KV cloud storage for user credentials and invitations. This ensures your account works across all browsers and devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span className="text-muted-foreground">Cloud-synced across all browsers</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span className="text-muted-foreground">Invite links work from any device</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span className="text-muted-foreground">Multi-device authentication support</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={runTests}
            disabled={isRunning}
            className="w-full h-12 font-semibold"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running Tests...
              </>
            ) : (
              <>
                <Flask className="w-5 h-5 mr-2" weight="duotone" />
                Run Storage Tests
              </>
            )}
          </Button>

          {results && (
            <Card className={results.success ? 'border-success' : 'border-destructive'}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {results.success ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-success" weight="fill" />
                      <CardTitle className="text-base text-success">Tests Passed</CardTitle>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-destructive" weight="fill" />
                      <CardTitle className="text-base text-destructive">Tests Failed</CardTitle>
                    </>
                  )}
                </div>
                <CardDescription>{results.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {results.details.join('\n')}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
