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
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from './components/ui/button'

function App() {
  const [sparkReady, setSparkReady] = useState(false)
  const [sparkError, setSparkError] = useState(false)
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
      console.log('[App] Waiting for Spark runtime...')
      const ready = await waitForSpark(10000)
      
      if (!mounted) return
      
      if (!ready) {
        console.error('[App] Spark runtime failed to initialize')
        setSparkError(true)
        return
      }

      console.log('[App] Spark runtime ready')
      setSparkReady(true)

      try {
        const storedCredentials = await window.spark.kv.get<{
          username: string
          passwordHash: PasswordHash
        }>('user-credentials')
        
        if (mounted) {
          console.log('[App] Loaded credentials:', storedCredentials ? 'Found' : 'Not found')
          setUserCredentials(storedCredentials || null)
          setCredentialsLoaded(true)
        }
      } catch (error) {
        console.error('[App] Failed to load credentials:', error)
        if (mounted) {
          setUserCredentials(null)
          setCredentialsLoaded(true)
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
      
      console.log('[App] Saving credentials to KV store...')
      await window.spark.kv.set('user-credentials', credentials)
      
      console.log('[App] Verifying credentials were saved...')
      const stored = await window.spark.kv.get<{username: string; passwordHash: any}>('user-credentials')
      
      if (!stored || stored.username !== username) {
        throw new Error('Failed to save credentials to storage')
      }
      
      console.log('[App] Credentials verified in KV store')
      
      setUserCredentials(credentials)
      setIsAuthenticated(true)
      setIsSettingUpCredentials(false)
      
      console.log('[App] Setup complete!')
      toast.success('Administrator account created successfully!')
    } catch (error) {
      console.error('[App] Setup error:', error)
      setIsSettingUpCredentials(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(errorMessage)
      throw error
    }
  }, [])

  const handleInviteComplete = useCallback(async (userId: string, username: string, password: string) => {
    try {
      console.log('[App] Starting invite complete for username:', username)
      setIsSettingUpCredentials(true)
      
      const passwordHash = await hashPassword(password)
      const credentials = { username, passwordHash }
      
      console.log('[App] Saving credentials to KV store...')
      await window.spark.kv.set('user-credentials', credentials)
      
      console.log('[App] Verifying credentials were saved...')
      const stored = await window.spark.kv.get<{username: string; passwordHash: any}>('user-credentials')
      
      if (!stored || stored.username !== username) {
        throw new Error('Failed to save credentials to storage')
      }
      
      console.log('[App] Credentials verified in KV store')
      
      setUserCredentials(credentials)
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
  }, [])

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
          <div className="text-center space-y-6 max-w-md p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <WarningCircle size={48} className="text-destructive" weight="duotone" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">Failed to initialize storage system</h1>
              <p className="text-muted-foreground">
                The application could not connect to the storage system. This may be due to a network issue or browser compatibility problem.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Refresh Page
            </Button>
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  if (!sparkReady || !credentialsLoaded) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Initializing application...</p>
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