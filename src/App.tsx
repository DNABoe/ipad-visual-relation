import { useState, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { getDefaultPasswordHash, type PasswordHash } from './lib/auth'
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
  const [initialWorkspace, setInitialWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] Initializing auth...')
        
        setUserCredentials((current) => {
          if (current) {
            console.log('[App] Existing credentials found')
            return current
          }
          console.log('[App] No credentials found, creating defaults...')
          getDefaultPasswordHash().then(defaultHash => {
            console.log('[App] Default hash generated:', defaultHash)
            setUserCredentials({
              username: 'admin',
              passwordHash: defaultHash
            })
          })
          return null
        })
        
        setAppSettings((current) => {
          if (current && Object.keys(current).length > 0) {
            const mergedSettings = { ...DEFAULT_APP_SETTINGS, ...current }
            if (JSON.stringify(mergedSettings) !== JSON.stringify(current)) {
              console.log('[App] Updating app settings with missing defaults...')
              return mergedSettings
            }
            return current
          }
          console.log('[App] No app settings found, initializing defaults...')
          return DEFAULT_APP_SETTINGS
        })
        
        setIsCheckingAuth(false)
        console.log('[App] Auth check complete')
      } catch (error) {
        console.error('[App] Auth initialization error:', error)
        setIsCheckingAuth(false)
      }
    }
    
    initializeAuth()
  }, [])

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  const handleLoad = useCallback((loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    setInitialWorkspace(loadedWorkspace)
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