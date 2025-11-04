import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, UserPlus, Crown, PencilSimple, Eye as EyeIcon } from '@phosphor-icons/react'
import { hashPassword } from '@/lib/auth'
import { toast } from 'sonner'
import type { WorkspaceUser, UserRole } from '@/lib/types'
import { getRoleDisplayName, getRoleDescription } from '@/lib/userManagement'

interface InviteAcceptViewProps {
  inviteToken: string
  workspaceId: string
  onComplete: (userId: string, username: string, password: string, email: string | undefined) => void
  onCancel: () => void
}

export function InviteAcceptView({ inviteToken, workspaceId, onComplete, onCancel }: InviteAcceptViewProps) {
  const [allWorkspaces, setAllWorkspaces] = useKV<Record<string, any>>('all-workspaces', {})
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteUser, setInviteUser] = useState<WorkspaceUser | null>(null)
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    const loadInvite = async () => {
      try {
        if (!allWorkspaces) {
          setError('Workspace not found')
          setIsLoading(false)
          return
        }

        const ws = allWorkspaces[workspaceId]
        if (!ws) {
          setError('Workspace not found')
          setIsLoading(false)
          return
        }

        setWorkspace(ws)

        const user = ws.users?.find((u: WorkspaceUser) => u.inviteToken === inviteToken && u.status === 'pending')
        
        if (!user) {
          setError('Invalid or expired invitation')
          setIsLoading(false)
          return
        }

        if (user.inviteExpiry && user.inviteExpiry < Date.now()) {
          setError('This invitation has expired')
          setIsLoading(false)
          return
        }

        setInviteUser(user)
        setUsername(user.username || '')
        setEmail(user.email || '')
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading invite:', err)
        setError('Failed to load invitation')
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [inviteToken, workspaceId, allWorkspaces])

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

    if (!inviteUser) {
      setError('Invitation not found')
      return
    }

    setIsSubmitting(true)

    try {
      const passwordHash = await hashPassword(password)
      
      const updatedWorkspaces = { ...allWorkspaces }
      const ws = updatedWorkspaces[workspaceId]
      
      if (ws && ws.users) {
        ws.users = ws.users.map((u: WorkspaceUser) => 
          u.userId === inviteUser.userId
            ? {
                ...u,
                username: username.trim(),
                status: 'active' as const,
                inviteToken: undefined,
                inviteExpiry: undefined
              }
            : u
        )
        
        ws.activityLog = [
          ...(ws.activityLog || []),
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: Date.now(),
            userId: inviteUser.userId,
            username: username.trim(),
            action: 'accepted',
            entityType: 'user' as const,
            entityId: inviteUser.userId,
            details: `${username.trim()} accepted invitation as ${getRoleDisplayName(inviteUser.role)}`
          }
        ]
      }

      await setAllWorkspaces(updatedWorkspaces)

      toast.success('Account activated successfully!')
      onComplete(inviteUser.userId, username.trim(), password, inviteUser.email)
    } catch (err) {
      console.error('Error accepting invite:', err)
      setError('Failed to activate account')
      setIsSubmitting(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />
      case 'editor':
        return <PencilSimple className="w-4 h-4" />
      case 'viewer':
        return <EyeIcon className="w-4 h-4" />
    }
  }

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'viewer':
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Loading invitation...</div>
        </div>
      </div>
    )
  }

  if (error && !inviteUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Logo size={64} showText={false} animated={false} />
            <CardTitle className="text-2xl font-semibold mt-4">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onCancel} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo size={80} showText={false} animated={true} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <UserPlus size={24} className="text-primary" weight="duotone" />
            <CardTitle className="text-2xl font-semibold">Welcome to RelEye</CardTitle>
          </div>
          <CardDescription className="text-base">
            You've been invited to join <strong>{workspace?.name || 'this workspace'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Logo size={40} showText={false} animated={false} />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-primary">Getting Started with RelEye</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    RelEye is a secure relationship network visualization platform. Build and explore visual networks of connections with end-to-end encryption and zero-knowledge architecture.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mt-3">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Map relationships between people and organizations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Visualize connections with advanced analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Your data is encrypted and stored locally only</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {inviteUser && (
              <div className="rounded-lg bg-card border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Role</span>
                  <Badge variant={getRoleBadgeVariant(inviteUser.role)} className="flex items-center gap-1">
                    {getRoleIcon(inviteUser.role)}
                    {getRoleDisplayName(inviteUser.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getRoleDescription(inviteUser.role)}
                </p>
                {inviteUser.email && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Email Address</span>
                      <span className="text-sm font-medium">{inviteUser.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This email is associated with your account</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Choose Your Username</Label>
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
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 characters. This will be your login username.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Activating...' : 'Accept & Join'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
