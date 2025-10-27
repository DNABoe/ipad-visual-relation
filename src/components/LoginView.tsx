import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyPassword, getDefaultPasswordHash, type PasswordHash, isPasswordHash } from '@/lib/auth'
import { DEFAULT_USERNAME } from '@/lib/constants'
import { UserCircle, Eye, EyeSlash } from '@phosphor-icons/react'

interface LoginViewProps {
  onLogin: () => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [settings] = useKV<{
    username: string
    passwordHash: PasswordHash
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    showMinimap: boolean
  }>('app-settings', undefined)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [defaultHash, setDefaultHash] = useState<PasswordHash | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    getDefaultPasswordHash().then(setDefaultHash)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const storedUsername = settings?.username || DEFAULT_USERNAME
      const storedPasswordHash = settings?.passwordHash || defaultHash

      if (!storedPasswordHash) {
        setError('System initializing, please try again')
        setIsLoading(false)
        return
      }

      if (!isPasswordHash(storedPasswordHash)) {
        setError('Invalid credentials configuration')
        setIsLoading(false)
        return
      }

      if (username !== storedUsername) {
        setError('Invalid username or password')
        setIsLoading(false)
        return
      }

      const isValid = await verifyPassword(password, storedPasswordHash)
      
      if (isValid) {
        onLogin()
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle size={40} className="text-primary" weight="duotone" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Visual Relationship Network</CardTitle>
          <CardDescription>Sign in to access your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
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
            <p className="text-xs text-center text-muted-foreground mt-4">
              Default credentials: admin / admin
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
