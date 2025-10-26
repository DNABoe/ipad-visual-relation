import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilePlus, FolderOpen, DownloadSimple, ShieldCheck, LockKey } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'
import { generateSampleData } from '@/lib/sampleData'
import { Logo } from './Logo'

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

  const handleCreateNetwork = async () => {
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

    try {
      const newWorkspace: Workspace = generateSampleData()
      const workspaceJson = JSON.stringify(newWorkspace, null, 2)
      const encrypted = await encryptData(workspaceJson, newPassword)
      const fileName = newFileName.trim()

      const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setDownloadFileName(`${fileName}.neteye`)
      setCreatedWorkspace(newWorkspace)
      setCreatedPassword(newPassword)

      toast.success('Network created! Download your encrypted file.')
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
      toast.error('Please enter the password')
      return
    }

    try {
      const fileContent = await loadingFile.text()
      const encrypted: EncryptedData = JSON.parse(fileContent)
      const decrypted = await decryptData(encrypted, loadPassword)
      const workspace: Workspace = JSON.parse(decrypted)

      const fileName = loadingFile.name.replace(/\.neteye$/, '')
      onLoad(workspace, fileName, loadPassword)
      toast.success('Network loaded successfully')
    } catch (error) {
      toast.error('Failed to load network. Check your password.')
      console.error(error)
    }
  }

  const handleDownloadAndOpen = () => {
    if (!downloadUrl || !createdWorkspace || !createdPassword) return

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    onLoad(createdWorkspace, newFileName, createdPassword)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-primary/20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Logo size={72} showText={true} />
          </motion.div>
        </div>

        {!showNewDialog && !showLoadDialog && (
          <motion.div 
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={() => setShowNewDialog(true)}
              className="h-16 text-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FilePlus className="mr-3" size={28} weight="duotone" />
              <span className="font-semibold">Create New Network</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoadDialog(true)}
              className="h-16 text-lg border-2 hover:border-accent hover:bg-accent/5 transition-all duration-300"
            >
              <FolderOpen className="mr-3" size={28} weight="duotone" />
              <span className="font-semibold">Load Existing Network</span>
            </Button>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={16} weight="duotone" className="text-accent shrink-0" />
                AES-256 Encrypted • Zero-Knowledge • Local-Only
              </p>
            </motion.div>
          </motion.div>
        )}

        {showNewDialog && !downloadUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 shadow-2xl border-2 bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FilePlus size={20} className="text-primary" weight="duotone" />
                </div>
                <h2 className="text-2xl font-semibold">Create New Network</h2>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex gap-3">
                  <LockKey size={20} className="text-accent mt-0.5 shrink-0" weight="duotone" />
                  <p className="text-xs text-muted-foreground">
                    Your network will be encrypted with AES-256. <strong>Keep your password safe</strong> — there's no way to recover it if lost.
                  </p>
                </div>

                <div>
                  <Label htmlFor="new-filename" className="text-sm font-medium">File Name</Label>
                  <Input
                    id="new-filename"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="my-network"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password-confirm" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="new-password-confirm"
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleCreateNetwork} className="flex-1" size="lg">
                    Create Network
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewDialog(false)
                      setNewFileName('')
                      setNewPassword('')
                      setNewPasswordConfirm('')
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {downloadUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 shadow-2xl border-2 bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-accent" weight="duotone" />
                </div>
                <h2 className="text-2xl font-semibold">Network Created!</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Your encrypted network file is ready with sample data. Download it to keep your network secure.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleDownloadAndOpen} size="lg" className="shadow-lg">
                  <DownloadSimple className="mr-2" size={20} weight="duotone" />
                  Download & Open Network
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewDialog(false)
                    setDownloadUrl(null)
                    setDownloadFileName('')
                    setCreatedWorkspace(null)
                    setCreatedPassword('')
                    setNewFileName('')
                    setNewPassword('')
                    setNewPasswordConfirm('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {showLoadDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 shadow-2xl border-2 bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FolderOpen size={20} className="text-primary" weight="duotone" />
                </div>
                <h2 className="text-2xl font-semibold">Load Network</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="load-file" className="text-sm font-medium">Network File (.neteye)</Label>
                  <Input
                    id="load-file"
                    type="file"
                    accept=".neteye"
                    onChange={(e) => setLoadingFile(e.target.files?.[0] || null)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="load-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="load-password"
                    type="password"
                    value={loadPassword}
                    onChange={(e) => setLoadPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleLoadNetwork} className="flex-1" size="lg">
                    Load Network
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLoadDialog(false)
                      setLoadingFile(null)
                      setLoadPassword('')
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
