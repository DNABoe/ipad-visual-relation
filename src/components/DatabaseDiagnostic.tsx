import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, XCircle, Warning, Play, Database, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ApiClient } from '@/lib/apiClient'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  timestamp?: number
  duration?: number
  recommendation?: string
}

export function DatabaseDiagnostic() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, { ...result, timestamp: Date.now() }])
  }

  const updateLastResult = (updates: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev]
      const lastIndex = newResults.length - 1
      if (lastIndex >= 0) {
        newResults[lastIndex] = { ...newResults[lastIndex], ...updates }
      }
      return newResults
    })
  }

  const testDatabaseConnection = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const healthData = await ApiClient.healthCheck()
      const duration = Date.now() - startTime
      
      return {
        name: 'Database Connection',
        status: 'success',
        message: `Database ${healthData.database} connected (${duration}ms)`,
        details: JSON.stringify(healthData, null, 2),
        duration
      }
    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to database',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        recommendation: 'Check database configuration in backend API server'
      }
    }
  }

  const testFirstTimeSetup = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const isFirstTime = await ApiClient.isFirstTimeSetup()
      const duration = Date.now() - startTime
      
      return {
        name: 'First-Time Setup Check',
        status: 'info',
        message: `isFirstTime: ${isFirstTime}`,
        details: `The database ${isFirstTime ? 'has NO admin user' : 'has an admin user'}.\n\nThis means the app ${isFirstTime ? 'WILL show first-time setup' : 'WILL show login screen'}.`,
        duration,
        recommendation: isFirstTime ? undefined : 'To reset to first-time setup, use the Reset All Data function'
      }
    } catch (error) {
      return {
        name: 'First-Time Setup Check',
        status: 'error',
        message: 'Failed to check first-time setup status',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        recommendation: 'Ensure backend API is running and accessible'
      }
    }
  }

  const testUserRetrieval = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const users = await ApiClient.getAllUsers()
      const duration = Date.now() - startTime
      
      return {
        name: 'User Retrieval',
        status: users.length > 0 ? 'success' : 'warning',
        message: `Found ${users.length} user(s) in database`,
        details: JSON.stringify(users.map(u => ({
          email: u.email,
          name: u.name,
          role: u.role,
          canInvestigate: u.canInvestigate,
          loginCount: u.loginCount,
          createdAt: new Date(u.createdAt).toISOString()
        })), null, 2),
        duration,
        recommendation: users.length === 0 ? 'No users found - first-time setup should be triggered' : undefined
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMsg.includes('401') || errorMsg.includes('No authentication token')) {
        return {
          name: 'User Retrieval',
          status: 'info',
          message: 'Authentication required (expected behavior)',
          details: 'User retrieval requires authentication. This is normal if not logged in.',
          duration: Date.now() - startTime
        }
      }
      
      return {
        name: 'User Retrieval',
        status: 'error',
        message: 'Failed to retrieve users',
        details: errorMsg,
        duration: Date.now() - startTime,
        recommendation: 'Check database connectivity and backend API logs'
      }
    }
  }

  const testInviteRetrieval = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const invites = await ApiClient.getAllInvites()
      const duration = Date.now() - startTime
      
      return {
        name: 'Invite Retrieval',
        status: 'info',
        message: `Found ${invites.length} pending invite(s)`,
        details: invites.length > 0 ? JSON.stringify(invites.map(i => ({
          email: i.email,
          name: i.name,
          role: i.role,
          createdAt: new Date(i.createdAt).toISOString(),
          expiresAt: new Date(i.expiresAt).toISOString()
        })), null, 2) : 'No pending invites',
        duration
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMsg.includes('401') || errorMsg.includes('No authentication token')) {
        return {
          name: 'Invite Retrieval',
          status: 'info',
          message: 'Authentication required (expected behavior)',
          details: 'Invite retrieval requires authentication. This is normal if not logged in.',
          duration: Date.now() - startTime
        }
      }
      
      return {
        name: 'Invite Retrieval',
        status: 'error',
        message: 'Failed to retrieve invites',
        details: errorMsg,
        duration: Date.now() - startTime
      }
    }
  }

  const testTokenPersistence = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const token = ApiClient.getToken()
      const localStorageToken = localStorage.getItem('releye-auth-token')
      
      return {
        name: 'Token Persistence',
        status: token ? 'success' : 'info',
        message: token ? 'Auth token found in storage' : 'No auth token (not logged in)',
        details: JSON.stringify({
          hasToken: !!token,
          tokenLength: token?.length || 0,
          localStorage: !!localStorageToken,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
        }, null, 2),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        name: 'Token Persistence',
        status: 'error',
        message: 'Failed to check token persistence',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        recommendation: 'Check localStorage availability and browser settings'
      }
    }
  }

  const testDataPersistence = async (): Promise<TestResult> => {
    const startTime = Date.now()
    const testKey = '_db_diagnostic_test'
    const testValue = { timestamp: Date.now(), test: 'persistence' }
    
    try {
      localStorage.setItem(testKey, JSON.stringify(testValue))
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      const success = retrieved && JSON.parse(retrieved).timestamp === testValue.timestamp
      
      return {
        name: 'Data Persistence (localStorage)',
        status: success ? 'success' : 'error',
        message: success ? 'localStorage working correctly' : 'localStorage failed',
        details: success ? 'Successfully wrote, read, and deleted test data' : 'Data integrity check failed',
        duration: Date.now() - startTime,
        recommendation: success ? undefined : 'Check browser settings - cookies and site data must be enabled'
      }
    } catch (error) {
      return {
        name: 'Data Persistence (localStorage)',
        status: 'error',
        message: 'localStorage not available',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        recommendation: 'Ensure browser is not in private/incognito mode and localStorage is enabled'
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    console.log('[DatabaseDiagnostic] ========== STARTING DIAGNOSTICS ==========')

    try {
      addResult({ name: 'Database Connection', status: 'pending', message: 'Testing...' })
      const dbResult = await testDatabaseConnection()
      updateLastResult(dbResult)
      console.log('[DatabaseDiagnostic] Database Connection:', dbResult.status)

      addResult({ name: 'First-Time Setup Check', status: 'pending', message: 'Testing...' })
      const firstTimeResult = await testFirstTimeSetup()
      updateLastResult(firstTimeResult)
      console.log('[DatabaseDiagnostic] First-Time Setup:', firstTimeResult.status, firstTimeResult.message)

      addResult({ name: 'Token Persistence', status: 'pending', message: 'Testing...' })
      const tokenResult = await testTokenPersistence()
      updateLastResult(tokenResult)
      console.log('[DatabaseDiagnostic] Token Persistence:', tokenResult.status)

      addResult({ name: 'Data Persistence (localStorage)', status: 'pending', message: 'Testing...' })
      const persistenceResult = await testDataPersistence()
      updateLastResult(persistenceResult)
      console.log('[DatabaseDiagnostic] Data Persistence:', persistenceResult.status)

      addResult({ name: 'User Retrieval', status: 'pending', message: 'Testing...' })
      const userResult = await testUserRetrieval()
      updateLastResult(userResult)
      console.log('[DatabaseDiagnostic] User Retrieval:', userResult.status)

      addResult({ name: 'Invite Retrieval', status: 'pending', message: 'Testing...' })
      const inviteResult = await testInviteRetrieval()
      updateLastResult(inviteResult)
      console.log('[DatabaseDiagnostic] Invite Retrieval:', inviteResult.status)

      console.log('[DatabaseDiagnostic] ========== DIAGNOSTICS COMPLETE ==========')
      toast.success('Diagnostics complete')
    } catch (error) {
      console.error('[DatabaseDiagnostic] Error running diagnostics:', error)
      toast.error('Diagnostics failed')
    } finally {
      setIsRunning(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm('⚠️ This will delete ALL data including users and invites. Are you absolutely sure?')) {
      return
    }

    if (!confirm('This action cannot be undone. Type YES in your mind and click OK to proceed.')) {
      return
    }

    try {
      await ApiClient.resetAll()
      toast.success('Database reset successfully. Refreshing page...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('[DatabaseDiagnostic] Reset failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset database')
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-success" weight="fill" />
      case 'error':
        return <XCircle className="text-destructive" weight="fill" />
      case 'warning':
        return <Warning className="text-warning" weight="fill" />
      case 'pending':
        return <ArrowsClockwise className="text-muted-foreground animate-spin" />
      default:
        return <Database className="text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline',
      info: 'outline'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database size={24} />
              Database Diagnostics
            </CardTitle>
            <CardDescription>
              Test database connectivity, data persistence, and authentication
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <ArrowsClockwise className="mr-2 animate-spin" />
              ) : (
                <Play className="mr-2" />
              )}
              Run Tests
            </Button>
            <Button
              onClick={resetDatabase}
              disabled={isRunning}
              variant="destructive"
              size="sm"
            >
              Reset All Data
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Backend API</AlertTitle>
          <AlertDescription className="font-mono text-xs">
            https://releye.boestad.com/api
          </AlertDescription>
        </Alert>

        {results.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={index} className={result.status === 'error' ? 'border-destructive' : undefined}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <CardTitle className="text-base">{result.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.status)}
                        {result.duration && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {result.duration}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-1">{result.message}</CardDescription>
                  </CardHeader>
                  {(result.details || result.recommendation) && (
                    <CardContent className="space-y-2">
                      {result.recommendation && (
                        <Alert>
                          <Warning className="h-4 w-4" />
                          <AlertDescription>{result.recommendation}</AlertDescription>
                        </Alert>
                      )}
                      {result.details && (
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          {result.details}
                        </pre>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Tests" to start diagnostics
          </div>
        )}
      </CardContent>
    </Card>
  )
}
