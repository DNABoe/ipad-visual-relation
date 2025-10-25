import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { hashPassword, verifyPassword } from '@/lib/helpers'
import { DEFAULT_USERNAME, DEFAULT_PASSWORD } from '@/lib/constants'
import { UserCircle } from '@phosphor-icons/react'

interface LoginViewProps {
  onLogin: () => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [settings, setSettings] = useKV<{
    username: string
    passwordHash: string
    showGrid: boolean
    snapToGrid: boolean
    showMinimap: boolean
  }>('app-settings', {
    username: DEFAULT_USERNAME,
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    showGrid: true,
    snapToGrid: false,
    showMinimap: true,
  })

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const currentSettings = await window.spark.kv.get<{
      username: string
      passwordHash: string
      showGrid: boolean
      snapToGrid: boolean
      showMinimap: boolean
    }>('app-settings')

    const settingsToUse = currentSettings || {
      username: DEFAULT_USERNAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      showGrid: true,
      snapToGrid: false,
      showMinimap: true,
    }

    if (username === settingsToUse.username && verifyPassword(password, settingsToUse.passwordHash)) {
      onLogin()
    } else {
      setError('Invalid username or password')
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Sign In
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
