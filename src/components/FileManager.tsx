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
  const [fileHandle, setFileHandle] = useState<any>(null)
  const [selectedPath, setSelectedPath] = useState<string>('')

  const handleSelectLocation = async () => {
    if (!newFileName.trim()) {
      toast.error('Please enter a file name')
      return
    }

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${newFileName.trim()}.enc.json`,
          types: [{
            description: 'Encrypted Network File',
            accept: { 'application/json': ['.enc.json', '.json'] }
          }]
        })
        setFileHandle(handle)
        setSelectedPath(handle.name)
        toast.success('File location selected')
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          toast.info('File selection cancelled')
        } else {
          toast.error('Failed to select file location')
          console.error(error)
        }
      }
    } else {
      setSelectedPath(`${newFileName.trim()}.enc.json`)
      toast.success('Ready to save - you will choose location when creating the network')
    }
  }

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
    if (!selectedPath) {
      toast.error('Please select a file location first')
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

      if (fileHandle) {
        try {
          const writable = await fileHandle.createWritable()
          await writable.write(fileData)
          await writable.close()

          onLoad(emptyWorkspace, newFileName.trim(), newPassword)
          setShowNewDialog(false)
          setNewFileName('')
          setNewPassword('')
          setNewPasswordConfirm('')
          setFileHandle(null)
          setSelectedPath('')
          toast.success('New encrypted network created and saved')
        } catch (error) {
          toast.error('Failed to save file')
          console.error(error)
        }
      } else {
        const blob = new Blob([fileData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${newFileName.trim()}.enc.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        onLoad(emptyWorkspace, newFileName.trim(), newPassword)
        setShowNewDialog(false)
        setNewFileName('')
        setNewPassword('')
        setNewPasswordConfirm('')
        setFileHandle(null)
        setSelectedPath('')
        toast.success('New encrypted network created - file downloaded')
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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Visual Relationship Network</h1>
          <p className="text-sm text-muted-foreground">
            All data is stored locally and encrypted with AES-256
          </p>
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

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Your network data never leaves your computer.</p>
          <p>All encryption and decryption happens locally in your browser.</p>
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Network</DialogTitle>
            <DialogDescription>
              Enter a name and password for your new network, then choose where to save the encrypted file.
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
              <p className="text-xs text-muted-foreground">
                File will be saved as: {newFileName.trim() || 'filename'}.enc.json
              </p>
            </div>
            <div className="space-y-2">
              <Label>File Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleSelectLocation}
                disabled={!newFileName.trim()}
              >
                <FolderOpen size={16} className="mr-2" />
                {selectedPath ? selectedPath : 'Click to choose location...'}
              </Button>
              {selectedPath && (
                <p className="text-xs text-green-600">
                  ✓ Location selected: {selectedPath}
                </p>
              )}
              {!selectedPath && (
                <p className="text-xs text-muted-foreground">
                  {('showSaveFilePicker' in window) 
                    ? 'Click the button above to open the file save dialog'
                    : 'Click the button above, then you will choose the save location when creating the network'}
                </p>
              )}
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
              setFileHandle(null)
              setSelectedPath('')
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
