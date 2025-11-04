import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, Shield } from '@phosphor-icons/react'

interface FirstTimeSetupProps {
  onComplete: (username: string, password: string) => void
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('[FirstTimeSetup] Calling onComplete with username:', username.trim())
      await onComplete(username.trim(), password)
      console.log('[FirstTimeSetup] onComplete finished successfully')
    } catch (err) {
      console.error('[FirstTimeSetup] Setup error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during setup'
      setError(errorMessage)
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={24} className="text-primary" weight="duotone" />
            <CardTitle className="text-2xl font-semibold">Welcome to RelEye</CardTitle>
          </div>
          <CardDescription>Create your administrator account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Administrator Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username (e.g., admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 characters. This will be your login username.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isLoading}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <Eye size={20} weight="regular" />
                  ) : (
                    <EyeSlash size={20} weight="regular" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs font-medium text-primary mb-2">🔒 Password Security Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>• Use at least 8 characters (12+ recommended)</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid common words and personal information</li>
                <li>• This password cannot be recovered if lost</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-1">Failed to set key:</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Create Administrator Account'}
            </Button>

            <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Important:</strong> This account will have full administrator privileges. 
                You can invite additional users later from the Admin panel.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
