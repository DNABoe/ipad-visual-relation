import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Eye, EyeSlash, UserPlus } from '@phosphor-icons/react'

import type { UserRole } from '@/lib/types'
  onOpenChange: (open: boolean) => void
import * as UserRegistry from '@/lib/userRegistry'

interface DirectUserDialogProps {
  open,
  onOpenChange: (open: boolean) => void
  const [showPassword, setS
  const [isSubmitting, 



      s
    }
    const emailR
      setError(
    }
    if (!name.trim()) {
      return

      setError('Password is required')
    }
    if (password.length < 8) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      consol
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
      setEmail('')
      return
     

    setIsSubmitting(true)

      onO
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
            <div 
        role,
            <DialogTit
      )

      console.log('[DirectUserDialog] ✓ User created successfully:', user.userId)
      console.log('[DirectUserDialog] ========== USER CREATION COMPLETE ==========')

      toast.success(`User ${name.trim()} created successfully!`)
      
      setEmail('')
      setName('')
              onChang
      setConfirmPassword('')
            />
      setCanInvestigate(false)
      setError('')
      
      onUserCreated()
      onOpenChange(false)
    } catch (err) {
      console.error('[DirectUserDialog] ❌ Failed to create user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
              autoComplete="off
    } finally {
      setIsSubmitting(false)
    }
   

  const handleCancel = () => {
    setEmail('')
               
    setPassword('')
                className=
    setRole('viewer')
    setCanInvestigate(false)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
          </div>
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
                {showConfirmPassword ? (
            <Input
                  <EyeSlash siz
              type="email"
            </div>
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              <SelectTrigger id=
            />
              <SelectContent>
              This will be used as the login username
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-name">Full Name *</Label>
            <Input
                </SelectItem>
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

            <div className="space-y-0
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
              d
                {showPassword ? (
                  <Eye size={20} weight="regular" />
                ) : (
            </Button>
                )}
              </button>
            </div>
}

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

                {showConfirmPassword ? (

                ) : (

                )}

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
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Editor</span>
                    <span className="text-xs text-muted-foreground">- Can create & edit</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Viewer</span>



















































