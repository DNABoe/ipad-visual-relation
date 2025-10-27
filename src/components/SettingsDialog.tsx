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
import { toast } from 'sonner'
import type { Workspace } from '@/lib/types'

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
      <DialogContent className="max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your system preferences and account
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">System</TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-5 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Canvas Settings</h3>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
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
                    onCheckedChange={(checked) => setSettings((current) => ({ ...current!, snapToGrid: checked }))}
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
                    onValueChange={(value) => setSettings((current) => ({ ...current!, gridSize: value[0] }))}
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
              <h3 className="font-semibold text-sm">Account</h3>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password (optional)</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only enter a new password if you want to change it
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent shadow-lg">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
