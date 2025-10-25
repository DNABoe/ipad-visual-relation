import { Toaster } from '@/components/ui/sonner'
import { WorkspaceView } from './components/WorkspaceView'
import { useTheme } from './hooks/use-theme'

function App() {
  useTheme()

  return (
    <>
      <WorkspaceView />
      <Toaster />
    </>
  )
}

export default App