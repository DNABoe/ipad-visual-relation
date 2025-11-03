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
        console.log('[App] Initializing auth...')
        
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('invite')
        const workspaceId = urlParams.get('workspace')
        
        if (token && workspaceId) {
          console.log('[App] Invite link detected')
          setInviteToken(token)
          setInviteWorkspaceId(workspaceId)
          setIsCheckingAuth(false)
          return
        }
        
        if (!userCredentials) {
          console.log('[App] No credentials found, needs first-time setup')
          setNeedsSetup(true)
          setIsCheckingAuth(false)
          return
        }
        
        console.log('[App] Existing credentials found')
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('[App] Auth initialization error:', error)
        setIsCheckingAuth(false)
      }
    }
    
    initializeAuth()
  }, [userCredentials])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] ===== FIRST TIME SETUP =====')
      console.log('[App] Creating admin account for username:', username)
      
      const passwordHash = await hashPassword(password)
      console.log('[App] Password hashed successfully')
      
      const credentials = {
        username,
        passwordHash
      }
      
      console.log('[App] Saving credentials to KV store...')
      await setUserCredentials(credentials)
      
      console.log('[App] Waiting for KV persistence...')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      console.log('[App] Credentials saved successfully')
      console.log('[App] Setting needsSetup=false, isAuthenticated=true')
      
      setNeedsSetup(false)
      setIsAuthenticated(true)
      
      console.log('[App] ===== FIRST TIME SETUP COMPLETE =====')
    } catch (error) {
      console.error('[App] First-time setup error:', error)
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
      console.error('[App] Cannot load workspace without user credentials')
      toast.error('Authentication error. Please reload the page.')
      return
    }

    console.log('[App] ===== LOADING WORKSPACE =====')
    console.log('[App] Workspace name:', loadedFileName)
    console.log('[App] Current username:', userCredentials.username)
    console.log('[App] Workspace users (before):', JSON.stringify(loadedWorkspace.users, null, 2))
    
    let updatedWorkspace = { ...loadedWorkspace }
    
    if (!updatedWorkspace.users) {
      console.log('[App] users array is null/undefined, initializing to []')
      updatedWorkspace.users = []
    }
    
    if (!updatedWorkspace.activityLog) {
      console.log('[App] activityLog is null/undefined, initializing to []')
      updatedWorkspace.activityLog = []
    }
    
    const currentUser = updatedWorkspace.users.find(u => u.username === userCredentials.username)
    
    if (!currentUser) {
      console.log('[App] Current user NOT FOUND in workspace, adding as admin')
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
        ownerId: userId
      }
      
      console.log('[App] Admin user created:', JSON.stringify(adminUser, null, 2))
    } else {
      console.log('[App] Current user FOUND in workspace')
      console.log('[App] User details:', JSON.stringify(currentUser, null, 2))
      if (currentUser.role !== 'admin') {
        console.warn('[App] WARNING: User exists but is NOT admin. Role:', currentUser.role)
      } else {
        console.log('[App] User is confirmed ADMIN')
      }
    }
    
    console.log('[App] Workspace users (after):', JSON.stringify(updatedWorkspace.users, null, 2))
    console.log('[App] Setting initialWorkspace state...')
    
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
    console.log('[App] Still checking auth...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Initializing RelEye...</div>
          <div className="text-xs text-muted-foreground/60">Checking authentication</div>
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