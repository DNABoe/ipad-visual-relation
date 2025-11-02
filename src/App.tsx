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
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isInitialized) return
    
    const initializeAuth = async () => {
      try {
        console.log('[App] Initializing auth...', { userCredentials })
        if (!userCredentials) {
          console.log('[App] No credentials found, creating defaults...')
          const defaultHash = await getDefaultPasswordHash()
          console.log('[App] Default hash generated:', defaultHash)
          await setUserCredentials({
            username: 'admin',
            passwordHash: defaultHash
          })
          console.log('[App] Default credentials saved')
        } else {
          console.log('[App] Existing credentials found')
        }
        
        if (!appSettings || Object.keys(appSettings).length === 0) {
          console.log('[App] No app settings found, initializing defaults...')
          await setAppSettings(DEFAULT_APP_SETTINGS)
          console.log('[App] Default app settings saved')
        } else {
          const mergedSettings = { ...DEFAULT_APP_SETTINGS, ...appSettings }
          if (JSON.stringify(mergedSettings) !== JSON.stringify(appSettings)) {
            console.log('[App] Updating app settings with missing defaults...')
            await setAppSettings(mergedSettings)
          }
        }
        
        setIsCheckingAuth(false)
        setIsInitialized(true)
        console.log('[App] Auth check complete')
      } catch (error) {
        console.error('[App] Auth initialization error:', error)
        setIsCheckingAuth(false)
        setIsInitialized(true)
      }
    }
    
    initializeAuth()
  }, [isInitialized, userCredentials, setUserCredentials, appSettings, setAppSettings])

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  const handleLoad = useCallback((loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    setWorkspace(loadedWorkspace)
    setFileName(loadedFileName)
    setPassword(loadedPassword)
    setShowFileManager(false)
  }, [])

  const handleNewNetwork = useCallback(() => {
    setWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }, [])

  const handleLoadNetwork = useCallback(() => {
    setWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }, [])

  const handleSetWorkspace = useCallback((update: Workspace | ((current: Workspace) => Workspace)) => {
    if (typeof update === 'function') {
      setWorkspace((current) => {
        if (!current) return current
        return update(current)
      })
    } else {
      setWorkspace(update)
    }
  }, [])

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setWorkspace(null)
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

  if (showFileManager || !workspace) {
    console.log('[App] Showing file manager', { showFileManager, hasWorkspace: !!workspace })
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
        workspace={workspace}
        setWorkspace={handleSetWorkspace}
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