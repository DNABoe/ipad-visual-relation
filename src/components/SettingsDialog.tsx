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
import { Eye, EyeSlash, SignOut, WindowsLogo, Detective, Key, TrashSimple, Gear, User, Info, Sparkle, Broadcast } from '@phosphor-icons/react'
import { DEFAULT_APP_SETTINGS, DEFAULT_WORKSPACE_SETTINGS } from '@/lib/constants'
import { motion } from 'framer-motion'
import { FileIconDialog } from '@/components/FileIconDialog'
import { CORSProxyConfig } from '@/components/CORSProxyConfig'
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
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showPerplexityKey, setShowPerplexityKey] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [perplexityApiKey, setPerplexityApiKey] = useState('')
  const [claudeApiKey, setClaudeApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFileIconDialog, setShowFileIconDialog] = useState(false)
  const [showCORSProxyDialog, setShowCORSProxyDialog] = useState(false)

  const passwordChangeEnabled = isPasswordChangeAllowed()
  const workspaceSettings = workspace.settings || DEFAULT_WORKSPACE_SETTINGS
  
  useEffect(() => {
    if (!open) {
      setOpenaiApiKey('')
      setPerplexityApiKey('')
      setClaudeApiKey('')
      setGeminiApiKey('')
    }
  }, [open])
  
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure AI providers for intelligence report generation. Each provider requires its own unique API key.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Multiple providers can be enabled simultaneously. Each API key field is independent and specific to its provider.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct API Mode Toggle */}
              <div className="space-y-3 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 p-4 border-2 border-accent/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Broadcast className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          Direct API Mode
                          <span className="text-xs font-normal bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-md">FAST</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bypass CORS proxies for faster investigation reports
                        </p>
                      </div>
                      <Switch
                        checked={workspaceSettings.useDirectAPIMode || false}
                        onCheckedChange={(checked) => {
                          setWorkspace((current) => ({
                            ...current,
                            settings: {
                              ...DEFAULT_WORKSPACE_SETTINGS,
                              ...(current.settings || {}),
                              useDirectAPIMode: checked
                            }
                          }))
                          toast.success(
                            checked 
                              ? 'Direct API mode enabled - faster investigations' 
                              : 'Using CORS proxy mode for compatibility', 
                            { duration: 3000 }
                          )
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground bg-card/50 rounded-lg p-2.5 mt-2 space-y-1.5">
                      <p className="flex items-start gap-2">
                        <span className="text-success font-semibold mt-0.5">✓</span>
                        <span><strong>Direct mode:</strong> Fastest - calls API providers directly without intermediary servers</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-warning font-semibold mt-0.5">⚠</span>
                        <span><strong>Proxy mode:</strong> Slower but more compatible - routes through CORS proxy servers</span>
                      </p>
                      <p className="text-xs mt-2 text-muted-foreground/80 italic">
                        Note: Some browsers/networks may block direct API calls. If investigations fail, disable this option.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* OpenAI Configuration */}
              <div className="space-y-3 rounded-xl bg-card p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#10a37f] to-[#1a7f64]" />
                    <h4 className="font-semibold text-sm">OpenAI (GPT-4)</h4>
                  </div>
                  <Switch
                    checked={workspace.llmConfigs?.find(c => c.provider === 'openai')?.enabled || false}
                    onCheckedChange={(checked) => {
                      const configs = workspace.llmConfigs || []
                      const existing = configs.find(c => c.provider === 'openai')
                      
                      if (existing) {
                        setWorkspace(current => ({
                          ...current,
                          llmConfigs: configs.map(c => 
                            c.provider === 'openai' ? { ...c, enabled: checked } : c
                          )
                        }))
                      }
                      toast.success(checked ? 'OpenAI enabled' : 'OpenAI disabled')
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key" className="text-sm font-medium flex items-center gap-2">
                    <Key size={16} />
                    OpenAI API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="openai-api-key"
                      type={showOpenAIKey ? "text" : "password"}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder={workspace.llmConfigs?.find(c => c.provider === 'openai')?.apiKey ? '••••••••••••••••••••' : 'sk-proj-...'}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showOpenAIKey ? (
                        <Eye size={20} weight="regular" />
                      ) : (
                        <EyeSlash size={20} weight="regular" />
                      )}
                    </button>
                  </div>
                  {workspace.llmConfigs?.find(c => c.provider === 'openai')?.apiKey && (
                    <p className="text-xs text-success flex items-center gap-1.5">
                      <span>✓</span>
                      API key configured
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (!openaiApiKey.trim()) {
                      toast.error('Please enter an API key')
                      return
                    }
                    if (!openaiApiKey.trim().startsWith('sk-')) {
                      toast.error('Invalid OpenAI API key format. It should start with "sk-"')
                      return
                    }

                    const configs = workspace.llmConfigs || []
                    const existing = configs.find(c => c.provider === 'openai')
                    
                    if (existing) {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: configs.map(c => 
                          c.provider === 'openai' ? { ...c, apiKey: openaiApiKey.trim(), enabled: true } : c
                        )
                      }))
                    } else {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: [...configs, { provider: 'openai', apiKey: openaiApiKey.trim(), enabled: true }]
                      }))
                    }
                    
                    setOpenaiApiKey('')
                    toast.success('OpenAI API key saved!', { duration: 3000 })
                  }}
                  disabled={!openaiApiKey.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Key size={16} className="mr-2" />
                  Save OpenAI Key
                </Button>
              </div>

              {/* Perplexity Configuration */}
              <div className="space-y-3 rounded-xl bg-card p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#20808d] to-[#1a6b76]" />
                    <h4 className="font-semibold text-sm">Perplexity AI</h4>
                  </div>
                  <Switch
                    checked={workspace.llmConfigs?.find(c => c.provider === 'perplexity')?.enabled || false}
                    onCheckedChange={(checked) => {
                      const configs = workspace.llmConfigs || []
                      const existing = configs.find(c => c.provider === 'perplexity')
                      
                      if (existing) {
                        setWorkspace(current => ({
                          ...current,
                          llmConfigs: configs.map(c => 
                            c.provider === 'perplexity' ? { ...c, enabled: checked } : c
                          )
                        }))
                      }
                      toast.success(checked ? 'Perplexity enabled' : 'Perplexity disabled')
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perplexity-api-key" className="text-sm font-medium flex items-center gap-2">
                    <Key size={16} />
                    Perplexity API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="perplexity-api-key"
                      type={showPerplexityKey ? "text" : "password"}
                      value={perplexityApiKey}
                      onChange={(e) => setPerplexityApiKey(e.target.value)}
                      placeholder={workspace.llmConfigs?.find(c => c.provider === 'perplexity')?.apiKey ? '••••••••••••••••••••' : 'pplx-...'}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPerplexityKey(!showPerplexityKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPerplexityKey ? (
                        <Eye size={20} weight="regular" />
                      ) : (
                        <EyeSlash size={20} weight="regular" />
                      )}
                    </button>
                  </div>
                  {workspace.llmConfigs?.find(c => c.provider === 'perplexity')?.apiKey && (
                    <p className="text-xs text-success flex items-center gap-1.5">
                      <span>✓</span>
                      API key configured
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">perplexity.ai</a>
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (!perplexityApiKey.trim()) {
                      toast.error('Please enter an API key')
                      return
                    }
                    if (!perplexityApiKey.trim().startsWith('pplx-')) {
                      toast.error('Invalid Perplexity API key format. It should start with "pplx-"')
                      return
                    }

                    const configs = workspace.llmConfigs || []
                    const existing = configs.find(c => c.provider === 'perplexity')
                    
                    if (existing) {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: configs.map(c => 
                          c.provider === 'perplexity' ? { ...c, apiKey: perplexityApiKey.trim(), enabled: true } : c
                        )
                      }))
                    } else {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: [...configs, { provider: 'perplexity', apiKey: perplexityApiKey.trim(), enabled: true }]
                      }))
                    }
                    
                    setPerplexityApiKey('')
                    toast.success('Perplexity API key saved!', { duration: 3000 })
                  }}
                  disabled={!perplexityApiKey.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Key size={16} className="mr-2" />
                  Save Perplexity Key
                </Button>
              </div>

              {/* Claude Configuration */}
              <div className="space-y-3 rounded-xl bg-card p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#cc785c] to-[#b36550]" />
                    <h4 className="font-semibold text-sm">Claude (Anthropic)</h4>
                  </div>
                  <Switch
                    checked={workspace.llmConfigs?.find(c => c.provider === 'claude')?.enabled || false}
                    onCheckedChange={(checked) => {
                      const configs = workspace.llmConfigs || []
                      const existing = configs.find(c => c.provider === 'claude')
                      
                      if (existing) {
                        setWorkspace(current => ({
                          ...current,
                          llmConfigs: configs.map(c => 
                            c.provider === 'claude' ? { ...c, enabled: checked } : c
                          )
                        }))
                      }
                      toast.success(checked ? 'Claude enabled' : 'Claude disabled')
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claude-api-key" className="text-sm font-medium flex items-center gap-2">
                    <Key size={16} />
                    Claude API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="claude-api-key"
                      type={showClaudeKey ? "text" : "password"}
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      placeholder={workspace.llmConfigs?.find(c => c.provider === 'claude')?.apiKey ? '••••••••••••••••••••' : 'sk-ant-api03-...'}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClaudeKey(!showClaudeKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showClaudeKey ? (
                        <Eye size={20} weight="regular" />
                      ) : (
                        <EyeSlash size={20} weight="regular" />
                      )}
                    </button>
                  </div>
                  {workspace.llmConfigs?.find(c => c.provider === 'claude')?.apiKey && (
                    <p className="text-xs text-success flex items-center gap-1.5">
                      <span>✓</span>
                      API key configured
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (!claudeApiKey.trim()) {
                      toast.error('Please enter an API key')
                      return
                    }
                    if (!claudeApiKey.trim().startsWith('sk-ant-')) {
                      toast.error('Invalid Claude API key format. It should start with "sk-ant-"')
                      return
                    }

                    const configs = workspace.llmConfigs || []
                    const existing = configs.find(c => c.provider === 'claude')
                    
                    if (existing) {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: configs.map(c => 
                          c.provider === 'claude' ? { ...c, apiKey: claudeApiKey.trim(), enabled: true } : c
                        )
                      }))
                    } else {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: [...configs, { provider: 'claude', apiKey: claudeApiKey.trim(), enabled: true }]
                      }))
                    }
                    
                    setClaudeApiKey('')
                    toast.success('Claude API key saved!', { duration: 3000 })
                  }}
                  disabled={!claudeApiKey.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Key size={16} className="mr-2" />
                  Save Claude Key
                </Button>
              </div>

              {/* Gemini Configuration */}
              <div className="space-y-3 rounded-xl bg-card p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#4285f4] to-[#34a853]" />
                    <h4 className="font-semibold text-sm">Google Gemini</h4>
                  </div>
                  <Switch
                    checked={workspace.llmConfigs?.find(c => c.provider === 'gemini')?.enabled || false}
                    onCheckedChange={(checked) => {
                      const configs = workspace.llmConfigs || []
                      const existing = configs.find(c => c.provider === 'gemini')
                      
                      if (existing) {
                        setWorkspace(current => ({
                          ...current,
                          llmConfigs: configs.map(c => 
                            c.provider === 'gemini' ? { ...c, enabled: checked } : c
                          )
                        }))
                      }
                      toast.success(checked ? 'Gemini enabled' : 'Gemini disabled')
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemini-api-key" className="text-sm font-medium flex items-center gap-2">
                    <Key size={16} />
                    Gemini API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="gemini-api-key"
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder={workspace.llmConfigs?.find(c => c.provider === 'gemini')?.apiKey ? '••••••••••••••••••••' : 'AIzaSy...'}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showGeminiKey ? (
                        <Eye size={20} weight="regular" />
                      ) : (
                        <EyeSlash size={20} weight="regular" />
                      )}
                    </button>
                  </div>
                  {workspace.llmConfigs?.find(c => c.provider === 'gemini')?.apiKey && (
                    <p className="text-xs text-success flex items-center gap-1.5">
                      <span>✓</span>
                      API key configured
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (!geminiApiKey.trim()) {
                      toast.error('Please enter an API key')
                      return
                    }
                    if (!geminiApiKey.trim().startsWith('AIza')) {
                      toast.error('Invalid Gemini API key format. It should start with "AIza"')
                      return
                    }

                    const configs = workspace.llmConfigs || []
                    const existing = configs.find(c => c.provider === 'gemini')
                    
                    if (existing) {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: configs.map(c => 
                          c.provider === 'gemini' ? { ...c, apiKey: geminiApiKey.trim(), enabled: true } : c
                        )
                      }))
                    } else {
                      setWorkspace(current => ({
                        ...current,
                        llmConfigs: [...configs, { provider: 'gemini', apiKey: geminiApiKey.trim(), enabled: true }]
                      }))
                    }
                    
                    setGeminiApiKey('')
                    toast.success('Gemini API key saved!', { duration: 3000 })
                  }}
                  disabled={!geminiApiKey.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Key size={16} className="mr-2" />
                  Save Gemini Key
                </Button>
              </div>

              {/* Status Summary */}
              <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkle size={16} className="text-primary" />
                  Active Providers
                </h4>
                <div className="space-y-2 text-xs">
                  {workspace.llmConfigs?.filter(c => c.enabled).length === 0 ? (
                    <p className="text-muted-foreground italic">No providers enabled. Add an API key above to get started.</p>
                  ) : (
                    workspace.llmConfigs?.filter(c => c.enabled).map(config => (
                      <div key={config.provider} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="capitalize font-medium">{config.provider}</span>
                        <span className="text-muted-foreground">• Enabled</span>
                      </div>
                    ))
                  )}
                </div>
                {(workspace.llmConfigs?.filter(c => c.enabled).length || 0) > 0 && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                    When multiple providers are enabled, the system will use them in priority order: Gemini → Claude → Perplexity → OpenAI
                  </p>
                )}
              </div>

              {/* CORS Proxy Configuration */}
              <div className="rounded-xl bg-card p-4 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Broadcast className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">API Connection Settings</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure how RelEye connects to AI providers. Use direct API mode or select CORS proxy options for browser compatibility.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCORSProxyDialog(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Broadcast size={16} className="mr-2" />
                  Configure API Connection
                </Button>
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
      <CORSProxyConfig open={showCORSProxyDialog} onOpenChange={setShowCORSProxyDialog} />
    </Dialog>
  )
}
