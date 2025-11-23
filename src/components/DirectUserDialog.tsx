import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Eye, EyeSlash, UserPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'

import type { UserRole } from '@/lib/types'
import * as UserRegistry from '@/lib/userRegistry'

interface DirectUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: (user: UserRegistry.RegisteredUser) => void
  currentUserId: string
}

export function DirectUserDialog({ open, onOpenChange, onUserCreated, currentUserId }: DirectUserDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('normal')
  const [canInvestigate, setCanInvestigate] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
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

    setIsSubmitting(true)

    try {
      console.log('[DirectUserDialog] ========== CREATING USER DIRECTLY ==========')
      console.log('[DirectUserDialog] Email:', email.trim())
      console.log('[DirectUserDialog] Name:', name.trim())
      console.log('[DirectUserDialog] Role:', role)
      console.log('[DirectUserDialog] Can Investigate:', canInvestigate)
      console.log('[DirectUserDialog] Created by:', currentUserId)

      const existingUser = await UserRegistry.getUserByEmail(email.trim())
      if (existingUser) {
        setError('A user with this email already exists')
        setIsSubmitting(false)
        return
      }

      const user = await UserRegistry.createUser(
        email.trim(),
        name.trim(),
        password,
        role,
        canInvestigate
      )

      console.log('[DirectUserDialog] ✓ User created successfully:', user.userId)
      console.log('[DirectUserDialog] ========== USER CREATION COMPLETE ==========')
      
      setEmail('')
      setName('')
      setPassword('')
      setConfirmPassword('')
      setRole('normal')
      setCanInvestigate(false)
      setError('')
      
      onUserCreated(user)
      onOpenChange(false)
    } catch (err) {
      console.error('[DirectUserDialog] ❌ Failed to create user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setEmail('')
    setName('')
    setPassword('')
    setConfirmPassword('')
    setRole('normal')
    setCanInvestigate(false)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <UserPlus className="w-5 h-5 text-primary" weight="duotone" />
            </div>
            <DialogTitle className="text-xl font-bold">Create User Account</DialogTitle>
          </div>
          <DialogDescription>
            Create a new user account directly without sending an email invitation. The user can log in immediately with these credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direct-email">Email Address *</Label>
            <Input
              id="direct-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              This will be used as the login username
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-name">Full Name *</Label>
            <Input
              id="direct-name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-password">Password *</Label>
            <div className="relative">
              <Input
                id="direct-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="direct-confirm-password">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="direct-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                className="pr-10"
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

          <div className="space-y-2">
            <Label htmlFor="direct-role">Access Level *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isSubmitting}>
              <SelectTrigger id="direct-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Administrator</span>
                    <span className="text-xs text-muted-foreground">- Full access</span>
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Normal User</span>
                    <span className="text-xs text-muted-foreground">- Can create & edit</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="direct-investigate" className="font-medium cursor-pointer">
                Investigation Access
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow this user to access investigation features
              </p>
            </div>
            <Switch
              id="direct-investigate"
              checked={canInvestigate}
              onCheckedChange={setCanInvestigate}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2" size={18} weight="bold" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
