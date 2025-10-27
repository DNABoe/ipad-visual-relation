import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { hashPassword, getDefaultPasswordHash, type PasswordHash, verifyPassword } from '@/lib/auth'
import { toast } from 'sonner'
import type { Workspace } from '@/lib/types'
import { APP_VERSION } from '@/lib/version'
import { Logo } from '@/components/Logo'
import { DEFAULT_USERNAME } from '@/lib/constants'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
  onImport: (workspace: Workspace) => void
}

export function SettingsDialog({ open, onOpenChange, workspace, onImport }: SettingsDialogProps) {
  const [settings, setSettings] = useKV<{
    username: string
    passwordHash: PasswordHash
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    showMinimap: boolean
  }>('app-settings', undefined)

  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [defaultHash, setDefaultHash] = useState<PasswordHash | null>(null)

  useEffect(() => {
    getDefaultPasswordHash().then(setDefaultHash)
  }, [])

  useEffect(() => {
    if (settings) {
      setUsername(settings.username || DEFAULT_USERNAME)
    } else if (!settings && defaultHash) {
      setSettings({
        username: DEFAULT_USERNAME,
        passwordHash: defaultHash,
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
        showMinimap: true,
      })
    }
  }, [settings, defaultHash, setSettings])

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty')
      return
    }

    if (newPassword && !currentPassword) {
      toast.error('Please enter your current password to change it')
      return
    }

    if (newPassword && newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSaving(true)

    try {
      if (newPassword && currentPassword) {
        const storedHash = settings?.passwordHash || defaultHash
        if (!storedHash) {
          toast.error('Unable to verify current password')
          setIsSaving(false)
          return
        }

        const isCurrentPasswordValid = await verifyPassword(currentPassword, storedHash)
        if (!isCurrentPasswordValid) {
          toast.error('Current password is incorrect')
          setIsSaving(false)
          return
        }

        const newHash = await hashPassword(newPassword)
        setSettings((current) => ({
          ...current!,
          username: username.trim(),
          passwordHash: newHash,
        }))

        toast.success('Username and password updated successfully')
      } else {
        setSettings((current) => ({
          ...current!,
          username: username.trim(),
        }))

        toast.success('Username updated successfully')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onOpenChange(false)
    } catch (error) {
      console.error('Settings update error:', error)
      toast.error('Failed to update settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your system preferences and account
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">System</TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">User</TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-5 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Canvas Settings</h3>
              <div className="space-y-4 rounded-xl bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="snap-toggle" className="text-sm font-medium cursor-pointer">Snap to Grid</Label>
                    <div className="text-xs text-muted-foreground">
                      Align cards and groups to grid when dragging
                    </div>
                  </div>
                  <Switch
                    id="snap-toggle"
                    checked={settings?.snapToGrid ?? false}
                    onCheckedChange={async (checked) => {
                      await setSettings((current) => ({ ...current!, snapToGrid: checked }))
                    }}
                  />
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid-size" className="text-sm font-medium">Grid Size</Label>
                    <span className="text-sm font-semibold bg-primary/20 px-2.5 py-1 rounded-lg">{settings?.gridSize ?? 20}px</span>
                  </div>
                  <Slider
                    id="grid-size"
                    min={10}
                    max={50}
                    step={10}
                    value={[settings?.gridSize ?? 20]}
                    onValueChange={async (value) => {
                      await setSettings((current) => ({ ...current!, gridSize: value[0] }))
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground pl-1">
                    Controls both grid spacing and snap increment
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-5 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Account Security</h3>
              <div className="space-y-4 rounded-xl bg-card p-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for authentication to access the application
                  </p>
                </div>

                <div className="h-px bg-border my-4"></div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <p className="text-xs text-muted-foreground">
                      Leave blank to keep your current password
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-primary">🔒 Password Security Tips</p>
                    <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                      <li>• Use at least 8 characters (12+ recommended)</li>
                      <li>• Include uppercase, lowercase, numbers, and symbols</li>
                      <li>• Avoid common words and personal information</li>
                      <li>• Use a unique password for this application</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-accent text-sm mt-0.5">⚠️</span>
                  <span>
                    <strong className="text-foreground">Important:</strong> Passwords are hashed using PBKDF2 with 210,000 iterations and SHA-256. 
                    Make sure to remember your password as it cannot be recovered.
                  </span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-5 py-4">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-4 py-6">
                <Logo size={64} showText={false} animated={true} />
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent">
                    RelEye
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Relationship Network Visualizer</p>
                </div>
              </div>

              <div className="rounded-xl bg-card p-5 space-y-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Version</p>
                  <p className="text-xl font-semibold text-primary">{APP_VERSION}</p>
                </div>

                <div className="h-px bg-border my-4"></div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Made with ❤️ by</p>
                  <p className="text-lg font-semibold text-foreground">D Boestad</p>
                </div>

                <div className="h-px bg-border my-4"></div>

                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A secure, privacy-focused tool for visualizing and managing relationship networks. 
                    All data is encrypted and stored locally on your device.
                  </p>
                </div>

                <div className="h-px bg-border my-4"></div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Security Features</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-accent mt-0.5">🔐</span>
                      <div>
                        <span className="font-medium text-foreground">AES-256-GCM Encryption:</span>
                        <span className="text-muted-foreground"> Military-grade authenticated encryption with PBKDF2 key derivation</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-accent mt-0.5">💾</span>
                      <div>
                        <span className="font-medium text-foreground">Local Storage:</span>
                        <span className="text-muted-foreground"> No cloud sync, all data stays on your device</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-accent mt-0.5">🔑</span>
                      <div>
                        <span className="font-medium text-foreground">Password Protection:</span>
                        <span className="text-muted-foreground"> Files are encrypted with your password, no master key exists</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-gradient-to-r from-primary to-accent shadow-lg"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
