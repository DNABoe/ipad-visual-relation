import { useState, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceView } from './components/WorkspaceView2'
import { FileManager } from './components/FileManager'
import { LoginView } from './components/LoginView'
import type { Workspace } from './lib/types'

function App() {
  const [authSettings] = useKV<{ hasCredentials: boolean }>('auth-config', { hasCredentials: false })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  useEffect(() => {
    if (authSettings) {
      if (!authSettings.hasCredentials) {
        setIsAuthenticated(true)
      }
      setIsCheckingAuth(false)
    }
  }, [authSettings])

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
      />
      <Toaster />
    </>
  )
}

export default App