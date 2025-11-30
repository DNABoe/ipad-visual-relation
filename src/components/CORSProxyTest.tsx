import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, XCircle, CircleNotch, Info } from '@phosphor-icons/react'

const CORS_PROXIES = [
  {
    name: 'AllOrigins',
    url: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  },
  {
    name: 'CORSProxy.io',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  },
  {
    name: 'CORS Anywhere',
    url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
  }
]

interface TestResult {
  proxy: string
  status: 'pending' | 'success' | 'error'
  message: string
  responseTime?: number
}

export function CORSProxyTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const testProxies = async () => {
    setTesting(true)
    setResults([])
    
    const testUrl = 'https://httpbin.org/get'
    const newResults: TestResult[] = []

    for (const proxy of CORS_PROXIES) {
      const result: TestResult = {
        proxy: proxy.name,
        status: 'pending',
        message: 'Testing...'
      }
      
      newResults.push(result)
      setResults([...newResults])

      const startTime = Date.now()
      
      try {
        const proxyUrl = proxy.url(testUrl)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        if (response.ok) {
          result.status = 'success'
          result.message = `✓ Working (${responseTime}ms)`
          result.responseTime = responseTime
        } else {
          result.status = 'error'
          result.message = `✗ HTTP ${response.status}`
        }
      } catch (error) {
        const responseTime = Date.now() - startTime
        result.status = 'error'
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            result.message = `✗ Timeout (>${responseTime}ms)`
          } else {
            result.message = `✗ ${error.message}`
          }
        } else {
          result.message = '✗ Unknown error'
        }
      }
      
      setResults([...newResults])
    }

    setTesting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info size={24} className="text-primary" />
          CORS Proxy Connectivity Test
        </CardTitle>
        <CardDescription>
          Test which CORS proxy services are currently available for LLM API calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About CORS Proxies</AlertTitle>
          <AlertDescription>
            RelEye uses multiple CORS proxy services to enable LLM API calls from your browser.
            If one proxy fails, it automatically tries the next one. This test helps identify which proxies are currently working.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={testProxies} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
              Testing Proxies...
            </>
          ) : (
            'Test CORS Proxies'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Test Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {result.status === 'pending' && (
                    <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {result.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-success" weight="fill" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="h-5 w-5 text-destructive" weight="fill" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{result.proxy}</p>
                    <p className="text-xs text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                {result.responseTime && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {result.responseTime}ms
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && !testing && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {results.some(r => r.status === 'success') ? (
                <>
                  ✓ At least one proxy is working. LLM features should function normally.
                  {results.filter(r => r.status === 'success').length === 1 && 
                    ' Note: Only one proxy is working, so there may be delays if it becomes unavailable.'}
                </>
              ) : (
                <>
                  ✗ All public proxies are currently unavailable. Consider deploying your own proxy server.
                  See CORS_PROXY_OPTIONS.md for deployment instructions.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
