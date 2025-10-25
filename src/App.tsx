import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { LoginView } from './components/LoginView'
import { WorkspaceView } from './components/WorkspaceView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <>
      {isAuthenticated ? (
        <WorkspaceView onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <LoginView onLogin={() => setIsAuthenticated(true)} />
      )}
      <Toaster />
    </>
  )
}

export default App