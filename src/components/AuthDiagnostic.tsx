import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Warning, CheckCircle, XCircle, ArrowsClockwise } from '@phosphor-icons/react'
import * as UserRegistry from '../lib/userRegistry'

interface DiagnosticResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export function AuthDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnostics: DiagnosticResult[] = []

    try {
      diagnostics.push({
        name: 'Backend API Health',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      const apiUrl = import.meta.env.VITE_API_URL || 
        (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://releye.boestad.com/api')
      
      try {
        const healthResponse = await fetch(`${apiUrl}/health`, { credentials: 'include' })
        const healthData = await healthResponse.json()
        
        diagnostics[0] = {
          name: 'Backend API Health',
          status: healthData.success ? 'success' : 'error',
          message: healthData.success ? 'Backend API is responding' : 'Backend API error',
          details: JSON.stringify(healthData, null, 2)
        }
      } catch (error) {
        diagnostics[0] = {
          name: 'Backend API Health',
          status: 'error',
          message: 'Cannot connect to backend API',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

      diagnostics.push({
        name: 'First-Time Setup Check',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const isFirstTime = await UserRegistry.isFirstTimeSetup()
        diagnostics[1] = {
          name: 'First-Time Setup Check',
          status: isFirstTime ? 'success' : 'warning',
          message: isFirstTime ? 'No admin exists - ready for first-time setup' : 'Admin already exists',
          details: `isFirstTime: ${isFirstTime}`
        }
      } catch (error) {
        diagnostics[1] = {
          name: 'First-Time Setup Check',
          status: 'error',
          message: 'Failed to check first-time status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

      diagnostics.push({
        name: 'Current User Session',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const currentUserId = await UserRegistry.getCurrentUserId()
        const currentUser = currentUserId ? await UserRegistry.getUserById(currentUserId) : null
        
        diagnostics[2] = {
          name: 'Current User Session',
          status: currentUser ? 'success' : 'warning',
          message: currentUser ? `Logged in as ${currentUser.email}` : 'No active session',
          details: currentUser ? JSON.stringify({ userId: currentUser.userId, email: currentUser.email, role: currentUser.role }, null, 2) : 'No user session'
        }
      } catch (error) {
        diagnostics[2] = {
          name: 'Current User Session',
          status: 'error',
          message: 'Failed to check user session',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

      diagnostics.push({
        name: 'LocalStorage Status',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const storageKeys = Object.keys(localStorage)
        const relevantKeys = storageKeys.filter(k => k.startsWith('releye-'))
        
        diagnostics[3] = {
          name: 'LocalStorage Status',
          status: 'success',
          message: `Found ${relevantKeys.length} RelEye keys`,
          details: JSON.stringify(relevantKeys, null, 2)
        }
      } catch (error) {
        diagnostics[3] = {
          name: 'LocalStorage Status',
          status: 'error',
          message: 'Failed to check localStorage',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

    } catch (error) {
      console.error('Diagnostic error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-success" weight="fill" />
      case 'error':
        return <XCircle className="text-destructive" weight="fill" />
      case 'warning':
        return <Warning className="text-warning" weight="fill" />
      default:
        return <ArrowsClockwise className="text-muted-foreground animate-spin" />
    }
  }

  const clearAndReload = async () => {
    if (confirm('This will clear your session and reload the page. Continue?')) {
      await UserRegistry.clearCurrentUser()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/?reset=true'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
        <CardDescription>
          Check the authentication system status and troubleshoot issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="flex gap-3 p-4 border rounded-lg">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(result.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-muted-foreground">{result.message}</div>
              {result.details && (
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                  {result.details}
                </pre>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            <ArrowsClockwise className={isRunning ? 'animate-spin' : ''} />
            {isRunning ? 'Running...' : 'Run Again'}
          </Button>
          <Button 
            onClick={clearAndReload}
            variant="destructive"
          >
            Clear Session & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
