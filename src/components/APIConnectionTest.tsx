import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, XCircle, Warning, Play, Copy, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  timestamp?: number
  duration?: number
  recommendation?: string
}

export function APIConnectionTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const getAPIBaseURL = () => {
    return window.location.origin.includes('localhost') 
      ? 'http://localhost:3000/api'
      : `${window.location.origin}/api`
  }

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, { ...result, timestamp: Date.now() }])
  }

  const testDNSConfiguration = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const currentHost = window.location.host
    const currentOrigin = window.location.origin
    const apiUrl = getAPIBaseURL()
    
    const details = {
      currentHost,
      currentOrigin,
      apiBaseURL: apiUrl,
      expectedBehavior: 'API should be available at /api endpoint',
      dnsNote: 'If DNS points to GitHub Pages, backend API will not be accessible',
      recommendation: 'Backend API needs separate hosting (e.g., Railway, Render, Vercel, etc.)'
    }

    if (currentHost.includes('localhost')) {
      return {
        name: 'DNS Configuration',
        status: 'info',
        message: 'Running on localhost - API expected at localhost:3000',
        details: JSON.stringify(details, null, 2),
        duration: Date.now() - startTime,
        recommendation: 'Ensure backend API server is running on port 3000'
      }
    }

    if (currentHost.includes('github.io') || currentHost.includes('releye.boestad.com')) {
      return {
        name: 'DNS Configuration',
        status: 'warning',
        message: 'DNS points to static hosting (GitHub Pages)',
        details: JSON.stringify({
          ...details,
          issue: 'GitHub Pages only serves static files, cannot host backend API',
          solution: 'Backend API must be hosted separately and DNS updated'
        }, null, 2),
        duration: Date.now() - startTime,
        recommendation: 'Deploy backend to a service like Railway, Render, or Vercel and update CNAME'
      }
    }

    return {
      name: 'DNS Configuration',
      status: 'info',
      message: `Running on ${currentHost}`,
      details: JSON.stringify(details, null, 2),
      duration: Date.now() - startTime
    }
  }

  const testBasicConnectivity = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl + '/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const duration = Date.now() - startTime
      const contentType = response.headers.get('content-type')
      
      if (!contentType?.includes('application/json')) {
        return {
          name: 'Basic Connectivity',
          status: 'error',
          message: `Server returned ${contentType} instead of JSON`,
          details: `This suggests the API endpoint is not available. Expected JSON response but got ${contentType}.\n\nResponse status: ${response.status}`,
          duration,
          recommendation: 'Verify backend API is deployed and accessible at this URL'
        }
      }

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          name: 'Basic Connectivity',
          status: 'success',
          message: `Connected successfully (${duration}ms)`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      } else {
        return {
          name: 'Basic Connectivity',
          status: 'error',
          message: `Server responded with ${response.status}: ${response.statusText}`,
          details: JSON.stringify(data, null, 2),
          duration,
          recommendation: 'Check backend API logs for errors'
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      let recommendation = 'Verify backend API is running and accessible'
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        recommendation = 'API server is not responding. Check if backend is deployed and DNS is configured correctly.'
      } else if (errorMsg.includes('CORS')) {
        recommendation = 'CORS policy is blocking the request. Check backend CORS configuration.'
      }
      
      return {
        name: 'Basic Connectivity',
        status: 'error',
        message: 'Failed to connect to API server',
        details: `Error: ${errorMsg}\n\nAttempted URL: ${apiUrl}/health\n\nThis usually means:\n1. Backend API is not running\n2. DNS is pointing to wrong server\n3. API endpoint path is incorrect`,
        duration,
        recommendation
      }
    }
  }

  const testEndpointAvailability = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const duration = Date.now() - startTime
      const contentType = response.headers.get('content-type') || 'none'

      if (response.status === 404 && contentType.includes('text/html')) {
        return {
          name: 'API Endpoint Check',
          status: 'error',
          message: 'API endpoint returns HTML 404 page',
          details: `The /api path returns an HTML page, not a JSON API response.\n\nThis confirms the backend API is not deployed at this location.\n\nContent-Type: ${contentType}\nStatus: ${response.status}`,
          duration,
          recommendation: 'Deploy backend API server or update DNS to point to the correct backend location'
        }
      }

      return {
        name: 'API Endpoint Check',
        status: 'info',
        message: `Endpoint returned ${response.status} (${contentType})`,
        details: `Status: ${response.status}\nContent-Type: ${contentType}`,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'API Endpoint Check',
        status: 'error',
        message: 'Cannot reach API endpoint',
        details: error instanceof Error ? error.message : String(error),
        duration,
        recommendation: 'Backend API is not accessible at this URL'
      }
    }
  }

  const testCORS = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl + '/health', {
        method: 'OPTIONS',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
      })

      const duration = Date.now() - startTime
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      }

      if (response.ok || response.status === 204) {
        return {
          name: 'CORS Configuration',
          status: 'success',
          message: 'CORS headers are properly configured',
          details: JSON.stringify(corsHeaders, null, 2),
          duration
        }
      } else {
        return {
          name: 'CORS Configuration',
          status: 'warning',
          message: `OPTIONS request returned ${response.status}`,
          details: JSON.stringify(corsHeaders, null, 2),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'CORS Configuration',
        status: 'error',
        message: 'CORS preflight failed',
        details: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  const testFirstTimeSetup = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl + '/auth/first-time', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.success) {
        return {
          name: 'First-Time Setup Check',
          status: 'success',
          message: `API endpoint working - isFirstTime: ${data.data.isFirstTime}`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      } else {
        return {
          name: 'First-Time Setup Check',
          status: 'error',
          message: `Endpoint failed: ${response.status}`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'First-Time Setup Check',
        status: 'error',
        message: 'Failed to check first-time setup',
        details: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  const testUsers = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl + '/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.success) {
        const userCount = Array.isArray(data.data) ? data.data.length : 0
        return {
          name: 'User Registry',
          status: 'success',
          message: `Found ${userCount} registered user(s)`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      } else {
        return {
          name: 'User Registry',
          status: 'error',
          message: `Failed to retrieve users: ${response.status}`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'User Registry',
        status: 'error',
        message: 'Failed to access user registry',
        details: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  const testInvites = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const apiUrl = getAPIBaseURL()
    
    try {
      const response = await fetch(apiUrl + '/invites', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.success) {
        const inviteCount = Array.isArray(data.data) ? data.data.length : 0
        return {
          name: 'Invite System',
          status: 'success',
          message: `Found ${inviteCount} pending invite(s)`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      } else {
        return {
          name: 'Invite System',
          status: 'error',
          message: `Failed to retrieve invites: ${response.status}`,
          details: JSON.stringify(data, null, 2),
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'Invite System',
        status: 'error',
        message: 'Failed to access invite system',
        details: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    addResult({
      name: 'Environment Info',
      status: 'info',
      message: `Testing API at: ${getAPIBaseURL()}`,
      details: `Origin: ${window.location.origin}\nProtocol: ${window.location.protocol}\nHost: ${window.location.host}\nPathname: ${window.location.pathname}`
    })

    const tests = [
      testDNSConfiguration,
      testEndpointAvailability,
      testBasicConnectivity,
      testCORS,
      testFirstTimeSetup,
      testUsers,
      testInvites,
    ]

    for (const test of tests) {
      const result = await test()
      addResult(result)
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    setIsRunning(false)
    
    const hasErrors = results.some(r => r.status === 'error')
    if (hasErrors) {
      toast.error('Some tests failed. Check the details below.')
    } else {
      toast.success('All tests passed successfully!')
    }
  }

  const copyResults = () => {
    const text = results.map(r => {
      let output = `[${r.status.toUpperCase()}] ${r.name}\n${r.message}`
      if (r.duration) output += ` (${r.duration}ms)`
      if (r.details) output += `\n${r.details}`
      return output
    }).join('\n\n')
    
    navigator.clipboard.writeText(text)
    toast.success('Results copied to clipboard')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle weight="fill" className="text-success" />
      case 'error':
        return <XCircle weight="fill" className="text-destructive" />
      case 'warning':
        return <Warning weight="fill" className="text-warning" />
      case 'info':
        return <Info weight="fill" className="text-primary" />
      default:
        return <Warning className="text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'secondary',
      info: 'outline'
    }
    return variants[status] || 'secondary'
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Connection Diagnostics</h1>
            <p className="text-muted-foreground mt-2">
              Test the connection to the RelEye backend API
            </p>
          </div>
          <div className="flex gap-2">
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyResults}
              >
                <Copy className="mr-2" />
                Copy Results
              </Button>
            )}
            <Button
              onClick={runAllTests}
              disabled={isRunning}
            >
              <Play className="mr-2" weight="fill" />
              {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>DNS Configuration Issue</AlertTitle>
          <AlertDescription>
            Your domain <strong>releye.boestad.com</strong> is currently configured with a CNAME record pointing to <strong>dnaboe.github.io</strong> (GitHub Pages).
            <br /><br />
            <strong>Problem:</strong> GitHub Pages only serves static files and cannot host your backend API.
            <br /><br />
            <strong>Solution:</strong> You need to either:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Deploy your backend API to a service (Railway, Render, Vercel, Heroku, etc.)</li>
              <li>Update your DNS to point to that backend service</li>
              <li>Or use a subdomain like <code>api.boestad.com</code> for the backend</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>API endpoint configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Base URL:</span>
                <span className="font-semibold">{getAPIBaseURL()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origin:</span>
                <span>{window.location.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span>{window.location.origin.includes('localhost') ? 'Development' : 'Production'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DNS Target:</span>
                <span className="text-warning">dnaboe.github.io (GitHub Pages)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {results.filter(r => r.status === 'success').length} passed, {' '}
                {results.filter(r => r.status === 'error').length} failed, {' '}
                {results.filter(r => r.status === 'warning').length} warnings, {' '}
                {results.filter(r => r.status === 'info').length} info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-semibold">{result.name}</div>
                          <div className="text-sm text-muted-foreground">{result.message}</div>
                          {result.duration !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Response time: {result.duration}ms
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    {result.recommendation && (
                      <div className="ml-9">
                        <Alert className="bg-muted/50">
                          <AlertDescription className="text-sm">
                            <strong>Recommendation:</strong> {result.recommendation}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    {result.details && (
                      <div className="ml-9 mt-2">
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
                          {result.details}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !isRunning && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Click "Run Diagnostics" to test the API connection
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>How to fix your backend API connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">Option 1: Deploy Backend to Separate Service</h4>
                <ol className="list-decimal ml-6 space-y-1 text-sm text-muted-foreground">
                  <li>Deploy your backend API to Railway, Render, Vercel, or similar</li>
                  <li>Get the deployment URL (e.g., <code>your-api.railway.app</code>)</li>
                  <li>Update your frontend code to point to that URL</li>
                  <li>Keep <code>releye.boestad.com</code> pointing to GitHub Pages for frontend</li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Option 2: Use Subdomain for API</h4>
                <ol className="list-decimal ml-6 space-y-1 text-sm text-muted-foreground">
                  <li>Create a new subdomain: <code>api.boestad.com</code></li>
                  <li>Point that subdomain to your backend server</li>
                  <li>Update CORS settings to allow requests from <code>releye.boestad.com</code></li>
                  <li>Update frontend to use <code>https://api.boestad.com</code></li>
                </ol>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Option 3: Full Stack Hosting</h4>
                <ol className="list-decimal ml-6 space-y-1 text-sm text-muted-foreground">
                  <li>Deploy both frontend and backend to same service (e.g., Vercel, Render)</li>
                  <li>Update DNS CNAME to point to that service instead of GitHub Pages</li>
                  <li>Service will handle routing /api to backend and / to frontend</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
