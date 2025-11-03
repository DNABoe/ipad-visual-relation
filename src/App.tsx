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

function App() {
  const [userCredentials, setUserCredentials] = useKV<{
    username: string
    passwordHash: PasswordHash
  } | null>('user-credentials', null)
  
  const [appSettings, setAppSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] ===== AUTH INITIALIZATION =====')
        console.log('[App] Checking for stored credentials in spark.kv...')
        console.log('[App] userCredentials value:', userCredentials)
        console.log('[App] userCredentials type:', typeof userCredentials)
        
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('invite')
        const workspaceId = urlParams.get('workspace')
        
        if (token && workspaceId) {
          console.log('[App] Invite link detected, showing invite accept view')
          setInviteToken(token)
          setInviteWorkspaceId(workspaceId)
          setIsCheckingAuth(false)
          return
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!userCredentials) {
          console.log('[App] ❌ No credentials found in cloud storage')
          console.log('[App] Showing first-time setup')
          setNeedsSetup(true)
          setIsCheckingAuth(false)
          return
        }
        
        console.log('[App] ✅ Credentials found in cloud storage')
        console.log('[App] Username:', userCredentials.username)
        console.log('[App] Has password hash:', !!userCredentials.passwordHash)
        console.log('[App] Showing login screen')
        setNeedsSetup(false)
        setIsCheckingAuth(false)
        console.log('[App] ===== AUTH INITIALIZATION COMPLETE =====')
      } catch (error) {
        console.error('[App] ❌ Auth initialization error:', error)
        setIsCheckingAuth(false)
      }
    }
    
    initializeAuth()
  }, [userCredentials])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] ===== FIRST TIME SETUP START =====')
      console.log('[App] Creating admin account for username:', username)
      
      const passwordHash = await hashPassword(password)
      console.log('[App] ✅ Password hashed successfully')
      console.log('[App] Hash length:', passwordHash.hash.length)
      console.log('[App] Salt length:', passwordHash.salt.length)
      console.log('[App] Iterations:', passwordHash.iterations)
      
      const credentials = {
        username,
        passwordHash
      }
      
      console.log('[App] Saving credentials to spark.kv cloud storage...')
      setUserCredentials(credentials)
      
      console.log('[App] Waiting for cloud persistence (500ms)...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('[App] ✅ Credentials saved to cloud')
      console.log('[App] Authenticating user...')
      
      setNeedsSetup(false)
      setIsAuthenticated(true)
      
      toast.success('Admin account created successfully!')
      console.log('[App] ===== FIRST TIME SETUP COMPLETE =====')
    } catch (error) {
      console.error('[App] ❌ First-time setup error:', error)
      toast.error('Failed to create admin account. Please try again.')
    }
  }, [setUserCredentials])

  const handleInviteComplete = useCallback(async (userId: string, username: string, password: string) => {
    try {
      const passwordHash = await hashPassword(password)
      
      await setUserCredentials({
        username,
        passwordHash
      })

      setInviteToken(null)
      setInviteWorkspaceId(null)
      window.history.replaceState({}, '', window.location.pathname)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('[App] Invite accept error:', error)
    }
  }, [setUserCredentials])

  const handleInviteCancel = useCallback(() => {
    setInviteToken(null)
    setInviteWorkspaceId(null)
    window.history.replaceState({}, '', window.location.pathname)
    setNeedsSetup(!userCredentials)
  }, [userCredentials])

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  const handleLoad = useCallback((loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    if (!userCredentials) {
      console.error('[App] ❌ Cannot load workspace without user credentials')
      toast.error('Authentication error. Please reload the page.')
      return
    }

    console.log('[App] ===== LOADING WORKSPACE =====')
    console.log('[App] Workspace name:', loadedFileName)
    console.log('[App] Current username:', userCredentials.username)
    console.log('[App] Workspace users:', JSON.stringify(loadedWorkspace.users, null, 2))
    
    let updatedWorkspace = { ...loadedWorkspace }
    
    if (!updatedWorkspace.users) {
      console.log('[App] ⚠️  users array is null/undefined, initializing to []')
      updatedWorkspace.users = []
    }
    
    if (!updatedWorkspace.activityLog) {
      console.log('[App] ⚠️  activityLog is null/undefined, initializing to []')
      updatedWorkspace.activityLog = []
    }
    
    const currentUser = updatedWorkspace.users.find(u => u.username === userCredentials.username)
    
    if (!currentUser) {
      console.log('[App] ⚠️  Current user NOT FOUND in workspace.users')
      console.log('[App] Adding user as admin...')
      
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
      
      console.log('[App] ✅ Admin user created:', JSON.stringify(adminUser, null, 2))
      console.log('[App] ✅ Set as workspace owner')
    } else {
      console.log('[App] ✅ Current user FOUND in workspace')
      console.log('[App] User ID:', currentUser.userId)
      console.log('[App] User role:', currentUser.role)
      console.log('[App] User status:', currentUser.status)
    }
    
    console.log('[App] Final workspace users:', JSON.stringify(updatedWorkspace.users, null, 2))
    console.log('[App] Setting workspace state and closing file manager...')
    
    setInitialWorkspace(updatedWorkspace)
    setFileName(loadedFileName)
    setPassword(loadedPassword)
    setShowFileManager(false)
    
    console.log('[App] ===== WORKSPACE LOAD COMPLETE =====')
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

  if (isCheckingAuth) {
    console.log('[App] Checking authentication...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">Initializing RelEye...</div>
            <div className="text-sm text-muted-foreground">Checking cloud credentials</div>
          </div>
        </div>
      </div>
    )
  }

  if (inviteToken && inviteWorkspaceId) {
    console.log('[App] Showing invite accept view')
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

  if (needsSetup) {
    console.log('[App] Showing first-time setup')
    return (
      <>
        <FirstTimeSetup onComplete={handleFirstTimeSetup} />
        <Toaster />
      </>
    )
  }

  if (!isAuthenticated) {
    console.log('[App] Not authenticated, showing login view')
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  if (showFileManager || !initialWorkspace) {
    console.log('[App] Showing file manager', { showFileManager, hasWorkspace: !!initialWorkspace })
    return (
      <>
        <FileManager onLoad={handleLoad} />
        <Toaster />
      </>
    )
  }

  console.log('[App] Showing workspace view')
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