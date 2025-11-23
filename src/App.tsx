import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { FirstTimeSetup } from './components/FirstTimeSetup'
import { InviteAcceptView } from './components/InviteAcceptView'
import { AuthDiagnostic } from './components/AuthDiagnostic'
import { DatabaseDiagnostic } from './components/DatabaseDiagnostic'
import { SparkNotAvailableError } from './components/SparkNotAvailableError'
import type { Workspace } from './lib/types'
import * as UserRegistry from './lib/userRegistry'
import { waitForStorage } from './lib/sparkReady'
import './lib/persistenceTest'

function App() {
  const [currentUser, setCurrentUser] = useState<UserRegistry.RegisteredUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [sparkNotAvailable, setSparkNotAvailable] = useState(false)
  
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] ========== INITIALIZING AUTHENTICATION ==========')
        console.log('[App] Environment check:')
        console.log('[App]   - URL:', window.location.href)
        console.log('[App]   - Backend API: https://releye.boestad.com/api')
        console.log('[App]   - localStorage available:', !!window.localStorage)
        console.log('[App]   - User Agent:', navigator.userAgent)
        
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('invite')
        const email = urlParams.get('email')
        const forceReset = urlParams.get('reset')
        
        console.log('[App] URL Parameters:')
        console.log('[App]   - invite token:', token ? token.substring(0, 8) + '...' : 'none')
        console.log('[App]   - invite token (full length):', token ? token.length + ' chars' : 'none')
        console.log('[App]   - email:', email || 'none')
        console.log('[App]   - reset:', forceReset || 'none')
        
        if (token && email) {
          console.log('[App] ========== INVITE LINK DETECTED ==========')
          console.log('[App] Skipping normal auth flow, loading invite view directly')
          const decodedToken = decodeURIComponent(token)
          const decodedEmail = decodeURIComponent(email)
          console.log('[App] Decoded token length:', decodedToken.length, 'chars')
          console.log('[App] Decoded email:', decodedEmail)
          setInviteToken(decodedToken)
          setInviteEmail(decodedEmail)
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] Checking storage availability...')
        const isReady = await waitForStorage(5000)
        
        if (!isReady) {
          console.error('[App] ❌ Storage failed to initialize!')
          console.error('[App] Final diagnostic:')
          console.error('[App]   - window.localStorage:', !!window.localStorage)
          console.error('[App]   - Backend API: https://releye.boestad.com/api')
          
          setSparkNotAvailable(true)
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] ✓ Storage is ready')
        
        if (forceReset === 'true') {
          console.log('[App] Force reset parameter detected - clearing session and showing first-time setup')
          await UserRegistry.clearCurrentUser()
          window.history.replaceState({}, '', window.location.pathname)
          setIsFirstTime(true)
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] Checking if first-time setup needed...')
        try {
          const isFirstTimeSetup = await UserRegistry.isFirstTimeSetup()
          console.log('[App] First time setup:', isFirstTimeSetup)
          
          if (isFirstTimeSetup) {
            console.log('[App] No admin found - showing first time setup')
            await UserRegistry.clearCurrentUser()
            setIsFirstTime(true)
            setIsLoadingAuth(false)
            return
          }
        } catch (error) {
          console.error('[App] ❌ Failed to check first-time status:', error)
          toast.error('Failed to initialize. Please refresh and try again.')
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] Checking for current user session...')
        const existingUser = await UserRegistry.getCurrentUser()
        
        if (existingUser) {
          console.log('[App] ✓ User session found:', existingUser.email)
          setCurrentUser(existingUser)
        } else {
          console.log('[App] No active session - showing login')
        }
        
        console.log('[App] ========== INITIALIZATION COMPLETE ==========')
      } catch (error) {
        console.error('[App] ❌ Failed to initialize:', error)
        toast.error('Failed to initialize application. Please check the diagnostics page.')
      } finally {
        setIsLoadingAuth(false)
      }
    }
    
    initializeAuth()
  }, [])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] ========== FIRST TIME SETUP ==========')
      console.log('[App] Starting first time setup for:', username)
      
      console.log('[App] Creating admin user...')
      const user = await UserRegistry.createUser(username, 'Administrator', password, 'admin', true)
      console.log('[App] ✓ Admin user created:', {
        userId: user.userId,
        email: user.email,
        role: user.role
      })
      
      console.log('[App] Setting current user session...')
      await UserRegistry.setCurrentUser(user.userId)
      console.log('[App] ✓ User session set')
      
      setCurrentUser(user)
      setIsFirstTime(false)
      
      console.log('[App] ========== SETUP COMPLETE ==========')
      toast.success('Administrator account created successfully!')
    } catch (error) {
      console.error('[App] ========== SETUP FAILED ==========')
      console.error('[App] Setup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(errorMessage)
      throw error
    }
  }, [])

  const handleInviteComplete = useCallback(async (token: string, password: string) => {
    try {
      console.log('[App] Completing invite...')
      
      const user = await UserRegistry.consumeInvite(token, password)
      console.log('[App] ✓ Invite consumed, user created')
      
      await UserRegistry.setCurrentUser(user.userId)
      console.log('[App] ✓ User session set')
      
      setCurrentUser(user)
      setInviteToken(null)
      setInviteEmail(null)
      window.history.replaceState({}, '', window.location.pathname)
      
      toast.success('Account created successfully!')
    } catch (error) {
      console.error('[App] Invite accept error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete invite setup'
      toast.error(errorMessage)
      throw error
    }
  }, [])

  const handleInviteCancel = useCallback(() => {
    console.log('[App] Invite cancelled by user')
    setInviteToken(null)
    setInviteEmail(null)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      console.log('[App] Attempting login for:', email)
      const user = await UserRegistry.authenticateUser(email, password)
      
      if (!user) {
        toast.error('Invalid email or password')
        return false
      }
      
      setCurrentUser(user)
      toast.success('Welcome back!')
      return true
    } catch (error) {
      console.error('[App] Login error:', error)
      toast.error('Login failed')
      return false
    }
  }, [])

  const handleLoad = useCallback(async (loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    if (!currentUser) {
      toast.error('User session not found. Please refresh the page.')
      return
    }

    const updatedWorkspace = {
      ...loadedWorkspace,
      ownerId: loadedWorkspace.ownerId || currentUser.userId
    }
    
    setInitialWorkspace(updatedWorkspace)
    setFileName(loadedFileName)
    setPassword(loadedPassword)
    setShowFileManager(false)
  }, [currentUser])

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

  const handleLogout = useCallback(async () => {
    await UserRegistry.clearCurrentUser()
    setCurrentUser(null)
    setInitialWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
    toast.success('Logged out successfully')
  }, [])

  if (isLoadingAuth) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-3">
              <p className="text-foreground font-medium">Initializing application...</p>
              <p className="text-sm text-muted-foreground">Checking browser storage</p>
              <div className="mt-6 p-4 bg-card rounded-lg border border-border text-left">
                <p className="text-xs font-mono text-muted-foreground mb-2">Diagnostic Info:</p>
                <div className="text-xs font-mono space-y-1 text-muted-foreground">
                  <div>URL: {window.location.hostname}</div>
                  <div>Backend API: https://releye.boestad.com/api</div>
                  <div>Storage: {window.localStorage ? '✓ Available' : '✗ Not found'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                If this takes more than a few seconds, please check your browser settings.
              </p>
            </div>
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  const urlParams = new URLSearchParams(window.location.search)
  const showDiagnostics = urlParams.get('diagnostics') === 'true'
  const showDbDiagnostics = urlParams.get('db-diagnostics') === 'true'

  if (sparkNotAvailable) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-destructive text-6xl">⚠️</div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Storage Not Available</h1>
              <p className="text-muted-foreground">
                This application requires persistent storage to function. Please ensure your browser supports the necessary storage mechanisms.
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-2 mt-4">
                <li>• Cookies and site data are enabled</li>
                <li>• You're not in private/incognito mode</li>
                <li>• Browser storage isn't disabled</li>
              </ul>
              <div className="mt-6 p-4 bg-card rounded-lg border border-border text-left">
                <p className="text-xs font-mono text-muted-foreground mb-2">Diagnostic Info:</p>
                <div className="text-xs font-mono space-y-1 text-muted-foreground">
                  <div>URL: {window.location.hostname}</div>
                  <div>Backend API: https://releye.boestad.com/api</div>
                  <div>Storage: {window.localStorage ? '✓ Available' : '✗ Not available'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </>
    )
  }

  if (showDiagnostics) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <AuthDiagnostic />
        </div>
        <Toaster />
      </>
    )
  }

  if (showDbDiagnostics) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <DatabaseDiagnostic />
        </div>
        <Toaster />
      </>
    )
  }

  if (inviteToken) {
    return (
      <>
        <InviteAcceptView
          inviteToken={inviteToken}
          inviteEmail={inviteEmail}
          onComplete={handleInviteComplete}
          onCancel={handleInviteCancel}
        />
        <Toaster />
      </>
    )
  }

  if (isFirstTime) {
    return (
      <>
        <FirstTimeSetup onComplete={handleFirstTimeSetup} />
        <Toaster />
      </>
    )
  }

  if (!currentUser) {
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