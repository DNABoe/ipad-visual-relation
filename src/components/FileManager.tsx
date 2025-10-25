import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FolderOpen } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'

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

    const emptyWorkspace: Workspace = {
      persons: [],
      connections: [],
      groups: []
    }

    try {
      const encrypted = await encryptData(JSON.stringify(emptyWorkspace), newPassword)
      const fileData = JSON.stringify(encrypted, null, 2)
      const blob = new Blob([fileData], { type: 'application/json' })
      const fileName = newFileName.trim()

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `${fileName}.enc.json`,
            types: [{
              description: 'Encrypted Network File',
              accept: { 'application/json': ['.enc.json', '.json'] }
            }]
          })
          
          const writable = await handle.createWritable()
          await writable.write(fileData)
          await writable.close()

          toast.success(`Network created and saved to: ${fileName}.enc.json`)
          onLoad(emptyWorkspace, fileName, newPassword)
          setShowNewDialog(false)
          setNewFileName('')
          setNewPassword('')
          setNewPasswordConfirm('')
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            toast.info('Save cancelled - you can save later from the workspace')
            onLoad(emptyWorkspace, fileName, newPassword)
            setShowNewDialog(false)
            setNewFileName('')
            setNewPassword('')
            setNewPasswordConfirm('')
          } else {
            throw error
          }
        }
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.enc.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success(`Network created - file will download as: ${fileName}.enc.json`)
        onLoad(emptyWorkspace, fileName, newPassword)
        setShowNewDialog(false)
        setNewFileName('')
        setNewPassword('')
        setNewPasswordConfirm('')
      }
    } catch (error) {
      toast.error('Failed to create encrypted file')
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

      const fileName = loadingFile.name.replace('.enc.json', '')
      onLoad(workspace, fileName, loadPassword)
      setShowLoadDialog(false)
      setLoadingFile(null)
      setLoadPassword('')
      toast.success('Network loaded successfully')
    } catch (error) {
      toast.error('Failed to decrypt file. Check your password.')
      console.error(error)
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
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Visual Relationship Network</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your files are stored locally on your computer and are protected with strong AES-256-GCM encryption. 
            Only you have access to your data.
          </p>
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Where are my files stored?</p>
            <p>
              When you create or save a network, you'll be prompted to choose where to save the encrypted .enc.json file on your computer. 
              You can save it anywhere - your Documents folder, Desktop, or a dedicated folder for your networks.
            </p>
            <p className="text-accent-foreground font-medium">
              Remember the location you choose and keep your password safe!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full h-24 text-lg"
            size="lg"
          >
            <FilePlus size={24} className="mr-3" />
            Create New Network
          </Button>

          <Button
            onClick={handleFileSelect}
            variant="outline"
            className="w-full h-24 text-lg"
            size="lg"
          >
            <FolderOpen size={24} className="mr-3" />
            Load Existing Network
          </Button>
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Network</DialogTitle>
            <DialogDescription>
              Enter a name and password for your new encrypted network.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-xs text-foreground">
            <p className="font-medium mb-1">💾 File Location</p>
            <p className="text-muted-foreground">
              After clicking Create, you'll be prompted to choose where on your computer to save the encrypted file. 
              Pick a memorable location like your Documents or Desktop folder.
            </p>
          </div>
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
              <div className="text-xs text-muted-foreground">
                File will be saved as: {newFileName.trim() || 'filename'}.enc.json
              </div>
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
            <DialogTitle>Load Network</DialogTitle>
            <DialogDescription>
              Enter the password for: {loadingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button onClick={handleLoadNetwork}>Load Network</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
