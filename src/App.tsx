import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { FirstTimeSetup } from './components/FirstTimeSetup'
import { InviteAcceptView } from './components/InviteAcceptView'
import { isCloudAPIAvailable } from './lib/cloudAPI'
import type { Workspace } from './lib/types'
import * as UserRegistry from './lib/userRegistry'

function App() {
  const [currentUser, setCurrentUser] = useState<UserRegistry.RegisteredUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] ========== INITIALIZATION START ==========')
        console.log('[App] Checking cloud API availability...')
        
        const apiAvailable = await isCloudAPIAvailable()
        console.log('[App] Cloud API available:', apiAvailable)
        
        if (!apiAvailable) {
          console.error('[App] ❌ Cloud API is not available at', window.location.origin + '/api')
          toast.error('Unable to connect to server. Please check your deployment.')
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] ✓ Cloud API is ready')
        
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('invite')
        const email = urlParams.get('email')
        
        if (token) {
          console.log('[App] Invite link detected:', { token: token.substring(0, 8) + '...', email })
          setInviteToken(token)
          setInviteEmail(email)
          setIsLoadingAuth(false)
          return
        }
        
        console.log('[App] Checking if first time setup...')
        const firstTime = await UserRegistry.isFirstTimeSetup()
        console.log('[App] Is first time:', firstTime)
        setIsFirstTime(firstTime)
        
        if (!firstTime) {
          console.log('[App] Checking for current user session...')
          const user = await UserRegistry.getCurrentUser()
          console.log('[App] Current user:', user ? user.email : 'none')
          setCurrentUser(user || null)
        }
        
        console.log('[App] ========== INITIALIZATION COMPLETE ==========')
      } catch (error) {
        console.error('[App] ❌ Failed to initialize:', error)
        toast.error('Failed to initialize application. Please refresh the page.')
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
      
      console.log('[App] Checking cloud API...')
      const apiAvailable = await isCloudAPIAvailable()
      console.log('[App] API available:', apiAvailable)
      
      if (!apiAvailable) {
        const errorMsg = 'Cloud API is not available. Please ensure the backend server is running.'
        console.error('[App] ❌', errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('[App] ✓ Cloud API ready, creating admin user...')
      const user = await UserRegistry.createUser(username, 'Administrator', password, 'admin', true)
      console.log('[App] ✓ Admin user created:', {
        userId: user.userId,
        email: user.email,
        role: user.role
      })
      
      console.log('[App] Setting current user session...')
      await UserRegistry.setCurrentUser(user.userId)
      console.log('[App] ✓ User session set')
      
      console.log('[App] Verifying user was saved...')
      const verifyUser = await UserRegistry.getUserById(user.userId)
      if (!verifyUser) {
        throw new Error('Failed to verify user was saved correctly')
      }
      console.log('[App] ✓ User verified in registry')
      
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

    let updatedWorkspace = { ...loadedWorkspace }
    
    if (!updatedWorkspace.users) {
      updatedWorkspace.users = []
    }
    
    if (!updatedWorkspace.activityLog) {
      updatedWorkspace.activityLog = []
    }
    
    const currentWorkspaceUser = updatedWorkspace.users.find(u => u.email === currentUser.email)
    
    if (!currentWorkspaceUser) {
      const workspaceUser = {
        userId: currentUser.userId,
        username: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        addedAt: Date.now(),
        addedBy: 'system',
        status: 'active' as const,
        loginCount: currentUser.loginCount,
        canInvestigate: currentUser.canInvestigate
      }
      
      updatedWorkspace = {
        ...updatedWorkspace,
        users: [...updatedWorkspace.users, workspaceUser],
        ownerId: updatedWorkspace.ownerId || currentUser.userId
      }
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Initializing...</p>
            </div>
          </div>
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