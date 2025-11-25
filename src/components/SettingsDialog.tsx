import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { hashPassword, verifyPassword, encryptApiKey, decryptApiKey, type UserCredentials } from '@/lib/auth'
import { toast } from 'sonner'
import type { Workspace, AppSettings } from '@/lib/types'
import { APP_VERSION } from '@/lib/version'
import { Logo } from '@/components/Logo'
import { Eye, EyeSlash, SignOut, WindowsLogo, Detective, Key, TrashSimple, Gear, User, Info } from '@phosphor-icons/react'
import { DEFAULT_APP_SETTINGS, DEFAULT_WORKSPACE_SETTINGS } from '@/lib/constants'
import { motion } from 'framer-motion'
import { FileIconDialog } from '@/components/FileIconDialog'
import { storage } from '@/lib/storage'
import { isPasswordChangeAllowed } from '@/lib/singleUserAuth'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
  setWorkspace: (update: Workspace | ((current: Workspace) => Workspace)) => void
  onLogout?: () => void
  initialTab?: string
}

export function SettingsDialog({ open, onOpenChange, workspace, setWorkspace, onLogout, initialTab }: SettingsDialogProps) {
  const [appSettings, setAppSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)
  
  const [userCredentials, setUserCredentials] = useState<UserCredentials | null>(null)
  
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true)

  const [activeTab, setActiveTab] = useState(initialTab || 'system')
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFileIconDialog, setShowFileIconDialog] = useState(false)

  const passwordChangeEnabled = isPasswordChangeAllowed()
  const workspaceSettings = workspace.settings || DEFAULT_WORKSPACE_SETTINGS
  
  useEffect(() => {
    if (open) {
      console.log('[SettingsDialog] Dialog opened, workspace.apiKey present:', !!workspace.apiKey)
      if (workspace.apiKey) {
        console.log('[SettingsDialog] API key length:', workspace.apiKey.length)
        setApiKey('')
      }
    }
  }, [open, workspace.apiKey])
  
  useEffect(() => {
    const loadCredentials = async () => {
      setIsLoadingCredentials(true)
      try {
        console.log('[SettingsDialog] Loading credentials from storage...')
        const creds = await storage.get<UserCredentials>('user-credentials')
        console.log('[SettingsDialog] Credentials loaded:', {
          hasCredentials: !!creds,
          hasUsername: !!creds?.username,
          hasPasswordHash: !!creds?.passwordHash,
          hasEncryptedApiKey: !!creds?.encryptedApiKey,
          hasApiKeySalt: !!creds?.apiKeySalt,
          hasApiKeyIv: !!creds?.apiKeyIv
        })
        setUserCredentials(creds || null)
      } catch (error) {
        console.error('[SettingsDialog] Failed to load credentials:', error)
      } finally {
        setIsLoadingCredentials(false)
      }
    }
    if (open) {
      loadCredentials()
    }
  }, [open])

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
        
        await storage.set('user-credentials', newCreds)
        await new Promise(resolve => setTimeout(resolve, 300))
        setUserCredentials(() => newCreds)

        toast.success('Username and password updated successfully')
      } else {
        const newCreds = {
          ...userCredentials!,
          username: username.trim(),
        }
        
        await storage.set('user-credentials', newCreds)
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
      <DialogContent className="max-w-2xl h-[680px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your system preferences and account
            {!isLoadingCredentials && (
              <span className="block text-xs mt-1">
                User: {userCredentials?.username || 'Not logged in'}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="w-full flex-shrink-0 h-auto p-1.5 gap-2 bg-muted/50">
            <TabsTrigger 
              value="system" 
              className="flex-1 min-w-0 px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Gear className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">System</span>
            </TabsTrigger>
            <TabsTrigger 
              value="investigation" 
              className="flex-1 min-w-0 px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Detective className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">Investigate</span>
            </TabsTrigger>
            <TabsTrigger 
              value="user" 
              className="flex-1 min-w-0 px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <User className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">User</span>
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="flex-1 min-w-0 px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Info className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">About</span>
            </TabsTrigger>
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

          <TabsContent value="investigation" className="space-y-3 py-3 m-0">
            <div className="space-y-4">
              <div className="rounded-xl bg-card p-4 border-2 border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Detective className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">AI Investigation</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your OpenAI API key for this network. The key is stored in the encrypted network file.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-card p-4 border border-border">
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key" className="text-sm font-medium flex items-center gap-2">
                    <Key size={16} />
                    OpenAI API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="openai-api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={workspace.apiKey ? '••••••••••••••••••••' : 'sk-...'}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showApiKey ? (
                        <Eye size={20} weight="regular" />
                      ) : (
                        <EyeSlash size={20} weight="regular" />
                      )}
                    </button>
                  </div>
                  {workspace.apiKey && (
                    <p className="text-xs text-success flex items-center gap-1.5">
                      <span>✓</span>
                      API key is configured for this network
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The API key is stored in the encrypted network file and will be available when you load this file.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={async () => {
                      if (!apiKey.trim()) {
                        toast.error('Please enter an API key')
                        return
                      }

                      if (!apiKey.trim().startsWith('sk-')) {
                        toast.error('Invalid OpenAI API key format. It should start with "sk-"')
                        return
                      }

                      try {
                        setIsLoadingApiKey(true)
                        console.log('[SettingsDialog] Saving API key to workspace...')
                        console.log('[SettingsDialog] API key format valid:', apiKey.trim().startsWith('sk-'))
                        console.log('[SettingsDialog] API key length:', apiKey.trim().length)
                        
                        setWorkspace((current) => ({
                          ...current,
                          apiKey: apiKey.trim()
                        }))
                        
                        setApiKey('')
                        
                        console.log('[SettingsDialog] API key saved to workspace')
                        toast.success('API key saved to network file! Remember to save your network file to persist this change.')
                      } catch (error) {
                        console.error('[SettingsDialog] Error saving API key:', error)
                        toast.error('Failed to save API key')
                      } finally {
                        setIsLoadingApiKey(false)
                      }
                    }}
                    disabled={isLoadingApiKey || !apiKey.trim()}
                    className="flex-1"
                  >
                    {isLoadingApiKey ? 'Saving...' : workspace.apiKey ? 'Update API Key' : 'Save API Key'}
                  </Button>
                  
                  {workspace.apiKey && (
                    <>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            setIsLoadingApiKey(true)
                            console.log('[SettingsDialog] Testing API key...')
                            
                            if (!workspace.apiKey) {
                              toast.error('No API key configured')
                              return
                            }
                            
                            const response = await fetch('https://api.openai.com/v1/models', {
                              method: 'GET',
                              headers: {
                                'Authorization': `Bearer ${workspace.apiKey.trim()}`
                              }
                            })
                            
                            if (response.ok) {
                              toast.success('API key is valid and working!')
                            } else if (response.status === 401) {
                              toast.error('API key is invalid or expired')
                            } else {
                              toast.error(`API test failed: ${response.status}`)
                            }
                          } catch (error) {
                            console.error('[SettingsDialog] Error testing API key:', error)
                            toast.error('Failed to test API key. Check console for details.')
                          } finally {
                            setIsLoadingApiKey(false)
                          }
                        }}
                        disabled={isLoadingApiKey}
                        className="px-4"
                      >
                        Test
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          try {
                            setWorkspace((current) => ({
                              ...current,
                              apiKey: undefined
                            }))
                            setApiKey('')
                            toast.success('API key removed from network')
                          } catch (error) {
                            console.error('Error removing API key:', error)
                            toast.error('Failed to remove API key')
                          }
                        }}
                        className="px-4"
                      >
                        <TrashSimple size={18} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-card p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="text-accent">ℹ️</span>
                  How to Get Your API Key
                </h4>
                <ol className="space-y-2 text-xs text-muted-foreground pl-4">
                  <li className="list-decimal">
                    Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a>
                  </li>
                  <li className="list-decimal">
                    Sign in to your OpenAI account (create one if needed)
                  </li>
                  <li className="list-decimal">
                    Click "Create new secret key"
                  </li>
                  <li className="list-decimal">
                    Copy the key, paste it above, and click Save
                  </li>
                </ol>
              </div>

              <div className="rounded-xl bg-card p-4 space-y-3">
                <h4 className="font-semibold text-sm">Investigation Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Generate professional intelligence briefs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Contextual analysis based on position and country</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Automatic PDF report generation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">Reports saved as attachments to person cards</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-warning text-sm mt-0.5">⚠️</span>
                  <span>
                    <strong className="text-foreground">Cost Notice:</strong> Using the OpenAI API incurs costs based on your usage. 
                    The investigation feature uses the GPT-4o-mini model. Check your OpenAI account for pricing details.
                  </span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-3 py-3 m-0">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Account Information</h3>
              
              <div className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Current User</p>
                    <p className="text-xs text-muted-foreground">
                      Your application account
                    </p>
                  </div>
                  <div className="text-right">
                    {isLoadingCredentials ? (
                      <div className="text-xs text-muted-foreground">
                        Loading...
                      </div>
                    ) : userCredentials ? (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">
                          {userCredentials.username}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No user
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
                    disabled={!passwordChangeEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {!passwordChangeEnabled 
                      ? 'Username is fixed in single-user mode'
                      : 'Used for authentication to access the application'}
                  </p>
                </div>

                <div className="h-px bg-border my-4"></div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    {!passwordChangeEnabled ? (
                      <p className="text-xs text-muted-foreground">
                        Password changes are currently disabled in single-user mode
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Leave blank to keep your current password
                      </p>
                    )}
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
                        disabled={!passwordChangeEnabled}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        disabled={!passwordChangeEnabled}
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
                        disabled={!passwordChangeEnabled}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        disabled={!passwordChangeEnabled}
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
                        disabled={!passwordChangeEnabled}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        disabled={!passwordChangeEnabled}
                      >
                        {showConfirmPassword ? (
                          <Eye size={20} weight="regular" />
                        ) : (
                          <EyeSlash size={20} weight="regular" />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordChangeEnabled && (
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-2">
                      <p className="text-xs font-medium text-primary">🔒 Password Security Tips</p>
                      <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                        <li>• Use at least 8 characters (12+ recommended)</li>
                        <li>• Include uppercase, lowercase, numbers, and symbols</li>
                        <li>• Avoid common words and personal information</li>
                        <li>• Use a unique password for this application</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {passwordChangeEnabled && (
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-accent text-sm mt-0.5">⚠️</span>
                    <span>
                      <strong className="text-foreground">Important:</strong> Passwords are hashed using PBKDF2 with 210,000 iterations and SHA-256. 
                      Make sure to remember your password as it cannot be recovered.
                    </span>
                  </p>
                </div>
              )}

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
          {activeTab === 'user' && passwordChangeEnabled && (
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
    </Dialog>
  )
}
