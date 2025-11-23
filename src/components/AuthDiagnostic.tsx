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
        name: 'Spark KV Availability',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const sparkAvailable = !!(window.spark && window.spark.kv)
        const canRead = sparkAvailable && typeof window.spark.kv.get === 'function'
        const canWrite = sparkAvailable && typeof window.spark.kv.set === 'function'
        const canDelete = sparkAvailable && typeof window.spark.kv.delete === 'function'
        const canList = sparkAvailable && typeof window.spark.kv.keys === 'function'
        
        const allFunctionsAvailable = canRead && canWrite && canDelete && canList
        
        diagnostics[0] = {
          name: 'Spark KV Availability',
          status: allFunctionsAvailable ? 'success' : 'error',
          message: allFunctionsAvailable ? 'Spark KV is fully available' : 'Spark KV is not available or incomplete',
          details: JSON.stringify({
            sparkExists: !!window.spark,
            kvExists: !!(window.spark && window.spark.kv),
            canRead,
            canWrite,
            canDelete,
            canList
          }, null, 2)
        }
      } catch (error) {
        diagnostics[0] = {
          name: 'Spark KV Availability',
          status: 'error',
          message: 'Error checking Spark KV',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

      diagnostics.push({
        name: 'Spark KV Test Write/Read',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const testKey = '_diagnostic_test_key'
        const testValue = { timestamp: Date.now(), test: 'diagnostic' }
        
        await window.spark.kv.set(testKey, testValue)
        const retrieved = await window.spark.kv.get<typeof testValue>(testKey)
        await window.spark.kv.delete(testKey)
        
        const success = retrieved && JSON.stringify(retrieved) === JSON.stringify(testValue)
        
        diagnostics[1] = {
          name: 'Spark KV Test Write/Read',
          status: success ? 'success' : 'error',
          message: success ? 'KV operations working correctly' : 'KV operations failed',
          details: success ? 'Successfully wrote, read, and deleted test data' : 'Data integrity check failed'
        }
      } catch (error) {
        diagnostics[1] = {
          name: 'Spark KV Test Write/Read',
          status: 'error',
          message: 'Failed to test KV operations',
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
        diagnostics[2] = {
          name: 'First-Time Setup Check',
          status: isFirstTime ? 'success' : 'warning',
          message: isFirstTime ? 'No admin exists - ready for first-time setup' : 'Admin already exists',
          details: `isFirstTime: ${isFirstTime}`
        }
      } catch (error) {
        diagnostics[2] = {
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
        
        diagnostics[3] = {
          name: 'Current User Session',
          status: currentUser ? 'success' : 'warning',
          message: currentUser ? `Logged in as ${currentUser.email}` : 'No active session',
          details: currentUser ? JSON.stringify({ userId: currentUser.userId, email: currentUser.email, role: currentUser.role }, null, 2) : 'No user session'
        }
      } catch (error) {
        diagnostics[3] = {
          name: 'Current User Session',
          status: 'error',
          message: 'Failed to check user session',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setResults([...diagnostics])

      diagnostics.push({
        name: 'All Users in Database',
        status: 'pending',
        message: 'Checking...'
      })
      setResults([...diagnostics])

      try {
        const allUsers = await UserRegistry.getAllUsers()
        
        diagnostics[4] = {
          name: 'All Users in Database',
          status: allUsers.length > 0 ? 'success' : 'warning',
          message: `Found ${allUsers.length} user(s) in database`,
          details: allUsers.length > 0 
            ? JSON.stringify(allUsers.map(u => ({ userId: u.userId, email: u.email, role: u.role })), null, 2)
            : 'No users found in database'
        }
      } catch (error) {
        diagnostics[4] = {
          name: 'All Users in Database',
          status: 'error',
          message: 'Failed to fetch users',
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

  const resetAllData = async () => {
    const confirmation = prompt(
      'WARNING: This will delete ALL users, invites, and reset the entire system.\n\n' +
      'This action cannot be undone!\n\n' +
      'Type "DELETE EVERYTHING" to confirm:'
    )
    
    if (confirmation === 'DELETE EVERYTHING') {
      try {
        setIsRunning(true)
        await UserRegistry.resetAllData()
        alert('All data has been reset successfully. The page will reload to first-time setup.')
        window.location.href = '/'
      } catch (error) {
        alert('Failed to reset data: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setIsRunning(false)
      }
    } else if (confirmation !== null) {
      alert('Reset cancelled - you must type exactly "DELETE EVERYTHING" to confirm')
    }
  }

  const createTestUser = async () => {
    if (!confirm('Create a test user with username "test" and password "test"?')) {
      return
    }

    try {
      setIsRunning(true)
      console.log('[AuthDiagnostic] Creating test user...')
      
      const existingUser = await UserRegistry.getUserByEmail('test')
      if (existingUser) {
        alert('Test user already exists! Check the diagnostics results above.')
        setIsRunning(false)
        await runDiagnostics()
        return
      }

      const testUser = await UserRegistry.createUser(
        'test',
        'Test User',
        'test',
        'normal',
        true
      )
      
      console.log('[AuthDiagnostic] ✓ Test user created:', testUser)
      alert(`Test user created successfully!\n\nEmail: test\nPassword: test\nRole: ${testUser.role}\n\nCheck the database to verify.`)
      
      await runDiagnostics()
    } catch (error) {
      console.error('[AuthDiagnostic] Failed to create test user:', error)
      alert('Failed to create test user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsRunning(false)
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

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-3">
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
              variant="secondary"
            >
              Clear Session & Reload
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              🧪 Test User Creation
            </p>
            <Button 
              onClick={createTestUser}
              disabled={isRunning}
              variant="default"
              className="w-full"
            >
              Create Test User (test/test)
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              ⚠️ Danger Zone: If you have a malformed user in the database (like "admin-default"), use this to completely reset:
            </p>
            <Button 
              onClick={resetAllData}
              disabled={isRunning}
              variant="destructive"
              className="w-full"
            >
              Reset All Data & Start Fresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
