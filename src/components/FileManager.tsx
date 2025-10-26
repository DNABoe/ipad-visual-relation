import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>('')
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string>('')
  const [createdName, setCreatedName] = useState<string>('')

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

    const sampleWorkspace: Workspace = {
      persons: [
        {
          id: 'person-1',
          name: 'Sarah Chen',
          position: 'Chief Executive Officer',
          position2: 'Board Member',
          position3: 'Strategy Lead',
          score: 5,
          frameColor: 'green',
          x: 100,
          y: 100,
          createdAt: Date.now() - 80000,
        },
        {
          id: 'person-2',
          name: 'Marcus Rodriguez',
          position: 'Chief Technology Officer',
          position2: 'Head of Engineering',
          position3: 'Platform Architect',
          score: 5,
          frameColor: 'green',
          x: 400,
          y: 100,
          createdAt: Date.now() - 70000,
        },
        {
          id: 'person-3',
          name: 'Emily Watson',
          position: 'VP of Product',
          position2: 'Product Strategy',
          position3: 'UX Design Lead',
          score: 4,
          frameColor: 'orange',
          x: 100,
          y: 220,
          createdAt: Date.now() - 60000,
        },
        {
          id: 'person-4',
          name: 'James Park',
          position: 'VP of Engineering',
          position2: 'Technical Lead',
          position3: 'DevOps Manager',
          score: 4,
          frameColor: 'orange',
          x: 400,
          y: 220,
          createdAt: Date.now() - 50000,
        },
        {
          id: 'person-5',
          name: 'Dr. Lisa Kumar',
          position: 'Strategic Advisor',
          position2: 'Research Director',
          position3: 'AI/ML Consultant',
          score: 5,
          frameColor: 'white',
          x: 750,
          y: 100,
          createdAt: Date.now() - 40000,
        },
        {
          id: 'person-6',
          name: 'David Thompson',
          position: 'Board Member',
          position2: 'Investor Relations',
          position3: 'Growth Advisor',
          score: 4,
          frameColor: 'white',
          x: 1000,
          y: 100,
          createdAt: Date.now() - 30000,
        },
        {
          id: 'person-7',
          name: 'Rachel Green',
          position: 'Technical Consultant',
          position2: 'Cloud Architect',
          position3: 'Security Specialist',
          score: 3,
          frameColor: 'white',
          x: 750,
          y: 220,
          createdAt: Date.now() - 20000,
        },
        {
          id: 'person-8',
          name: 'Alex Martinez',
          position: 'Design Lead',
          position2: 'Creative Director',
          position3: 'Brand Manager',
          score: 3,
          frameColor: 'red',
          x: 250,
          y: 450,
          createdAt: Date.now() - 10000,
        },
        {
          id: 'person-9',
          name: 'Jennifer Wu',
          position: 'Head of Marketing',
          position2: 'Growth Marketing',
          position3: 'Content Strategy',
          score: 4,
          frameColor: 'orange',
          x: 550,
          y: 450,
          createdAt: Date.now() - 9000,
        },
        {
          id: 'person-10',
          name: 'Michael O\'Brien',
          position: 'Sales Director',
          position2: 'Enterprise Sales',
          position3: 'Customer Success',
          score: 4,
          frameColor: 'orange',
          x: 850,
          y: 450,
          createdAt: Date.now() - 8000,
        },
        {
          id: 'person-11',
          name: 'Sophia Anderson',
          position: 'Head of HR',
          position2: 'Talent Acquisition',
          position3: 'Culture Lead',
          score: 4,
          frameColor: 'orange',
          x: 100,
          y: 650,
          createdAt: Date.now() - 7000,
        },
        {
          id: 'person-12',
          name: 'Ryan Mitchell',
          position: 'CFO',
          position2: 'Financial Planning',
          position3: 'Investor Relations',
          score: 5,
          frameColor: 'green',
          x: 400,
          y: 650,
          createdAt: Date.now() - 6000,
        },
        {
          id: 'person-13',
          name: 'Olivia Taylor',
          position: 'Data Scientist',
          position2: 'ML Engineer',
          position3: 'Analytics Lead',
          score: 3,
          frameColor: 'white',
          x: 700,
          y: 650,
          createdAt: Date.now() - 5000,
        },
        {
          id: 'person-14',
          name: 'Daniel Lee',
          position: 'Security Engineer',
          position2: 'InfoSec Lead',
          position3: 'Compliance Officer',
          score: 4,
          frameColor: 'orange',
          x: 1000,
          y: 650,
          createdAt: Date.now() - 4000,
        },
        {
          id: 'person-15',
          name: 'Isabella Garcia',
          position: 'Customer Support Lead',
          position2: 'Success Manager',
          position3: 'Training Coordinator',
          score: 3,
          frameColor: 'white',
          x: 250,
          y: 850,
          createdAt: Date.now() - 3000,
        },
      ],
      connections: [
        { id: 'conn-1', fromPersonId: 'person-1', toPersonId: 'person-2' },
        { id: 'conn-2', fromPersonId: 'person-1', toPersonId: 'person-3' },
        { id: 'conn-3', fromPersonId: 'person-1', toPersonId: 'person-4' },
        { id: 'conn-4', fromPersonId: 'person-2', toPersonId: 'person-4' },
        { id: 'conn-5', fromPersonId: 'person-3', toPersonId: 'person-8' },
        { id: 'conn-6', fromPersonId: 'person-1', toPersonId: 'person-5' },
        { id: 'conn-7', fromPersonId: 'person-5', toPersonId: 'person-6' },
        { id: 'conn-8', fromPersonId: 'person-5', toPersonId: 'person-7' },
        { id: 'conn-9', fromPersonId: 'person-3', toPersonId: 'person-9' },
        { id: 'conn-10', fromPersonId: 'person-9', toPersonId: 'person-10' },
        { id: 'conn-11', fromPersonId: 'person-1', toPersonId: 'person-9' },
        { id: 'conn-12', fromPersonId: 'person-1', toPersonId: 'person-10' },
        { id: 'conn-13', fromPersonId: 'person-1', toPersonId: 'person-11' },
        { id: 'conn-14', fromPersonId: 'person-1', toPersonId: 'person-12' },
        { id: 'conn-15', fromPersonId: 'person-2', toPersonId: 'person-13' },
        { id: 'conn-16', fromPersonId: 'person-2', toPersonId: 'person-14' },
        { id: 'conn-17', fromPersonId: 'person-4', toPersonId: 'person-13' },
        { id: 'conn-18', fromPersonId: 'person-4', toPersonId: 'person-14' },
        { id: 'conn-19', fromPersonId: 'person-10', toPersonId: 'person-15' },
        { id: 'conn-20', fromPersonId: 'person-9', toPersonId: 'person-15' },
      ],
      groups: [
        {
          id: 'group-1',
          name: 'Executive Leadership',
          color: 'blue',
          x: 50,
          y: 50,
          width: 600,
          height: 300,
          createdAt: Date.now() - 100000,
        },
        {
          id: 'group-2',
          name: 'Board & Advisors',
          color: 'purple',
          x: 700,
          y: 50,
          width: 500,
          height: 300,
          createdAt: Date.now() - 90000,
        },
        {
          id: 'group-3',
          name: 'Department Heads',
          color: 'emerald',
          x: 200,
          y: 400,
          width: 800,
          height: 200,
          createdAt: Date.now() - 85000,
        },
        {
          id: 'group-4',
          name: 'Operations & Finance',
          color: 'amber',
          x: 50,
          y: 600,
          width: 600,
          height: 250,
          createdAt: Date.now() - 75000,
        },
        {
          id: 'group-5',
          name: 'Technical Team',
          color: 'cyan',
          x: 700,
          y: 600,
          width: 500,
          height: 250,
          createdAt: Date.now() - 65000,
        },
      ]
    }

    try {
      const workspaceJson = JSON.stringify(sampleWorkspace, null, 2)
      const encrypted = await encryptData(workspaceJson, newPassword)
      const fileData = JSON.stringify(encrypted, null, 2)
      const fileName = newFileName.trim()
      const fullFileName = `${fileName}.enc.json`

      const blob = new Blob([fileData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      setDownloadUrl(url)
      setDownloadFileName(fullFileName)
      setCreatedWorkspace(sampleWorkspace)
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
            <h1 className="text-3xl font-semibold tracking-tight">Your File is Ready!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the button below to download your encrypted network file to your computer.
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">File Name</p>
                <p className="font-mono text-sm font-medium truncate">{downloadFileName}</p>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                onClick={() => {
                  toast.success('Download started', {
                    description: 'Check your Downloads folder'
                  })
                }}
              >
                <DownloadSimple size={16} weight="bold" />
                Or click here to download directly
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                if (!downloadUrl || !downloadFileName) return
                
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = downloadFileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                
                console.log('🔽 Download triggered:', downloadFileName)
                toast.success('Download started', {
                  duration: 6000,
                  description: 'Check your Downloads folder. Press Ctrl+J to view browser downloads.'
                })
                
                setTimeout(() => {
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
                }, 300)
              }}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <DownloadSimple size={24} weight="bold" className="mr-3" />
              Download File & Continue
            </Button>

            <Button
              variant="outline"
              onClick={handleContinueWithoutDownload}
              className="w-full"
            >
              Skip Download & Continue
            </Button>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              💡 How to Download
            </h3>
            <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <li>• Click the button below to download your encrypted file</li>
              <li>• The file will save to your browser's Downloads folder</li>
              <li>• Press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Ctrl+J</kbd> (Windows/Linux) or <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Cmd+Shift+J</kbd> (Mac) to view downloads</li>
              <li>• <strong>Save this file securely - you'll need it and your password to access your network later!</strong></li>
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

        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium">Where are my files?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Files are downloaded to your browser's <strong>Downloads folder</strong>. In Edge/Chrome, check the download bar at the bottom of the window or press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Ctrl+J</kbd> to view downloads.
          </p>
        </div>
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Network</DialogTitle>
            <DialogDescription>
              Create a new encrypted network file with sample data. You'll be able to download it after creation.
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
