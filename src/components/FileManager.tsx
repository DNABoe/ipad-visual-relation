import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
import { Logo } from './Logo'
import type { Workspace } from '@/lib/types'
import { toast } from 'sonner'
import { generateSampleData } from '@/lib/sampleData'

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
      const newWorkspace: Workspace = includeSampleData
        ? generateSampleData()
        : { persons: [], connections: [], groups: [] }

      const workspaceJson = JSON.stringify(newWorkspace)
      const encrypted = await encryptData(workspaceJson, newPassword)

      const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const fullFileName = `${trimmedFileName}.enc.json`

      setCreatedNetwork({
        workspace: newWorkspace,
        fileName: fullFileName,
        password: newPassword,
        downloadUrl: url,
      })

      toast.success('Network created successfully!')
    } catch (error) {
      toast.error('Failed to create network')
      console.error(error)
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
      const workspace: Workspace = JSON.parse(decrypted)

      onLoad(workspace, loadingFile.name, loadPassword)
      toast.success('Network loaded successfully!')
    } catch (error) {
      toast.error('Failed to load network. Check your password.')
      console.error(error)
    }
  }

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
              <FilePlus size={32} className="text-white" weight="duotone" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Network Created Successfully!</h1>
              <p className="text-muted-foreground/80">Download your encrypted file to keep it safe</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <FilePlus size={24} className="text-white" weight="duotone" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium truncate">{createdNetwork.fileName}</p>
                    <p className="text-xs text-muted-foreground">Encrypted network file</p>
                  </div>
                </div>
              </div>

              <a
                href={createdNetwork.downloadUrl}
                download={createdNetwork.fileName}
                className="flex items-center justify-center gap-2 w-full h-14 bg-gradient-to-r from-primary via-primary/95 to-accent text-primary-foreground rounded-xl font-medium hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <DownloadSimple size={22} weight="bold" className="relative" />
                <span className="relative">Download {createdNetwork.fileName}</span>
              </a>

              <p className="text-xs text-muted-foreground text-center px-4">
                Right-click the button above and select <strong className="text-foreground">"Save link as..."</strong> if download doesn't start automatically
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
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
              <Button variant="outline" onClick={handleResetNewDialog} className="flex-1 h-11 border-2">
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-primary/8 to-accent/12">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        <div className="text-center space-y-6">
          <Logo size={80} showText={true} className="justify-center" />
        </div>

        <div className="space-y-5">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full h-20 text-lg bg-[oklch(0.42_0.12_250)] hover:bg-[oklch(0.38_0.14_250)] shadow-[0_8px_24px_-4px_oklch(0.42_0.12_250/0.4)] hover:shadow-[0_12px_32px_-4px_oklch(0.42_0.12_250/0.6)] transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <FilePlus size={28} className="mr-3 group-hover:scale-110 transition-transform duration-200" weight="duotone" />
            Generate New Network
          </Button>

          <Button
            onClick={() => setShowLoadDialog(true)}
            className="w-full h-20 text-lg bg-[oklch(0.42_0.12_250)] hover:bg-[oklch(0.38_0.14_250)] shadow-[0_8px_24px_-4px_oklch(0.42_0.12_250/0.4)] hover:shadow-[0_12px_32px_-4px_oklch(0.42_0.12_250/0.6)] transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <FolderOpen size={28} className="mr-3 group-hover:scale-110 transition-transform duration-200" weight="duotone" />
            Load Existing Network
          </Button>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 shadow-lg shadow-black/20 text-sm text-muted-foreground">
            <span className="text-accent text-base">🔒</span>
            <div className="text-left">
              <div className="font-medium text-foreground/90">AES-256-GCM encryption</div>
              <div className="text-xs">All data stored locally, nothing in the cloud</div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <FilePlus size={20} className="text-primary-foreground" weight="duotone" />
              </div>
              Create New Network
            </DialogTitle>
            <DialogDescription>
              Set up your encrypted relationship network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-filename" className="text-sm font-medium text-[oklch(0.82_0.015_250)]">File Name</Label>
              <Input
                id="new-filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-network"
                className="focus-visible:ring-primary focus-visible:ring-2 border-border h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPassword && newPasswordConfirm) {
                    handleCreateNetwork()
                  }
                }}
              />
              <p className="text-xs text-[oklch(0.58_0.020_250)] pl-1">
                Will be saved as: <span className="font-mono text-[oklch(0.82_0.015_250)]">{newFileName.trim() || 'my-network'}.enc.json</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-[oklch(0.82_0.015_250)]">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="focus-visible:ring-primary focus-visible:ring-2 border-border h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPasswordConfirm) {
                    handleCreateNetwork()
                  }
                }}
              />
              <p className="text-xs text-[oklch(0.58_0.020_250)] pl-1">
                Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password-confirm" className="text-sm font-medium text-[oklch(0.82_0.015_250)]">Confirm Password</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Confirm password"
                className="focus-visible:ring-primary focus-visible:ring-2 border-border h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNetwork()
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-[oklch(0.25_0.045_245)] border border-[oklch(0.35_0.040_248)]">
              <Checkbox
                id="include-sample"
                checked={includeSampleData}
                onCheckedChange={(checked) => setIncludeSampleData(checked === true)}
                className="border-primary/40"
              />
              <Label htmlFor="include-sample" className="text-sm cursor-pointer font-normal text-[oklch(0.78_0.015_250)]">
                Include sample data to explore features
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetNewDialog} className="border-2 h-11">
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
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <FolderOpen size={20} className="text-primary-foreground" weight="duotone" />
              </div>
              Load Existing Network
            </DialogTitle>
            <DialogDescription>
              Select your encrypted network file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="load-file" className="text-sm font-medium text-[oklch(0.82_0.015_250)]">Network File</Label>
              <Input
                id="load-file"
                type="file"
                accept=".json,.enc.json"
                className="cursor-pointer border-border h-11 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[oklch(0.42_0.12_250)] file:text-[oklch(0.88_0.012_255)] hover:file:bg-[oklch(0.38_0.14_250)] file:cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLoadingFile(file)
                  }
                }}
              />
              <p className="text-xs text-[oklch(0.58_0.020_250)] pl-1">
                Select your <span className="font-mono text-[oklch(0.82_0.015_250)]">.enc.json</span> file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="load-password" className="text-sm font-medium text-[oklch(0.82_0.015_250)]">Password</Label>
              <Input
                id="load-password"
                type="password"
                value={loadPassword}
                onChange={(e) => setLoadPassword(e.target.value)}
                placeholder="Enter your password"
                className="focus-visible:ring-primary focus-visible:ring-2 border-border h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadNetwork()
                  }
                }}
              />
            </div>

            <div className="text-center p-4 rounded-xl bg-[oklch(0.25_0.045_245)] border border-border">
              <p className="text-xs text-[oklch(0.62_0.025_250)] flex items-center justify-center gap-2">
                <span className="text-accent text-sm">🔒</span>
                <span>All decryption happens locally in your browser</span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetLoadDialog} className="border-2 h-11">
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
