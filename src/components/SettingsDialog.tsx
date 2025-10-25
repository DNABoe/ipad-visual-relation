import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { hashPassword } from '@/lib/helpers'
import { Download, Upload, Moon, Sun } from '@phosphor-icons/react'
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
    showMinimap: boolean
  }>('app-settings', {
    username: 'admin',
    passwordHash: hashPassword('admin'),
    showGrid: true,
    snapToGrid: false,
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
  }

  const handleExport = () => {
    const data = JSON.stringify(workspace, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `network-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Workspace exported')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          onImport(data)
          toast.success('Workspace imported')
        } catch {
          toast.error('Invalid file format')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account and workspace
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle">Theme</Label>
                <div className="text-sm text-muted-foreground">
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
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Account</h3>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password (optional)</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Data Management</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download size={16} className="mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImport} className="flex-1">
                <Upload size={16} className="mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
