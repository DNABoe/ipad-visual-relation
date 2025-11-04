import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, UserPlus, Crown, PencilSimple, Eye as EyeIcon } from '@phosphor-icons/react'
import { hashPassword } from '@/lib/auth'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/types'
import { getRoleDisplayName, getRoleDescription } from '@/lib/userManagement'

interface PendingInvite {
  name: string
  email: string
  role: UserRole
  token: string
  expiry: number
  createdAt: number
}

interface InviteAcceptViewProps {
  inviteToken: string
  workspaceId: string
  inviteEmail: string | null
  onComplete: (userId: string, username: string, password: string, email: string | undefined) => void
  onCancel: () => void
}

export function InviteAcceptView({ inviteToken, workspaceId, inviteEmail, onComplete, onCancel }: InviteAcceptViewProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteData, setInviteData] = useState<PendingInvite | null>(null)

  useEffect(() => {
    const loadInvite = async () => {
      try {
        console.log('[InviteAcceptView] Loading invitation...')
        console.log('[InviteAcceptView] inviteToken:', inviteToken)
        console.log('[InviteAcceptView] inviteEmail:', inviteEmail)

        const invites = await storage.get<PendingInvite[]>('pending-invites')
        console.log('[InviteAcceptView] All pending invites:', invites)

        if (!invites || invites.length === 0) {
          console.log('[InviteAcceptView] No pending invites found')
          setError('Invalid or expired invitation.')
          setIsLoading(false)
          return
        }

        let invite = invites.find(inv => inv.token === inviteToken)
        
        if (inviteEmail && !invite) {
          invite = invites.find(inv => inv.email === inviteEmail && inv.token === inviteToken)
        }
        
        console.log('[InviteAcceptView] Found invite:', invite)
        
        if (!invite) {
          console.log('[InviteAcceptView] No matching invite found')
          setError('Invalid or expired invitation. The invitation may have been revoked.')
          setIsLoading(false)
          return
        }

        if (invite.expiry < Date.now()) {
          console.log('[InviteAcceptView] Invitation expired')
          setError('This invitation has expired. Please contact the administrator for a new invitation.')
          setIsLoading(false)
          return
        }

        console.log('[InviteAcceptView] Invitation valid')
        setInviteData(invite)
        setIsLoading(false)
      } catch (err) {
        console.error('[InviteAcceptView] Error loading invite:', err)
        setError('Failed to load invitation. Please try again.')
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [inviteToken, inviteEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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

    if (!inviteData) {
      setError('Invitation not found')
      return
    }

    setIsSubmitting(true)

    try {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      const invites = await storage.get<PendingInvite[]>('pending-invites') || []
      const updatedInvites = invites.filter(inv => inv.token !== inviteToken)
      await storage.set('pending-invites', updatedInvites)

      toast.success('Account created successfully!')
      onComplete(userId, inviteData.email, password, inviteData.email)
    } catch (err) {
      console.error('Error accepting invite:', err)
      setError('Failed to create account')
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

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Logo size={64} showText={false} animated={false} />
            <CardTitle className="text-2xl font-semibold mt-4">Invitation Issue</CardTitle>
            <CardDescription className="text-base mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-xs font-medium text-warning mb-1">⚠️ Common Issues</p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>• The invitation link may have expired (7 days)</li>
                <li>• The invitation may have been revoked by the administrator</li>
                <li>• The link may have already been used</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname)
                  window.location.reload()
                }} 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
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
            Create your account to start visualizing relationship networks
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
                      <span>Create your own private network files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Map relationships between people and organizations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>All data is encrypted and stored locally on your device</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {inviteData && (
              <div className="rounded-lg bg-card border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Access Level</span>
                  <Badge variant={getRoleBadgeVariant(inviteData.role)} className="flex items-center gap-1">
                    {getRoleIcon(inviteData.role)}
                    {getRoleDisplayName(inviteData.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getRoleDescription(inviteData.role)}
                </p>
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{inviteData.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Email (Login)</span>
                    <span className="text-sm font-medium">{inviteData.email}</span>
                  </div>
                </div>
              </div>
            )}

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
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
