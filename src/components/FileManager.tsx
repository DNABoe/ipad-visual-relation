import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'
import { generateSampleData } from '@/lib/sampleData'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">NetEye</h1>
          <p className="text-muted-foreground">Relationship Network Manager</p>
        </div>

        {!showNewDialog && !showLoadDialog && (
          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              onClick={() => setShowNewDialog(true)}
              className="h-20 text-lg"
            >
              <FilePlus className="mr-2" size={24} />
              Create New Network
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoadDialog(true)}
              className="h-20 text-lg"
            >
              <FolderOpen className="mr-2" size={24} />
              Load Existing Network
            </Button>
          </div>
        )}

        {showNewDialog && !downloadUrl && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Create New Network</h2>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="new-filename">File Name</Label>
                <Input
                  id="new-filename"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="my-network"
                />
              </div>
              <div>
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="new-password-confirm">Confirm Password</Label>
                <Input
                  id="new-password-confirm"
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateNetwork} className="flex-1">
                  Create
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {downloadUrl && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Network Created!</h2>
            <p className="text-muted-foreground mb-4">
              Your encrypted network file is ready. Download it to save your work.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleDownloadAndOpen} size="lg">
                <DownloadSimple className="mr-2" size={20} />
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
        )}

        {showLoadDialog && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Load Network</h2>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="load-file">Network File (.neteye)</Label>
                <Input
                  id="load-file"
                  type="file"
                  accept=".neteye"
                  onChange={(e) => setLoadingFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="load-password">Password</Label>
                <Input
                  id="load-password"
                  type="password"
                  value={loadPassword}
                  onChange={(e) => setLoadPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleLoadNetwork} className="flex-1">
                  Load
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLoadDialog(false)
                    setLoadingFile(null)
                    setLoadPassword('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
