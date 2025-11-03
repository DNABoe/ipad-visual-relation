import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { hashPassword, type PasswordHash, verifyPassword } from '@/lib/auth'
import { toast } from 'sonner'
import type { Workspace, AppSettings } from '@/lib/types'
import { APP_VERSION } from '@/lib/version'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, SignOut, WindowsLogo, Shield } from '@phosphor-icons/react'
import { DEFAULT_APP_SETTINGS, DEFAULT_WORKSPACE_SETTINGS } from '@/lib/constants'
import { motion } from 'framer-motion'
import { FileIconDialog } from '@/components/FileIconDialog'
import { AdminDashboard } from '@/components/AdminDashboard'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
  setWorkspace: (update: Workspace | ((current: Workspace) => Workspace)) => void
  onLogout?: () => void
}

export function SettingsDialog({ open, onOpenChange, workspace, setWorkspace, onLogout }: SettingsDialogProps) {
  const [appSettings, setAppSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
  
  const [userCredentials, setUserCredentials] = useKV<{
    username: string
    passwordHash: PasswordHash
  } | null>('user-credentials', null)

  const [activeTab, setActiveTab] = useState('system')
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFileIconDialog, setShowFileIconDialog] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)

  const workspaceSettings = workspace.settings || DEFAULT_WORKSPACE_SETTINGS
  
  const currentUser = workspace.users?.find(u => u.username === userCredentials?.username)
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    console.log('[SettingsDialog] ====== Admin Check ======')
    console.log('[SettingsDialog] userCredentials:', userCredentials)
    console.log('[SettingsDialog] userCredentials.username:', userCredentials?.username)
    console.log('[SettingsDialog] workspace.users:', workspace.users)
    console.log('[SettingsDialog] workspace.users length:', workspace.users?.length)
    console.log('[SettingsDialog] currentUser:', currentUser)
    console.log('[SettingsDialog] currentUser?.role:', currentUser?.role)
    console.log('[SettingsDialog] isAdmin:', isAdmin)
    console.log('[SettingsDialog] Should show admin tab?', isAdmin ? 'YES' : 'NO')
    console.log('[SettingsDialog] ========================')
  }, [userCredentials, currentUser, isAdmin, workspace.users])

  useEffect(() => {
    if (userCredentials) {
      setUsername(userCredentials.username || '')
    }
  }, [userCredentials])

  const handleSaveUserSettings = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty')
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
      if (newPassword) {
        if (!currentPassword) {
          toast.error('Please enter your current password to change it')
          setIsSaving(false)
          return
        }

        if (!userCredentials?.passwordHash) {
          toast.error('Unable to verify current password')
          setIsSaving(false)
          return
        }

        const isCurrentPasswordValid = await verifyPassword(currentPassword, userCredentials.passwordHash)
        if (!isCurrentPasswordValid) {
          toast.error('Current password is incorrect')
          setIsSaving(false)
          return
        }

        const newHash = await hashPassword(newPassword)
        const newCreds = {
          username: username.trim(),
          passwordHash: newHash,
        }
        
        await window.spark.kv.set('user-credentials', newCreds)
        await new Promise(resolve => setTimeout(resolve, 300))
        setUserCredentials(() => newCreds)

        toast.success('Username and password updated successfully')
      } else {
        const newCreds = {
          ...userCredentials!,
          username: username.trim(),
        }
        
        await window.spark.kv.set('user-credentials', newCreds)
        await new Promise(resolve => setTimeout(resolve, 300))
        setUserCredentials(() => newCreds)

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

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1)
    setIsAnimating(true)
    
    const messages = [
      '👁️ Looking good!',
      '✨ Eyes on you!',
      '🎨 Nice click!',
      '🔮 Keeping an eye out!',
      '⚡ Eye see what you did there!',
      '🌟 Spectacular vision!',
      '💫 You found the secret!',
      '🎯 Bulls-eye!',
      '👀 I spy with my little eye...',
      '🚀 To infinity and beyond!'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    toast.success(randomMessage, {
      duration: 2000,
    })
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[680px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your system preferences and account
            <span className="block text-xs mt-1">
              User: {userCredentials?.username || 'Loading...'}
              {isAdmin && <span className="text-primary ml-2">● Admin</span>}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} flex-shrink-0`}>
            <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">System</TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">User</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">
                <Shield className="w-4 h-4 mr-1.5" />
                Admin
              </TabsTrigger>
            )}
            <TabsTrigger value="about" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground">About</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-1 pb-4">
              <TabsContent value="system" className="space-y-3 py-3 m-0">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Canvas Settings</h3>
                  <div className="space-y-3 rounded-xl bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="magnetic-snap-toggle" className="text-sm font-medium cursor-pointer">Magnetic Snap</Label>
                    <div className="text-xs text-muted-foreground">
                      Align cards and groups to grid when dragging
                    </div>
                  </div>
                  <Switch
                    id="magnetic-snap-toggle"
                    checked={workspaceSettings.magneticSnap}
                    onCheckedChange={(checked) => {
                      setWorkspace((current) => ({
                        ...current,
                        settings: {
                          ...DEFAULT_WORKSPACE_SETTINGS,
                          ...(current.settings || {}),
                          magneticSnap: checked
                        }
                      }))
                      toast.success(checked ? 'Magnetic snap enabled' : 'Magnetic snap disabled')
                    }}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-sm pt-1">Grid Settings</h3>
              <div className="space-y-3 rounded-xl bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show-grid-toggle" className="text-sm font-medium cursor-pointer">Show Grid</Label>
                    <div className="text-xs text-muted-foreground">
                      Display grid lines on the canvas
                    </div>
                  </div>
                  <Switch
                    id="show-grid-toggle"
                    checked={workspaceSettings.showGrid}
                    onCheckedChange={(checked) => {
                      setWorkspace((current) => ({
                        ...current,
                        settings: {
                          ...DEFAULT_WORKSPACE_SETTINGS,
                          ...(current.settings || {}),
                          showGrid: checked
                        }
                      }))
                      toast.success(checked ? 'Grid visible' : 'Grid hidden')
                    }}
                  />
                </div>
                
                {workspaceSettings.showGrid && (
                  <>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grid-opacity" className="text-sm font-medium">Grid Opacity</Label>
                        <span className="text-xs font-semibold bg-primary/20 px-2 py-0.5 rounded-md">{workspaceSettings.gridOpacity}%</span>
                      </div>
                      <Slider
                        id="grid-opacity"
                        min={5}
                        max={40}
                        step={5}
                        value={[workspaceSettings.gridOpacity]}
                        onValueChange={(value) => {
                          setWorkspace((current) => ({
                            ...current,
                            settings: {
                              ...DEFAULT_WORKSPACE_SETTINGS,
                              ...(current.settings || {}),
                              gridOpacity: value[0]
                            }
                          }))
                        }}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground pl-1">
                        Adjust the visibility of the grid lines
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grid-size" className="text-sm font-medium">Grid Size</Label>
                        <span className="text-xs font-semibold bg-primary/20 px-2 py-0.5 rounded-md">{workspaceSettings.gridSize}px</span>
                      </div>
                      <Slider
                        id="grid-size"
                        min={10}
                        max={50}
                        step={10}
                        value={[workspaceSettings.gridSize]}
                        onValueChange={(value) => {
                          setWorkspace((current) => ({
                            ...current,
                            settings: {
                              ...DEFAULT_WORKSPACE_SETTINGS,
                              ...(current.settings || {}),
                              gridSize: value[0]
                            }
                          }))
                        }}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground pl-1">
                        Controls both grid spacing and snap increment
                      </div>
                    </div>
                  </>
                )}
              </div>

              <h3 className="font-semibold text-sm pt-1">Connection Style</h3>
              <div className="space-y-3 rounded-xl bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="organic-toggle" className="text-sm font-medium cursor-pointer">Organic Lines</Label>
                    <div className="text-xs text-muted-foreground">
                      Use curved bezier connections for a more organic feel
                    </div>
                  </div>
                  <Switch
                    id="organic-toggle"
                    checked={workspaceSettings.organicLines}
                    onCheckedChange={(checked) => {
                      setWorkspace((current) => ({
                        ...current,
                        settings: {
                          ...DEFAULT_WORKSPACE_SETTINGS,
                          ...(current.settings || {}),
                          organicLines: checked
                        }
                      }))
                      toast.success(checked ? 'Organic lines enabled' : 'Organic lines disabled')
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-3 py-3 m-0">
            <div className="space-y-4">
              <div className="rounded-xl bg-card p-4 border-2 border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Administrator Panel</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage users, control access permissions, and monitor workspace activity
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setShowAdminDashboard(true)
                  }}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-accent shadow-lg"
                  size="lg"
                >
                  <Shield className="w-5 h-5" />
                  Open Admin Dashboard
                </Button>
              </div>

              <div className="rounded-xl bg-card p-4 space-y-3">
                <h4 className="font-semibold text-sm">Admin Capabilities</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Invite and manage workspace users</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Assign roles and permissions (Admin, Editor, Viewer)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Suspend or remove user access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Monitor workspace activity and changes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Generate secure invite links with email support</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-accent text-sm mt-0.5">💡</span>
                  <span>
                    The admin dashboard provides comprehensive user management tools. All user data is encrypted and stored securely in the cloud, while workspace files remain local-only.
                  </span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-3 py-3 m-0">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Workspace Role</h3>
              
              <div className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Current User</p>
                    <p className="text-xs text-muted-foreground">
                      Your role in this workspace
                    </p>
                  </div>
                  <div className="text-right">
                    {currentUser ? (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">
                          {currentUser.username}
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                          currentUser.role === 'admin' 
                            ? 'bg-accent/20 text-accent' 
                            : currentUser.role === 'editor'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary/20 text-secondary-foreground'
                        }`}>
                          {currentUser.role === 'admin' && '👑 '}
                          {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Loading...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-border my-2"></div>

              <h3 className="font-semibold text-sm">Account Security</h3>
              
              <div className="space-y-3 rounded-xl bg-card p-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
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
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? (
                          <Eye size={20} weight="regular" />
                        ) : (
                          <EyeSlash size={20} weight="regular" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <Eye size={20} weight="regular" />
                        ) : (
                          <EyeSlash size={20} weight="regular" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
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

              {onLogout && (
                <>
                  <div className="h-px bg-border my-2"></div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Session</h3>
                    <div className="rounded-xl bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Log Out</p>
                          <p className="text-xs text-muted-foreground">
                            End your current session and return to login
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false)
                            onLogout()
                          }}
                          className="gap-2"
                        >
                          <SignOut size={16} weight="regular" />
                          Log Out
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-3 py-3 m-0">
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center space-y-3 py-4">
                <motion.div
                  onClick={handleLogoClick}
                  className="cursor-pointer"
                  animate={isAnimating ? {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 0.9, 1.15, 0.95, 1],
                    y: [0, -20, 0, -10, 0],
                  } : {}}
                  transition={{
                    duration: 1,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                >
                  <motion.div
                    animate={isAnimating ? {
                      filter: [
                        'drop-shadow(0 0 0px oklch(0.88 0.18 185))',
                        'drop-shadow(0 0 20px oklch(0.88 0.18 185))',
                        'drop-shadow(0 0 40px oklch(0.88 0.18 185))',
                        'drop-shadow(0 0 20px oklch(0.88 0.18 185))',
                        'drop-shadow(0 0 0px oklch(0.88 0.18 185))',
                      ]
                    } : {}}
                    transition={{
                      duration: 1,
                      ease: "easeInOut",
                    }}
                  >
                    <Logo size={64} showText={false} animated={true} />
                  </motion.div>
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent">
                    RelEye
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Relationship Network Visualizer</p>
                </div>
              </div>

              <div className="rounded-xl bg-card p-4 space-y-3 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Version</p>
                  <p className="text-lg font-semibold text-primary">{APP_VERSION}</p>
                </div>

                <div className="h-px bg-border my-2"></div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Made with ❤️ by</p>
                  <p className="text-base font-semibold text-foreground">D Boestad</p>
                </div>

                <div className="h-px bg-border my-2"></div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A secure, privacy-focused tool for visualizing and managing relationship networks. 
                    All data is encrypted and stored locally on your device.
                  </p>
                </div>

                <div className="h-px bg-border my-2"></div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Security Features</p>
                  <div className="space-y-1.5 text-left">
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
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-accent mt-0.5">📥</span>
                      <div>
                        <span className="font-medium text-foreground">Direct Downloads:</span>
                        <span className="text-muted-foreground"> Files save directly to your Downloads folder when you click Save</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border my-2"></div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setShowFileIconDialog(true)}
                    variant="outline"
                    size="default"
                    className="w-full gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
                  >
                    <WindowsLogo size={20} weight="regular" />
                    Windows File Icon Setup
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Configure the RelEye icon for .enc.releye files in Windows
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="gap-2 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {activeTab === 'user' ? 'Cancel' : 'Close'}
          </Button>
          {activeTab === 'user' && (
            <Button 
              onClick={handleSaveUserSettings} 
              className="bg-gradient-to-r from-primary to-accent shadow-lg"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <FileIconDialog open={showFileIconDialog} onOpenChange={setShowFileIconDialog} />
      {isAdmin && currentUser && (
        <AdminDashboard
          open={showAdminDashboard}
          onOpenChange={setShowAdminDashboard}
          users={workspace.users || []}
          activityLog={workspace.activityLog || []}
          currentUserId={currentUser.userId}
          workspaceId={workspace.id || 'default-workspace'}
          onUpdateUsers={(updatedUsers) => {
            setWorkspace((current) => ({
              ...current,
              users: updatedUsers,
              modifiedAt: Date.now(),
              modifiedBy: currentUser.username
            }))
          }}
          onLogActivity={(log) => {
            setWorkspace((current) => ({
              ...current,
              activityLog: [...(current.activityLog || []), log],
              modifiedAt: Date.now(),
              modifiedBy: currentUser.username
            }))
          }}
        />
      )}
    </Dialog>
  )
}
