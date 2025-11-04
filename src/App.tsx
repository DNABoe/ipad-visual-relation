import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { FirstTimeSetup } from './components/FirstTimeSetup'
import { InviteAcceptView } from './components/InviteAcceptView'
import { hashPassword, type PasswordHash } from './lib/auth'
import type { Workspace, AppSettings } from './lib/types'
import { DEFAULT_APP_SETTINGS } from './lib/constants'
import { waitForSpark } from './lib/sparkReady'
import { 
  setPendingCredentials, 
  getPendingCredentials, 
  attemptSavePendingCredentials,
  startAutoRetry
} from './lib/deferredCredentials'
import { WarningCircle, CheckCircle, CloudArrowUp } from '@phosphor-icons/react'
import { Button } from './components/ui/button'

function App() {
  const [sparkReady, setSparkReady] = useState(false)
  const [sparkError, setSparkError] = useState(false)
  const [credentialsSaveStatus, setCredentialsSaveStatus] = useState<'none' | 'pending' | 'saving' | 'saved' | 'failed'>('none')
  const [userCredentials, setUserCredentials] = useState<{
    username: string
    passwordHash: PasswordHash
  } | null>(null)
  const [credentialsLoaded, setCredentialsLoaded] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSettingUpCredentials, setIsSettingUpCredentials] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeSpark = async () => {
      console.log('[App] Starting initialization...')
      console.log('[App] Environment:', {
        userAgent: navigator.userAgent,
        location: window.location.href,
        sparkExists: !!window.spark
      })
      
      const ready = await waitForSpark(45000)
      
      if (!mounted) return
      
      if (!ready) {
        console.warn('[App] Spark KV did not initialize within timeout')
        console.log('[App] Checking for pending credentials...')
        
        const pending = getPendingCredentials()
        if (pending) {
          console.log('[App] Found pending credentials, starting background save')
          setCredentialsSaveStatus('pending')
          setUserCredentials({ username: pending.username, passwordHash: pending.passwordHash })
          setCredentialsLoaded(true)
          setSparkReady(false)
          
          startAutoRetry(() => {
            console.log('[App] Background save successful!')
            setCredentialsSaveStatus('saved')
            setSparkReady(true)
            toast.success('Credentials synchronized successfully')
          })
        } else {
          console.error('[App] No Spark KV and no pending credentials')
          setSparkError(true)
        }
        return
      }

      console.log('[App] ✓ Spark runtime ready')
      setSparkReady(true)

      const pending = getPendingCredentials()
      if (pending) {
        console.log('[App] Found pending credentials, attempting immediate save...')
        setCredentialsSaveStatus('saving')
        const saved = await attemptSavePendingCredentials()
        if (saved) {
          console.log('[App] ✓ Pending credentials saved')
          setCredentialsSaveStatus('saved')
          setUserCredentials({ username: pending.username, passwordHash: pending.passwordHash })
          setCredentialsLoaded(true)
          toast.success('Credentials saved successfully')
          return
        } else {
          console.warn('[App] Failed to save pending credentials, will retry')
          setCredentialsSaveStatus('pending')
          startAutoRetry(() => {
            setCredentialsSaveStatus('saved')
            toast.success('Credentials synchronized')
          })
        }
      }

      try {
        console.log('[App] Loading stored credentials from KV...')
        const storedCredentials = await window.spark.kv.get<{
          username: string
          passwordHash: PasswordHash
        }>('user-credentials')
        
        if (mounted) {
          console.log('[App] Loaded credentials:', storedCredentials ? 'Found' : 'Not found')
          setUserCredentials(storedCredentials || null)
          setCredentialsLoaded(true)
          setCredentialsSaveStatus(storedCredentials ? 'saved' : 'none')
        }
      } catch (error) {
        console.error('[App] Failed to load credentials:', error)
        if (mounted) {
          setUserCredentials(null)
          setCredentialsLoaded(true)
          setCredentialsSaveStatus('none')
        }
      }
    }

    initializeSpark()

    return () => {
      mounted = false
    }
  }, [])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] Starting first time setup for username:', username)
      setIsSettingUpCredentials(true)
      
      const passwordHash = await hashPassword(password)
      const credentials = { username, passwordHash }
      
      setPendingCredentials(username, passwordHash)
      setUserCredentials(credentials)
      
      if (sparkReady && window.spark && window.spark.kv) {
        console.log('[App] Spark ready, attempting immediate save...')
        setCredentialsSaveStatus('saving')
        
        try {
          await window.spark.kv.set('user-credentials', credentials)
          
          const stored = await window.spark.kv.get<{username: string; passwordHash: PasswordHash}>('user-credentials')
          
          if (stored && stored.username === username) {
            console.log('[App] ✓ Credentials saved and verified')
            setCredentialsSaveStatus('saved')
            toast.success('Administrator account created successfully!')
          } else {
            throw new Error('Verification failed')
          }
        } catch (saveError) {
          console.warn('[App] Immediate save failed, will retry in background:', saveError)
          setCredentialsSaveStatus('pending')
          toast.info('Account created. Credentials will be synchronized in the background.')
          startAutoRetry(() => {
            setCredentialsSaveStatus('saved')
            toast.success('Credentials synchronized successfully')
          })
        }
      } else {
        console.log('[App] Spark not ready, credentials set as pending')
        setCredentialsSaveStatus('pending')
        toast.info('Account created. Credentials will be saved when connection is ready.')
        
        startAutoRetry(() => {
          setCredentialsSaveStatus('saved')
          toast.success('Credentials synchronized successfully')
        })
      }
      
      setIsAuthenticated(true)
      setIsSettingUpCredentials(false)
      console.log('[App] Setup complete!')
    } catch (error) {
      console.error('[App] Setup error:', error)
      setIsSettingUpCredentials(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(errorMessage)
      throw error
    }
  }, [sparkReady])

  const handleInviteComplete = useCallback(async (userId: string, username: string, password: string) => {
    try {
      console.log('[App] Starting invite complete for username:', username)
      setIsSettingUpCredentials(true)
      
      const passwordHash = await hashPassword(password)
      const credentials = { username, passwordHash }
      
      setPendingCredentials(username, passwordHash)
      setUserCredentials(credentials)
      
      if (sparkReady && window.spark && window.spark.kv) {
        console.log('[App] Spark ready, attempting immediate save...')
        setCredentialsSaveStatus('saving')
        
        try {
          await window.spark.kv.set('user-credentials', credentials)
          
          const stored = await window.spark.kv.get<{username: string; passwordHash: PasswordHash}>('user-credentials')
          
          if (stored && stored.username === username) {
            console.log('[App] ✓ Credentials saved and verified')
            setCredentialsSaveStatus('saved')
          } else {
            throw new Error('Verification failed')
          }
        } catch (saveError) {
          console.warn('[App] Immediate save failed, will retry in background:', saveError)
          setCredentialsSaveStatus('pending')
          toast.info('Account created. Credentials will be synchronized in the background.')
          startAutoRetry(() => {
            setCredentialsSaveStatus('saved')
            toast.success('Credentials synchronized')
          })
        }
      } else {
        console.log('[App] Spark not ready, credentials set as pending')
        setCredentialsSaveStatus('pending')
        startAutoRetry(() => {
          setCredentialsSaveStatus('saved')
          toast.success('Credentials synchronized')
        })
      }
      
      setInviteToken(null)
      setInviteWorkspaceId(null)
      window.history.replaceState({}, '', window.location.pathname)
      setIsAuthenticated(true)
      setIsSettingUpCredentials(false)
      
      console.log('[App] Invite complete!')
      toast.success('Account created successfully!')
    } catch (error) {
      console.error('[App] Invite accept error:', error)
      setIsSettingUpCredentials(false)
      toast.error('Failed to complete invite setup')
    }
  }, [sparkReady])

  const handleInviteCancel = useCallback(() => {
    setInviteToken(null)
    setInviteWorkspaceId(null)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  const handleLoad = useCallback(async (loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    if (!userCredentials) {
      toast.error('User credentials not found. Please refresh the page.')
      return
    }

    let updatedWorkspace = { ...loadedWorkspace }
    
    if (!updatedWorkspace.users) {
      updatedWorkspace.users = []
    }
    
    if (!updatedWorkspace.activityLog) {
      updatedWorkspace.activityLog = []
    }
    
    const currentUser = updatedWorkspace.users.find(u => u.username === userCredentials.username)
    
    if (!currentUser) {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const adminUser = {
        userId: userId,
        username: userCredentials.username,
        role: 'admin' as const,
        addedAt: Date.now(),
        addedBy: 'system',
        status: 'active' as const
      }
      
      updatedWorkspace = {
        ...updatedWorkspace,
        users: [...updatedWorkspace.users, adminUser],
        ownerId: updatedWorkspace.ownerId || userId
      }
    }
    
    setInitialWorkspace(updatedWorkspace)
    setFileName(loadedFileName)
    setPassword(loadedPassword)
    setShowFileManager(false)
  }, [userCredentials])

  const handleNewNetwork = useCallback(() => {
    setInitialWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }, [])

  const handleLoadNetwork = useCallback(() => {
    setInitialWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }, [])

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setInitialWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }, [])

  if (sparkError) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 max-w-2xl p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <WarningCircle size={48} className="text-destructive" weight="duotone" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">Failed to initialize storage system</h1>
              <p className="text-muted-foreground">
                The application could not connect to the storage system within 30 seconds. 
                This may be due to a network issue, browser compatibility problem, or the Spark runtime not being available.
              </p>
              <div className="mt-4 p-4 bg-muted/20 rounded-lg text-left">
                <p className="text-sm text-muted-foreground font-mono">
                  Diagnostic Information:
                </p>
                <ul className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
                  <li>• Browser: {navigator.userAgent.split(' ').pop()}</li>
                  <li>• Location: {window.location.href}</li>
                  <li>• Spark Available: {String(!!window.spark)}</li>
                  <li>• KV Available: {String(!!(window.spark && window.spark.kv))}</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
              <p className="text-xs text-muted-foreground">
                If the problem persists, try clearing your browser cache or using a different browser.
              </p>
            </div>
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  if (!credentialsLoaded) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Initializing application...</p>
            {credentialsSaveStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-sm text-warning">
                <CloudArrowUp size={16} className="animate-pulse" />
                <span>Connecting to storage...</span>
              </div>
            )}
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  if (isSettingUpCredentials) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Setting up your account...</p>
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  if (inviteToken && inviteWorkspaceId) {
    return (
      <>
        <InviteAcceptView
          inviteToken={inviteToken}
          workspaceId={inviteWorkspaceId}
          onComplete={handleInviteComplete}
          onCancel={handleInviteCancel}
        />
        <Toaster />
      </>
    )
  }

  if (!userCredentials) {
    return (
      <>
        <FirstTimeSetup onComplete={handleFirstTimeSetup} />
        <Toaster />
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  if (showFileManager || !initialWorkspace) {
    return (
      <>
        <FileManager onLoad={handleLoad} />
        <Toaster />
      </>
    )
  }

  return (
    <>
      {credentialsSaveStatus === 'pending' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-warning/10 border-b border-warning/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm text-warning">
            <CloudArrowUp size={16} className="animate-pulse" />
            <span>Credentials will be synchronized when connection is available</span>
          </div>
        </div>
      )}
      {credentialsSaveStatus === 'saving' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm text-primary">
            <CloudArrowUp size={16} className="animate-bounce" />
            <span>Synchronizing credentials...</span>
          </div>
        </div>
      )}
      <WorkspaceView
        workspace={initialWorkspace}
        fileName={fileName}
        password={password}
        onNewNetwork={handleNewNetwork}
        onLoadNetwork={handleLoadNetwork}
        onLogout={handleLogout}
      />
      <Toaster />
    </>
  )
}

export default App