import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { hashPassword } from '@/lib/helpers'
import { Moon, Sun } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Workspace } from '@/lib/types'
import { useTheme } from '@/hooks/use-theme'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
  onImport: (workspace: Workspace) => void
}

export function SettingsDialog({ open, onOpenChange, workspace, onImport }: SettingsDialogProps) {
  const [settings, setSettings] = useKV<{
    username: string
    passwordHash: string
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    showMinimap: boolean
  }>('app-settings', {
    username: 'admin',
    passwordHash: hashPassword('admin'),
    showGrid: true,
    snapToGrid: false,
    gridSize: 20,
    showMinimap: true,
  })

  const { theme, setTheme } = useTheme()

  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (settings) {
      setUsername(settings.username)
    }
  }, [settings])

  const handleSave = () => {
    if (!username.trim()) return

    setSettings((current) => ({
      ...current!,
      username: username.trim(),
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    }))

    toast.success('Settings saved')
    setCurrentPassword('')
    setNewPassword('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your system preferences and account
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-4 py-4">
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Appearance</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme-toggle" className="dark:text-foreground">Theme</Label>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun size={16} className={theme === 'light' ? 'text-foreground' : 'text-muted-foreground'} />
                  <Switch
                    id="theme-toggle"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                  <Moon size={16} className={theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="snap-toggle" className="dark:text-foreground">Snap to Grid</Label>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Align cards and groups to grid when dragging
                    </div>
                  </div>
                  <Switch
                    id="snap-toggle"
                    checked={settings?.snapToGrid ?? false}
                    onCheckedChange={(checked) => setSettings((current) => ({ ...current!, snapToGrid: checked }))}
                  />
                </div>
                
                <div className="space-y-2 pl-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid-size" className="dark:text-foreground">Grid Size</Label>
                    <span className="text-sm font-medium text-foreground">{settings?.gridSize ?? 20}px</span>
                  </div>
                  <Slider
                    id="grid-size"
                    min={10}
                    max={50}
                    step={10}
                    value={[settings?.gridSize ?? 20]}
                    onValueChange={(value) => setSettings((current) => ({ ...current!, gridSize: value[0] }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                    Controls both grid spacing and snap increment
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-4 py-4">
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Account</h3>
              <div className="space-y-2">
                <Label htmlFor="username" className="dark:text-foreground">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="dark:text-foreground">New Password (optional)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
