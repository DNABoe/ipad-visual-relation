import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, UserPlus, Crown, PencilSimple, Eye as EyeIcon } from '@phosphor-icons/react'
import type { UserRole } from '@/lib/types'
import { getRoleDisplayName, getRoleDescription } from '@/lib/userManagement'
import * as UserRegistry from '@/lib/userRegistry'
import { storage } from '@/lib/storage'

interface InviteAcceptViewProps {
  inviteToken: string
  inviteEmail: string | null
  onComplete: (token: string, password: string) => Promise<void>
  onCancel: () => void
}

export function InviteAcceptView({ inviteToken, inviteEmail, onComplete, onCancel }: InviteAcceptViewProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteData, setInviteData] = useState<UserRegistry.PendingInvite | null>(null)

  useEffect(() => {
    const loadInvite = async () => {
      try {
        console.log('[InviteAcceptView] ========== LOADING INVITATION ==========')
        console.log('[InviteAcceptView] inviteToken:', inviteToken.substring(0, 8) + '...')
        console.log('[InviteAcceptView] inviteToken length:', inviteToken.length, 'chars')
        console.log('[InviteAcceptView] inviteEmail:', inviteEmail)

        console.log('[InviteAcceptView] Checking storage availability...')
        const storageReady = await storage.isReady()
        if (!storageReady) {
          console.error('[InviteAcceptView] ❌ Storage not ready')
          setError('System storage is not available. Please refresh the page and try again.')
          setIsLoading(false)
          return
        }
        console.log('[InviteAcceptView] ✓ Storage ready')

        console.log('[InviteAcceptView] Cleaning up expired invites...')
        await UserRegistry.cleanupExpiredInvites()
        
        console.log('[InviteAcceptView] Looking up invite by token...')
        const invite = await UserRegistry.getInviteByToken(inviteToken)

        if (!invite) {
          console.log('[InviteAcceptView] ❌ No matching invite found')
          console.log('[InviteAcceptView] Token used for lookup:', inviteToken.substring(0, 8) + '...')
          setError('This invitation link is invalid or has been revoked. Please contact your administrator for a new invitation link.')
          setIsLoading(false)
          return
        }

        console.log('[InviteAcceptView] ✓ Found matching invite:', {
          email: invite.email,
          name: invite.name,
          role: invite.role,
          createdAt: new Date(invite.createdAt).toISOString(),
          expiresAt: new Date(invite.expiresAt).toISOString()
        })

        const now = Date.now()
        if (invite.expiresAt < now) {
          console.log('[InviteAcceptView] ❌ Invitation expired at:', new Date(invite.expiresAt).toISOString())
          const expiredDate = new Date(invite.expiresAt).toLocaleDateString()
          setError(`This invitation expired on ${expiredDate}. Please contact your administrator for a new invitation link.`)
          setIsLoading(false)
          return
        }

        const daysRemaining = Math.ceil((invite.expiresAt - now) / (1000 * 60 * 60 * 24))
        console.log('[InviteAcceptView] ✓ Invitation is valid, expires in', daysRemaining, 'days')
        console.log('[InviteAcceptView] ========== INVITATION LOADED SUCCESSFULLY ==========')
        setInviteData(invite)
        setIsLoading(false)
      } catch (err) {
        console.error('[InviteAcceptView] ❌ Error loading invite:', err)
        setError('Failed to load invitation. This could be a connection issue. Please refresh the page and try again.')
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
      await onComplete(inviteToken, password)
    } catch (err) {
      console.error('Error accepting invite:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
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
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <Logo size={48} showText={false} animated={false} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold mb-2">Invitation Issue</CardTitle>
              <CardDescription className="text-base leading-relaxed">{error}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4">
              <p className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Common Issues & Solutions
              </p>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span><strong>Expired Link:</strong> Invitations expire after 7 days. Request a new invitation from your administrator.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span><strong>Already Used:</strong> This link may have already been used to create an account. Try logging in instead.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span><strong>Revoked:</strong> The administrator may have cancelled this invitation. Contact them for a new one.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span><strong>Connection Issue:</strong> Try refreshing the page or check your internet connection.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  window.location.href = window.location.pathname
                }}
                className="w-full h-12 font-semibold"
              >
                Go to Login Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  window.location.reload()
                }}
                className="w-full h-12 font-semibold"
              >
                Refresh Page
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
