import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle, Eye, EyeSlash } from '@phosphor-icons/react'
import { Logo } from '@/components/Logo'

interface LoginViewProps {
  onLogin: (emailOrUsername: string, password: string) => Promise<boolean>
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 
          (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://releye.boestad.com/api')
        const response = await fetch(`${apiUrl}/health`, { 
          credentials: 'include',
          signal: AbortSignal.timeout(5000)
        })
        const data = await response.json()
        setBackendStatus(data.success ? 'online' : 'offline')
      } catch (error) {
        console.error('Backend health check failed:', error)
        setBackendStatus('offline')
      }
    }
    
    checkBackend()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!username.trim() || !password) {
        setError('Please enter your username and password')
        setIsLoading(false)
        return
      }

      const success = await onLogin(username.trim(), password)
      
      if (!success) {
        setError('Invalid username or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo size={64} showText={false} animated={true} />
          </div>
          <CardTitle className="text-2xl font-semibold">RelEye</CardTitle>
          <CardDescription>Sign in to access your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {backendStatus === 'offline' && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">⚠️ Backend API is not responding</p>
              <p className="text-xs text-muted-foreground mt-1">
                The authentication server cannot be reached. 
                <a href="/?diagnostics=true" className="text-primary hover:underline ml-1">
                  Run diagnostics
                </a>
              </p>
            </div>
          )}
          
          {backendStatus === 'online' && (
            <div className="mb-4 p-2 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-xs text-success">✓ Backend connected</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Eye size={20} weight="regular" />
                  ) : (
                    <EyeSlash size={20} weight="regular" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="text-center pt-4">
              <a 
                href="?diagnostics=true" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                API Connection Diagnostics
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
