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
  const [isSettingUpCredentials, setIsSettingUpCredentials] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    console.log('[App] userCredentials state changed:', userCredentials ? `username: ${userCredentials.username}` : 'null')
  }, [userCredentials])

  useEffect(() => {
    console.log('[App] isAuthenticated state changed:', isAuthenticated)
  }, [isAuthenticated])

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
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
  }, [setUserCredentials])

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
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
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