import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    } catch (error) {
      toast.error('Incorrect password')
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

  const handleDownloadAndContinue = () => {
    if (downloadUrl && downloadFileName) {
      try {
        console.log('🔍 Starting download process...')
        console.log('📋 Download URL:', downloadUrl.substring(0, 50) + '...')
        console.log('📄 File name:', downloadFileName)
        
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = downloadFileName
        a.style.display = 'none'
        a.target = '_blank'
        
        document.body.appendChild(a)
        console.log('✅ Anchor element added to DOM')
        
        a.click()
        console.log('✅ Click event triggered')
        
        console.log('📁 File should now be downloading to:')
        console.log('   Windows: C:\\Users\\[YourName]\\Downloads\\' + downloadFileName)
        console.log('   Mac: ~/Downloads/' + downloadFileName)
        console.log('   Linux: ~/Downloads/' + downloadFileName)
        console.log('')
        console.log('💡 To view downloads:')
        console.log('   Chrome/Edge: Press Ctrl+J (Windows) or Cmd+Shift+J (Mac)')
        console.log('   Firefox: Press Ctrl+Shift+Y (Windows) or Cmd+Shift+Y (Mac)')
        console.log('   Safari: Click Downloads button in toolbar')
        
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(downloadUrl)
          console.log('✅ Download cleanup complete')
        }, 1000)
        
        toast.success(`Download started: ${downloadFileName}`, {
          duration: 6000,
          description: 'Check your Downloads folder. Press Ctrl+J (or Cmd+Shift+J on Mac) to view browser downloads.'
        })
      } catch (error) {
        console.error('❌ Download error:', error)
        toast.error('Download failed', {
          description: 'Try using the direct download link below the button'
        })
      }
    }
    
    setTimeout(() => {
      if (createdWorkspace && createdName && createdPassword) {
        onLoad(createdWorkspace, createdName, createdPassword)
        setDownloadUrl(null)
        setDownloadFileName('')
        setCreatedWorkspace(null)
        setCreatedPassword('')
        setCreatedName('')
      }
    }, 300)
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
      {downloadUrl ? (
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <DownloadSimple size={40} className="text-primary" weight="duotone" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Save Your File</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Right-click the link below and choose <strong>"Save link as..."</strong> to download your encrypted network file.
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
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
                className="text-lg font-medium text-primary hover:underline inline-flex items-center gap-2"
              >
                <DownloadSimple size={20} weight="bold" />
                {downloadFileName}
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Right-click this link and select <strong>"Save link as..."</strong>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleContinueWithoutDownload}
              className="w-full h-14 text-base"
              size="lg"
            >
              Continue to Main Screen
            </Button>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              💡 Important
            </h3>
            <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <li>• <strong>Right-click</strong> the link above and choose "Save link as..." to download</li>
              <li>• The file will be saved to your chosen location</li>
              <li>• <strong>Keep this file safe - you'll need it and your password to load your network later!</strong></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Visual Relationship Network</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AES-256-GCM encrypted. Stored locally on your computer.
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
        </div>
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
