import { useState, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
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

function App() {
  const [sparkReady, setSparkReady] = useState(false)
  const [userCredentials, setUserCredentials] = useKV<{
    username: string
    passwordHash: PasswordHash
  } | null>('user-credentials', null)
  
  const [appSettings, setAppSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeSpark = async () => {
      console.log('[App] Waiting for Spark runtime...')
      const ready = await waitForSpark(10000)
      if (ready) {
        console.log('[App] Spark runtime ready')
        setSparkReady(true)
      } else {
        console.error('[App] Spark runtime failed to initialize')
        toast.error('Failed to initialize storage system. Please refresh the page.')
      }
    }
    
    initializeSpark()
  }, [])

  useEffect(() => {
    console.log('[App] Component rendered/updated')
    console.log('[App] userCredentials:', userCredentials)
    console.log('[App] isAuthenticated:', isAuthenticated)
    console.log('[App] showFileManager:', showFileManager)
  }, [userCredentials, isAuthenticated, showFileManager])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('invite')
    const workspaceId = urlParams.get('workspace')
    
    if (token && workspaceId) {
      setInviteToken(token)
      setInviteWorkspaceId(workspaceId)
    }
  }, [])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] Starting first-time setup for username:', username)
      
      console.log('[App] Ensuring Spark runtime is ready...')
      const sparkIsReady = await waitForSpark(5000)
      if (!sparkIsReady) {
        throw new Error('Storage system failed to initialize. Please refresh the page and try again.')
      }
      
      console.log('[App] Hashing password...')
      const passwordHash = await hashPassword(password)
      const credentials = { username, passwordHash }
      
      console.log('[App] Saving credentials to storage...')
      await window.spark.kv.set('user-credentials', credentials)
      
      console.log('[App] Verifying saved credentials...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const savedCreds = await window.spark.kv.get('user-credentials')
      console.log('[App] Retrieved credentials:', savedCreds ? 'Found' : 'Not found')
      
      if (!savedCreds) {
        throw new Error('Failed to verify saved credentials. Storage may be unavailable.')
      }
      
      console.log('[App] Updating application state...')
      setUserCredentials(() => credentials)
      
      console.log('[App] Waiting for state propagation...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setIsAuthenticated(true)
      
      toast.success('Administrator account created successfully!')
      
      console.log('[App] Setup complete')
    } catch (error) {
      console.error('[App] Setup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(errorMessage)
      throw error
    }
  }, [setUserCredentials])

  const handleInviteComplete = useCallback(async (userId: string, username: string, password: string) => {
    try {
      console.log('[App] Completing invite for username:', username)
      const passwordHash = await hashPassword(password)
      const credentials = { username, passwordHash }
      
      console.log('[App] Saving credentials directly to KV...')
      await window.spark.kv.set('user-credentials', credentials)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const savedCreds = await window.spark.kv.get('user-credentials')
      console.log('[App] Verified saved credentials:', savedCreds)
      
      if (!savedCreds) {
        throw new Error('Failed to save credentials - verification failed')
      }
      
      setUserCredentials(() => credentials)

      setInviteToken(null)
      setInviteWorkspaceId(null)
      window.history.replaceState({}, '', window.location.pathname)
      setIsAuthenticated(true)
      
      toast.success('Account created successfully!')
    } catch (error) {
      console.error('[App] Invite accept error:', error)
      toast.error('Failed to complete invite setup')
    }
  }, [setUserCredentials])

  const handleInviteCancel = useCallback(() => {
    setInviteToken(null)
    setInviteWorkspaceId(null)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  const handleLoad = useCallback(async (loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    const credentials = await window.spark.kv.get<{username: string; passwordHash: PasswordHash}>('user-credentials')
    
    if (!credentials) {
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
    
    const currentUser = updatedWorkspace.users.find(u => u.username === credentials.username)
    
    if (!currentUser) {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const adminUser = {
        userId: userId,
        username: credentials.username,
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
  }, [])

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

  if (!sparkReady) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Initializing RelEye...</p>
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