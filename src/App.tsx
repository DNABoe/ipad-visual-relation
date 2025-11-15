/*
 * ============================================================
 * AUTHENTICATION BYPASS MODE - TEMPORARY FOR TESTING
 * ============================================================
 * 
 * This file is currently running in BYPASS MODE to allow testing
 * without a backend server. See the initializeAuth() function
 * below for the bypass implementation.
 * 
 * WHAT'S BYPASSED:
 * - User login/authentication
 * - Backend API calls for user management
 * - First-time setup flow
 * 
 * WHAT'S PRESERVED:
 * - User credentials in storage (including API keys)
 * - Settings and preferences
 * - All core application functionality
 * 
 * TO RESTORE FULL AUTHENTICATION:
 * See the detailed comments in the initializeAuth() function
 * 
 * ============================================================
 */

import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { FirstTimeSetup } from './components/FirstTimeSetup'
import { InviteAcceptView } from './components/InviteAcceptView'
import { isCloudAPIAvailable } from './lib/cloudAPI'
import type { Workspace } from './lib/types'
import type { UserCredentials } from './lib/auth'
import * as UserRegistry from './lib/userRegistry'
import { generateSampleData } from './lib/sampleData'

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
        // ============================================================
        // TEMPORARY BYPASS FOR TESTING WITHOUT BACKEND
        // ============================================================
        // TODO: Remove this entire bypass block when backend is ready
        // This section creates a mock user and loads sample data without
        // requiring proper authentication. It preserves any existing user
        // credentials (including API keys) that were set up previously.
        // 
        // TO RESTORE NORMAL AUTHENTICATION:
        // 1. Delete this entire bypass block (lines starting with "TEMPORARY BYPASS")
        // 2. Uncomment the original authentication flow below
        // ============================================================
        
        console.log('[App] ========== BYPASSING LOGIN - LOADING SAMPLE DATA ==========')
        
        // Create a temporary mock user with admin privileges
        const mockUser: UserRegistry.RegisteredUser = {
          userId: 'temp-user-123',
          email: 'temp@user.com',
          name: 'Temporary User',
          role: 'admin',
          passwordHash: { hash: 'temp', salt: 'temp', iterations: 100000 },
          createdAt: Date.now(),
          loginCount: 1,
          canInvestigate: true
        }
        
        setCurrentUser(mockUser)
        
        // IMPORTANT: Preserve existing credentials including API keys
        console.log('[App] Loading existing user credentials from storage...')
        const { storage } = await import('./lib/storage')
        const existingCredentials = await storage.get<UserCredentials>('user-credentials')
        
        if (!existingCredentials) {
          // Only create temporary credentials if none exist
          console.log('[App] No existing credentials found, creating temporary credentials...')
          const tempCredentials: UserCredentials = {
            username: 'Temporary User',
            passwordHash: { hash: 'temp', salt: 'temp', iterations: 100000 }
            // Note: No API key here - user must add it in Settings
          }
          await storage.set('user-credentials', tempCredentials)
          console.log('[App] ✓ Temporary credentials created')
        } else {
          // Preserve existing credentials completely (including encrypted API key)
          console.log('[App] ✓ Existing credentials found and preserved')
          console.log('[App] Username:', existingCredentials.username)
          console.log('[App] Has API key:', !!existingCredentials.encryptedApiKey)
          // DO NOT overwrite or modify existing credentials - they contain the user's API key
        }
        
        // Load sample workspace data for testing
        const sampleWorkspace = generateSampleData()
        sampleWorkspace.ownerId = mockUser.userId
        sampleWorkspace.users = [{
          userId: mockUser.userId,
          username: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          addedAt: Date.now(),
          addedBy: 'system',
          status: 'active' as const,
          loginCount: 1,
          canInvestigate: true
        }]
        
        setInitialWorkspace(sampleWorkspace)
        setFileName('Sample Network')
        setPassword('temp-password')
        setShowFileManager(false)
        
        console.log('[App] ========== SAMPLE DATA LOADED ==========')
        toast.success('Loaded with sample data - temporary session')
        
        // ============================================================
        // END OF TEMPORARY BYPASS BLOCK
        // ============================================================
        
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