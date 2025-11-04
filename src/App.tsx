import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { FirstTimeSetup } from './components/FirstTimeSetup'
import { InviteAcceptView } from './components/InviteAcceptView'
import { hashPassword, type PasswordHash } from './lib/auth'
import { storage } from './lib/storage'
import type { Workspace } from './lib/types'

function App() {
  const [userCredentials, setUserCredentials] = useState<{
    username: string
    passwordHash: PasswordHash
  } | null>(null)
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSettingUpCredentials, setIsSettingUpCredentials] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        console.log('[App] ========== INITIALIZATION START ==========')
        console.log('[App] Checking storage availability...')
        console.log('[App] window.spark exists:', !!window.spark)
        console.log('[App] window.spark.kv exists:', !!window.spark?.kv)
        
        const storageReady = await storage.isReady()
        console.log('[App] Storage ready:', storageReady)
        
        if (!storageReady) {
          console.error('[App] ❌ Storage failed to become ready')
          setUserCredentials(null)
          setIsLoadingCredentials(false)
          return
        }
        
        console.log('[App] ✓ Storage is ready')
        console.log('[App] Checking for existing credentials...')
        
        const allKeys = await storage.keys()
        console.log('[App] All storage keys:', allKeys)
        
        const credentials = await storage.get<{
          username: string
          passwordHash: PasswordHash
        }>('user-credentials')
        
        console.log('[App] Credentials loaded:', credentials ? `exists (username: ${credentials.username})` : 'not found')
        
        if (credentials) {
          console.log('[App] Credentials structure check:', {
            hasUsername: !!credentials.username,
            hasPasswordHash: !!credentials.passwordHash,
            hasHash: !!credentials.passwordHash?.hash,
            hasSalt: !!credentials.passwordHash?.salt,
            hasIterations: !!credentials.passwordHash?.iterations
          })
        }
        
        setUserCredentials(credentials || null)
        console.log('[App] ========== INITIALIZATION COMPLETE ==========')
      } catch (error) {
        console.error('[App] ❌ Failed to load credentials:', error)
        console.error('[App] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        setUserCredentials(null)
      } finally {
        setIsLoadingCredentials(false)
      }
    }
    loadCredentials()
  }, [])

  const handleFirstTimeSetup = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] Starting first time setup for username:', username)
      setIsSettingUpCredentials(true)
      
      console.log('[App] Ensuring storage is ready...')
      const storageReady = await storage.isReady()
      if (!storageReady) {
        throw new Error('Storage system is not available. Please refresh the page and try again.')
      }
      
      console.log('[App] Hashing password...')
      const passwordHash = await hashPassword(password)
      console.log('[App] Password hashed successfully:', { 
        hasHash: !!passwordHash.hash, 
        hasSalt: !!passwordHash.salt,
        iterations: passwordHash.iterations 
      })
      
      const credentials = { username, passwordHash }
      console.log('[App] Attempting to save credentials to storage...')
      console.log('[App] Credentials object:', JSON.stringify(credentials, null, 2))
      
      await storage.set('user-credentials', credentials)
      console.log('[App] Credentials saved successfully to storage')
      
      console.log('[App] Verifying credentials were saved...')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const savedCredentials = await storage.get<{
        username: string
        passwordHash: PasswordHash
      }>('user-credentials')
      
      if (!savedCredentials) {
        console.error('[App] Verification failed: savedCredentials is null/undefined')
        throw new Error('Failed to verify credentials were saved. Storage returned empty.')
      }
      
      if (savedCredentials.username !== username) {
        console.error('[App] Verification failed: username mismatch')
        throw new Error('Failed to verify credentials were saved. Username mismatch.')
      }
      
      if (!savedCredentials.passwordHash || !savedCredentials.passwordHash.hash) {
        console.error('[App] Verification failed: passwordHash invalid')
        throw new Error('Failed to verify credentials were saved. Password hash invalid.')
      }
      
      console.log('[App] ✓ Credentials verified in storage')
      
      setUserCredentials(credentials)
      setIsAuthenticated(true)
      setIsSettingUpCredentials(false)
      
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
      
      console.log('[App] Ensuring storage is ready...')
      const storageReady = await storage.isReady()
      if (!storageReady) {
        throw new Error('Storage system is not available. Please refresh the page and try again.')
      }
      
      console.log('[App] Hashing password...')
      const passwordHash = await hashPassword(password)
      console.log('[App] Password hashed successfully')
      
      const credentials = { username, passwordHash }
      console.log('[App] Attempting to save credentials to storage...')
      
      await storage.set('user-credentials', credentials)
      console.log('[App] Credentials saved successfully to storage')
      
      setUserCredentials(credentials)
      
      setInviteToken(null)
      setInviteWorkspaceId(null)
      window.history.replaceState({}, '', window.location.pathname)
      setIsAuthenticated(true)
      setIsSettingUpCredentials(false)
      
      toast.success('Account created successfully!')
    } catch (error) {
      console.error('[App] Invite accept error:', error)
      setIsSettingUpCredentials(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete invite setup'
      toast.error(errorMessage)
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

  if (isLoadingCredentials) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Initializing storage system...</p>
              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            </div>
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