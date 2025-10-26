import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'
import { generateSampleData } from '@/lib/sampleData'

  const [showNewDialog, setS
  onLoad: (workspace: Workspace, fileName: string, password: string) => void
 

  const [loadingFile, setLoadingFile] = useState<File | nul
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [includeSampleData, setIncludeSampleData] = 
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loadPassword, setLoadPassword] = useState('')
  const [loadingFile, setLoadingFile] = useState<File | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>('')
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string>('')
      const encrypted = await encryptData(workspaceJson, new
      const fileName = newFileName.trim()

      const url = URL.createObjectURL(bl
      setDownloadUrl(url)
      setCreatedWorkspace(newWorkspace)
      setCre
     
      console.log(`📊 S

        desc

      setNewFileName('')
      setNewPasswordConfirm('')
    } catch 
     


  const handleLoadNetwork = 
      toa
    }
      toast.error('Please 
    }
    try {

      con

      onLoad(workspace, fileName, loadPassword)
      setLoadingFile(null)
      toast.success('Network loaded and d
      })

      })
    }

    if (createdWorkspace 
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
          className="relative w-full max
       
        >
          <motion.div
            animate={{ opacity:
          >
          </motion.div>

   

        >
            onClick={() => setShowNewDialo
           
            <FilePlus size={28} className="mr-3" weigh
          </Button>
          <Button
        
            size="lg"
            <FolderOpen size
          </Button>

          initial={{ opacit
        
        >
            <p className="text-xs text-muted-foregro
        
              <sp
            <p className="text-xs text-muted-f
        
        </motion.div>
      )}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDia
          <DialogHeader>
            <DialogDesc
            </DialogDescription>
          <div className="space-y-4 py-4">
              <Label htmlFor="new-filename">File Name</Label>
                id="new-filename"
        
                onKeyDown=
                    handleNewNetwork()
                }}
            </div>
              <L
        
                value={newPassword}
                onKeyDown
                    handleNewNetwork()
          
              <p classN
            <div className="space-y-2">
              <Input
                type="password"
          
       
     
    
            <div class
              <p className="text-xs text-muted-foreground">
              </p>
          </div>
            <Button variant="ou
            }}>
            </Button>
          </DialogFooter>
      <
      <Dial
   

            </DialogDescription>
          <div className="space-y-4 py-4">
              <p classN
                Your file will be de
            </div>
              <Label htmlFor="load-password">Password</Label
                i
                value={loadP
                onKeyDown={(e) 
       
     
              />
   

          
                setLoadingFile(null)
              }}
              Cancel
            <Button onClick={handleLoadNetwork}>Dec
        </DialogContent>
    </div>
}







            >







            >







            >







            animate={{ opacity: 1, y: 0 }}

          >



                <p className="font-mono text-sm font-medium truncate">{downloadFileName}</p>
              </div>
            </div>
            <div className="pt-2 flex flex-col items-center gap-3">

                href={downloadUrl}
                download={downloadFileName}
                className="text-lg font-medium text-primary hover:underline inline-flex items-center gap-2 transition-colors"

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

            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Button
              onClick={handleContinueWithoutDownload}

              size="lg"

              Continue to Main Screen

          </motion.div>

          <motion.div 
            className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}

            <h3 className="text-sm font-medium flex items-center gap-2">
              🔒 Security & Important Information
            </h3>
            <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <li>• <strong>Right-click</strong> the link above and choose "Save link as..." to download</li>
              <li>• <strong>Your file is encrypted with military-grade AES-256-GCM encryption</strong></li>
              <li>• <strong>Keep your password safe!</strong> If you lose it, your data cannot be recovered</li>
              <li>• <strong>No cloud storage</strong> - this file is only stored on your computer</li>
              <li>• <strong>Zero-knowledge security</strong> - no one can access your data without your password</li>

          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="w-full max-w-md space-y-8 p-8"

          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >

          <h1 className="text-3xl font-semibold tracking-tight">Visual Relationship Network</h1>

            initial={{ opacity: 0, y: -10 }}

            transition={{ duration: 0.4, delay: 0.2 }}

            <p className="text-sm text-muted-foreground leading-relaxed">
              End-to-end encrypted with AES-256-GCM.
            </p>

          <motion.div

            animate={{ opacity: 1, y: 0 }}

          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zero-knowledge architecture.
            </p>
          </motion.div>

            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}

            <p className="text-xs text-muted-foreground leading-relaxed">
              All files stored locally on your device. No cloud, no servers, no tracking.
            </p>
          </motion.div>
        </div>

        <div className="space-y-4">

            onClick={() => setShowNewDialog(true)}
            className="w-full h-24 text-lg"
            size="lg"

            <FilePlus size={24} className="mr-3" />
            Create New Network
          </Button>

          <Button

            variant="outline"
            className="w-full h-24 text-lg"
            size="lg"

            <FolderOpen size={24} className="mr-3" />
            Load Existing Network
          </Button>
        </div>
        </motion.div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Network</DialogTitle>

              Create a new encrypted network file. You'll be able to download it after creation.

          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-filename">File Name</Label>
              <Input

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

                type="password"

                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewNetwork()
                  }

              />
              <p className="text-xs text-muted-foreground">Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">Confirm Password</Label>

                id="new-password-confirm"

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

            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewDialog(false)

              Cancel

            <Button onClick={handleNewNetwork}>Create Network</Button>

        </DialogContent>


      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>

            <DialogTitle>Load Encrypted Network</DialogTitle>
            <DialogDescription>
              Enter the password to decrypt: {loadingFile?.name}

          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium">🔒 Secure Decryption</p>
              <p className="text-xs text-muted-foreground">
                Your file will be decrypted locally in your browser. No data is transmitted to any server.
              </p>
            </div>
            <div className="space-y-2">

              <Input
                id="load-password"
                type="password"
                value={loadPassword}
                onChange={(e) => setLoadPassword(e.target.value)}

                  if (e.key === 'Enter') {

                  }

                autoFocus

            </div>
          </div>
          <DialogFooter>

              variant="outline"
              onClick={() => {
                setShowLoadDialog(false)
                setLoadingFile(null)
                setLoadPassword('')

            >

            </Button>
            <Button onClick={handleLoadNetwork}>Decrypt & Load</Button>
          </DialogFooter>

      </Dialog>

  )

