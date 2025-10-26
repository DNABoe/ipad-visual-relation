import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'
import { generateSampleData } from '@/lib/sampleData'
import { Logo } from '@/components/Logo'

interface FileManagerProps {
  onLoad: (workspace: Workspace, fileName: string, password: string) => void
}

export function FileManager({ onLoad }: FileManagerProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loadPassword, setLoadPassword] = useState('')
  const [loadingFile, setLoadingFile] = useState<File | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>('')
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string>('')
  const [createdName, setCreatedName] = useState<string>('')
  const [includeSampleData, setIncludeSampleData] = useState(false)

  const handleNewNetwork = async () => {
    if (!newFileName.trim()) {
      toast.error('Please enter a file name')
      return
    }
    if (!newPassword) {
      toast.error('Please enter a password')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error('Passwords do not match')
      return
    }

    const newWorkspace: Workspace = includeSampleData 
      ? generateSampleData()
      : {
          persons: [],
          connections: [],
          groups: []
        }

    try {
      const workspaceJson = JSON.stringify(newWorkspace, null, 2)
      const encrypted = await encryptData(workspaceJson, newPassword)
      const fileData = JSON.stringify(encrypted, null, 2)
      const fileName = newFileName.trim()
      const fullFileName = `${fileName}.enc.json`

      const blob = new Blob([fileData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      setDownloadUrl(url)
      setDownloadFileName(fullFileName)
      setCreatedWorkspace(newWorkspace)
      setCreatedPassword(newPassword)
      setCreatedName(fileName)
      
      console.log(`✅ File ready for download!`)
      console.log(`📦 File: ${fullFileName}`)
      console.log(`📊 Size: ${blob.size} bytes (${(blob.size / 1024).toFixed(2)} KB)`)
      console.log(`🔐 Encrypted with AES-256-GCM`)

      toast.success('Network file ready!', {
        description: `Click the download button to save ${fullFileName} (${(blob.size / 1024).toFixed(2)} KB)`
      })

      setShowNewDialog(false)
      setNewFileName('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setIncludeSampleData(false)
    } catch (error) {
      toast.error('Failed to create network file')
      console.error('Error creating network:', error)
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

      const fileName = loadingFile.name.replace('.enc.json', '')
      onLoad(workspace, fileName, loadPassword)
      setShowLoadDialog(false)
      setLoadingFile(null)
      setLoadPassword('')
      toast.success('Network loaded and decrypted successfully', {
        description: 'Your data is now decrypted in memory for editing.'
      })
    } catch (error) {
      toast.error('Incorrect password or corrupted file', {
        description: 'Please verify your password and try again. Decryption failed.'
      })
      console.error(error)
    }
  }

  const handleContinueWithoutDownload = () => {
    if (createdWorkspace && createdName && createdPassword) {
      onLoad(createdWorkspace, createdName, createdPassword)
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }
      setDownloadUrl(null)
      setDownloadFileName('')
      setCreatedWorkspace(null)
      setCreatedPassword('')
      setCreatedName('')
    }
  }



  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.enc.json,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setLoadingFile(file)
        setShowLoadDialog(true)
      }
    }
    input.click()
  }

  return (
    <div className="dark h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {downloadUrl ? (
        <motion.div 
          className="relative w-full max-w-md space-y-8 p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center space-y-3">
            <motion.div 
              className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-primary/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
            >
              <DownloadSimple size={48} className="text-primary" weight="duotone" />
            </motion.div>
            <motion.h1 
              className="text-3xl font-semibold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Save Your File
            </motion.h1>
            <motion.p 
              className="text-sm text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Right-click the link below and choose <strong>"Save link as..."</strong> to download your encrypted network file.
            </motion.p>
          </div>

          <motion.div 
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">File Name</p>
                <p className="font-mono text-sm font-medium truncate">{downloadFileName}</p>
              </div>
            </div>
            <div className="pt-2 flex flex-col items-center gap-3">
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="text-lg font-medium text-primary hover:underline inline-flex items-center gap-2 transition-colors"
              >
                <DownloadSimple size={20} weight="bold" />
                {downloadFileName}
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Right-click this link and select <strong>"Save link as..."</strong>
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Button
              onClick={handleContinueWithoutDownload}
              className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-shadow"
              size="lg"
            >
              Continue to Main Screen
            </Button>
          </motion.div>

          <motion.div 
            className="bg-accent/10 backdrop-blur-sm border border-accent/20 rounded-xl p-4 space-y-2 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <h3 className="text-sm font-medium flex items-center gap-2">
              🔒 Security & Important Information
            </h3>
            <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <li>• <strong>Right-click</strong> the link above and choose "Save link as..." to download</li>
              <li>• <strong>Your file is encrypted with military-grade AES-256-GCM encryption</strong></li>
              <li>• <strong>Keep your password safe!</strong> If you lose it, your data cannot be recovered</li>
              <li>• <strong>No cloud storage</strong> - this file is only stored on your computer</li>
              <li>• <strong>Zero-knowledge security</strong> - no one can access your data without your password</li>
            </ul>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="relative w-full max-w-md space-y-8 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Logo size={80} showText={true} className="justify-center mb-2" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-2"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              End-to-end encrypted with <span className="text-primary font-medium">AES-256-GCM</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-accent font-medium">Zero-knowledge</span> architecture
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed pt-2">
              All files stored locally on your device. No cloud, no servers, no tracking.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full h-24 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            <FilePlus size={28} className="mr-3" weight="duotone" />
            Create New Network
          </Button>

          <Button
            onClick={handleFileSelect}
            variant="outline"
            className="w-full h-24 text-lg backdrop-blur-sm bg-card/50 border-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            <FolderOpen size={28} className="mr-3" weight="duotone" />
            Load Existing Network
          </Button>
        </motion.div>
        </motion.div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Network</DialogTitle>
            <DialogDescription>
              Create a new encrypted network file. You'll be able to download it after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-filename">File Name</Label>
              <Input
                id="new-filename"
                placeholder="my-network"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewNetwork()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewNetwork()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">Confirm Password</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewNetwork()
                  }
                }}
              />
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-destructive">⚠️ Critical Security Warning</p>
              <p className="text-xs text-muted-foreground">
                If you lose your password, <strong>your data cannot be recovered</strong>. This is zero-knowledge encryption—no password reset, no backdoor, no recovery option.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewDialog(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleNewNetwork}>Create Network</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Encrypted Network</DialogTitle>
            <DialogDescription>
              Enter the password to decrypt: {loadingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium">🔒 Secure Decryption</p>
              <p className="text-xs text-muted-foreground">
                Your file will be decrypted locally in your browser. No data is transmitted to any server.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="load-password">Password</Label>
              <Input
                id="load-password"
                type="password"
                value={loadPassword}
                onChange={(e) => setLoadPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadNetwork()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLoadDialog(false)
                setLoadingFile(null)
                setLoadPassword('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleLoadNetwork}>Decrypt & Load</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
