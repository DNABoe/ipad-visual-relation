import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Warning, Play, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  timestamp?: number
  duration?: number
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
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: 'Basic Connectivity',
        status: 'error',
        message: 'Failed to connect to API server',
        details: error instanceof Error ? error.message : String(error),
        duration
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
      status: 'success',
      message: `Testing API at: ${getAPIBaseURL()}`,
      details: `Origin: ${window.location.origin}\nProtocol: ${window.location.protocol}\nHost: ${window.location.host}`
    })

    const tests = [
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
      default:
        return <Warning className="text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'secondary'
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
                {results.filter(r => r.status === 'warning').length} warnings
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
      </div>
    </div>
  )
}
