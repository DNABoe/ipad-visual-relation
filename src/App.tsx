import { useState, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import type { Workspace } from './lib/types'
import * as SingleUserAuth from './lib/singleUserAuth'
import type { SingleUser } from './lib/singleUserAuth'

function App() {
  const [currentUser, setCurrentUser] = useState<SingleUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] Initializing single-user mode...')
        
        const existingSession = await SingleUserAuth.getCurrentSession()
        
        if (existingSession) {
          console.log('[App] ✓ User session found:', existingSession.username)
          setCurrentUser(existingSession)
        } else {
          console.log('[App] No active session - showing login')
        }
        
        console.log('[App] Initialization complete')
      } catch (error) {
        console.error('[App] Failed to initialize:', error)
        toast.error('Failed to initialize application.', { duration: 4000 })
      } finally {
        setIsLoadingAuth(false)
      }
    }
    
    initializeAuth()
  }, [])

  const handleLogin = useCallback(async (username: string, password: string) => {
    try {
      console.log('[App] Attempting login for:', username)
      const user = await SingleUserAuth.authenticateSingleUser(username, password)
      
      if (!user) {
        toast.error('Invalid username or password', { duration: 3000 })
        return false
      }
      
      setCurrentUser(user)
      toast.success('Welcome back!', { duration: 2000 })
      return true
    } catch (error) {
      console.error('[App] Login error:', error)
      toast.error('Login failed', { duration: 3000 })
      return false
    }
  }, [])

  const handleLoad = useCallback(async (loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    if (!currentUser) {
      toast.error('User session not found. Please refresh the page.', { duration: 4000 })
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
    await SingleUserAuth.clearCurrentSession()
    setCurrentUser(null)
    setInitialWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
    toast.success('Logged out successfully', { duration: 2000 })
  }, [])

  if (isLoadingAuth) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-3">
              <p className="text-foreground font-medium">Initializing application...</p>
            </div>
          </div>
        </div>
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