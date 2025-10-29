import { useState, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import { getDefaultPasswordHash, type PasswordHash } from './lib/auth'
import type { Workspace } from './lib/types'

function App() {
  const [userCredentials, setUserCredentials] = useKV<{
    username: string
    passwordHash: PasswordHash
  } | null>('user-credentials', null)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      if (!userCredentials) {
        const defaultHash = await getDefaultPasswordHash()
        await setUserCredentials({
          username: 'admin',
          passwordHash: defaultHash
        })
      }
      setIsCheckingAuth(false)
    }
    
    initializeAuth()
  }, [userCredentials, setUserCredentials])

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
    return null
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  if (showFileManager || !workspace) {
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