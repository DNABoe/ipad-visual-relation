import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { FileManager } from './components/FileManager'
import type { Workspace } from './lib/types'

function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showFileManager, setShowFileManager] = useState(true)

  const handleLoad = (loadedWorkspace: Workspace, loadedFileName: string, loadedPassword: string) => {
    setWorkspace(loadedWorkspace)
    setFileName(loadedFileName)
    setPassword(loadedPassword)
    setShowFileManager(false)
  }

  const handleNewNetwork = () => {
    setWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }

  const handleLoadNetwork = () => {
    setWorkspace(null)
    setFileName('')
    setPassword('')
    setShowFileManager(true)
  }

  const handleSetWorkspace = (update: Workspace | ((current: Workspace) => Workspace)) => {
    if (typeof update === 'function') {
      setWorkspace((current) => {
        if (!current) return current
        return update(current)
      })
    } else {
      setWorkspace(update)
    }
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