import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import { FilePlus, FolderOpen, DownloadSimple, UsersThree } from '@phosphor-icons/react'
import { Logo } from './Logo'
import type { Workspace } from '@/lib/types'
import { toast } from 'sonner'
import { generateSampleData } from '@/lib/sampleData'
import { APP_VERSION } from '@/lib/version'
import { serializeWorkspace, deserializeWorkspace } from '@/lib/helpers'
import { DEFAULT_WORKSPACE_SETTINGS } from '@/lib/constants'
import { createFileIconDataUrl } from '@/lib/fileIcon'
import * as SingleUserAuth from '@/lib/singleUserAuth'

interface FileManagerProps {
  onLoad: (workspace: Workspace, fileName: string, password: string) => void
}

interface CreatedNetwork {
  workspace: Workspace
  fileName: string
  password: string
  downloadUrl: string
}

export function FileManager({ onLoad }: FileManagerProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [includeSampleData, setIncludeSampleData] = useState(true)
  const [loadingFile, setLoadingFile] = useState<File | null>(null)
  const [loadPassword, setLoadPassword] = useState('')
  const [createdNetwork, setCreatedNetwork] = useState<CreatedNetwork | null>(null)

  const handleResetNewDialog = useCallback(() => {
    setShowNewDialog(false)
    setNewFileName('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setIncludeSampleData(true)
    setCreatedNetwork(null)
  }, [])

  const handleResetLoadDialog = useCallback(() => {
    setShowLoadDialog(false)
    setLoadPassword('')
    setLoadingFile(null)
  }, [])

  const handleCreateNetwork = async () => {
    const trimmedFileName = newFileName.trim() || 'my-network'

    if (!newPassword) {
      toast.error('Please enter a password')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      const currentUser = await SingleUserAuth.getCurrentSession()
      
      console.log('[FileManager] Current user:', currentUser)
      
      if (!currentUser) {
        console.error('[FileManager] No current user found')
        toast.error('User session not found. Please refresh the page.')
        return
      }

      console.log('[FileManager] Creating new workspace for user:', currentUser.username)
      
      const workspaceId = `workspace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      
      const baseWorkspace: Workspace = includeSampleData
        ? generateSampleData()
        : { 
            persons: [], 
            connections: [], 
            groups: [], 
            collapsedBranches: [],
            settings: DEFAULT_WORKSPACE_SETTINGS
          }
      
      const newWorkspace: Workspace = {
        ...baseWorkspace,
        id: workspaceId,
        name: trimmedFileName,
        ownerId: currentUser.userId,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      }
      
      console.log('[FileManager] New workspace created for owner:', currentUser.username)

      console.log('[FileManager] Serializing workspace...')
      const workspaceJson = serializeWorkspace(newWorkspace)
      
      console.log('[FileManager] Encrypting workspace...')
      const encrypted = await encryptData(workspaceJson, newPassword)

      console.log('[FileManager] Creating download blob...')
      const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const fullFileName = trimmedFileName.endsWith('.enc.releye')
        ? trimmedFileName
        : `${trimmedFileName}.enc.releye`

      console.log('[FileManager] Network created successfully!')
      setCreatedNetwork({
        workspace: newWorkspace,
        fileName: fullFileName,
        password: newPassword,
        downloadUrl: url,
      })

      toast.success('Network created successfully!')
    } catch (error) {
      console.error('[FileManager] Error creating network:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create network'
      toast.error(`Failed to create network: ${errorMessage}`)
    }
  }

  const handleLoadNetwork = async () => {
    if (!loadingFile) {
      toast.error('Please select a file')
      return
    }

    if (!loadPassword) {
      toast.error('Please enter a password')
      return
    }

    try {
      const fileContent = await loadingFile.text()
      const encrypted: EncryptedData = JSON.parse(fileContent)
      const decrypted = await decryptData(encrypted, loadPassword)
      const workspace: Workspace = deserializeWorkspace(decrypted)

      if (!workspace.id) {
        workspace.id = `workspace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      if (!workspace.name) {
        workspace.name = loadingFile.name.replace('.enc.releye', '')
      }

      onLoad(workspace, loadingFile.name, loadPassword)
      toast.success('Network loaded successfully!')
    } catch (error) {
      toast.error('Failed to load network. Check your password.')
      console.error(error)
    }
  }

  const handleDownloadClick = useCallback(() => {
    if (!createdNetwork) return
    toast.info('Right-click the download link and select "Save Link As..." to save your file')
  }, [createdNetwork])

  const handleContinueWithoutDownload = useCallback(() => {
    if (!createdNetwork) return
    onLoad(createdNetwork.workspace, createdNetwork.fileName, createdNetwork.password)
  }, [createdNetwork, onLoad])

  useEffect(() => {
    return () => {
      if (createdNetwork?.downloadUrl) {
        URL.revokeObjectURL(createdNetwork.downloadUrl)
      }
    }
  }, [createdNetwork])

  if (createdNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-primary/8 to-accent/12">
        <div className="relative w-full max-w-2xl space-y-8 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-2">
              <UsersThree size={32} className="text-primary-foreground" weight="duotone" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Network Created Successfully!</h1>
              <p className="text-muted-foreground">Download your encrypted file to keep it safe</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                    <img src={createFileIconDataUrl()} alt="RelEye File Icon" className="w-12 h-12" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium truncate">{createdNetwork.fileName}</p>
                    <p className="text-xs text-muted-foreground">Encrypted network file</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-xl border border-border space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DownloadSimple size={18} weight="bold" className="text-primary" />
                  How to Save Your File
                </h3>
                <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                  <li>Right-click on the download link below</li>
                  <li>Select <span className="font-medium text-foreground">"Save Link As..."</span> from the menu</li>
                  <li>Choose where to save your encrypted file</li>
                  <li>Click the <span className="font-medium text-foreground">Continue</span> button to start working</li>
                </ol>
                
                <div className="pt-2 flex justify-center">
                  <a
                    href={createdNetwork.downloadUrl}
                    download={createdNetwork.fileName}
                    className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all duration-300 active:scale-[0.98] shadow-lg"
                  >
                    <DownloadSimple size={22} weight="bold" />
                    <span className="font-mono">{createdNetwork.fileName}</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="text-accent">🔒</span>
                Security & Important Information
              </h3>
              <ul className="text-xs text-muted-foreground leading-relaxed space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Keep your password safe!</strong> If you lose it, your data cannot be recovered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Your file is encrypted with AES-256-GCM encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Store the file in a secure location (USB drive, cloud storage, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You can continue working without downloading (not recommended)</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleResetNewDialog} className="flex-1 h-11">
                Cancel
              </Button>
              <Button onClick={handleContinueWithoutDownload} className="flex-1 h-11 bg-gradient-to-r from-primary to-accent">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        <div className="text-center space-y-6">
          <Logo size={120} showText={true} className="justify-center" />
        </div>

        <div className="space-y-5">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full h-20 text-lg bg-primary hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
            size="lg"
          >
            <UsersThree size={28} className="mr-3 group-hover:scale-110 transition-transform duration-200" weight="duotone" />
            Generate New Network
          </Button>

          <Button
            onClick={() => setShowLoadDialog(true)}
            className="w-full h-20 text-lg bg-primary hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
            size="lg"
          >
            <FolderOpen size={28} className="mr-3 group-hover:scale-110 transition-transform duration-200" weight="duotone" />
            Load Existing Network
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card shadow-lg text-sm text-muted-foreground">
            <span className="text-accent text-base">🔒</span>
            <div className="text-left">
              <div className="font-medium text-foreground">AES-256-GCM encryption</div>
              <div className="text-xs">All data stored locally, nothing in the cloud</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {APP_VERSION}
          </div>
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md shadow-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <Logo size={64} showText={false} animated={true} />
            </div>
            <DialogTitle className="flex items-center gap-2 text-xl justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <UsersThree size={20} className="text-primary-foreground" weight="duotone" />
              </div>
              Create New Network
            </DialogTitle>
            <DialogDescription className="text-center">
              Set up your encrypted relationship network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-filename" className="text-sm font-medium">File Name</Label>
              <Input
                id="new-filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-network"
                className="focus-visible:ring-primary focus-visible:ring-2 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPassword && newPasswordConfirm) {
                    handleCreateNetwork()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground pl-1">
                Will be saved as: <span className="font-mono text-foreground">{(newFileName.trim() || 'my-network').endsWith('.enc.releye') ? newFileName.trim() || 'my-network' : `${newFileName.trim() || 'my-network'}.enc.releye`}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="focus-visible:ring-primary focus-visible:ring-2 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPasswordConfirm) {
                    handleCreateNetwork()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground pl-1">
                Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password-confirm" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Confirm password"
                className="focus-visible:ring-primary focus-visible:ring-2 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNetwork()
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-muted">
              <Checkbox
                id="include-sample"
                checked={includeSampleData}
                onCheckedChange={(checked) => setIncludeSampleData(checked === true)}
              />
              <Label htmlFor="include-sample" className="text-sm cursor-pointer font-normal">
                Include sample data to explore features
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetNewDialog} className="h-11">
              Cancel
            </Button>
            <Button onClick={handleCreateNetwork} className="bg-gradient-to-r from-primary to-accent h-11 shadow-lg">
              Create Network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-md shadow-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <Logo size={64} showText={false} animated={true} />
            </div>
            <DialogTitle className="flex items-center gap-2 text-xl justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <FolderOpen size={20} className="text-primary-foreground" weight="duotone" />
              </div>
              Load Existing Network
            </DialogTitle>
            <DialogDescription className="text-center">
              Select your encrypted network file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="load-file" className="text-sm font-medium">Network File</Label>
              <Input
                id="load-file"
                type="file"
                accept=".enc.releye,.enc.json"
                className="cursor-pointer h-11 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLoadingFile(file)
                  }
                }}
              />
              <p className="text-xs text-muted-foreground pl-1">
                Select your <span className="font-mono text-foreground">.enc.releye</span> file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="load-password" className="text-sm font-medium">Password</Label>
              <Input
                id="load-password"
                type="password"
                value={loadPassword}
                onChange={(e) => setLoadPassword(e.target.value)}
                placeholder="Enter your password"
                className="focus-visible:ring-primary focus-visible:ring-2 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadNetwork()
                  }
                }}
              />
            </div>

            <div className="text-center p-4 rounded-xl bg-muted">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="text-accent text-sm">🔒</span>
                <span>All decryption happens locally in your browser</span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetLoadDialog} className="h-11">
              Cancel
            </Button>
            <Button onClick={handleLoadNetwork} className="bg-gradient-to-r from-primary to-accent h-11 shadow-lg">
              Load Network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
