import { useState, useCallback, 
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FolderOpen, DownloadSimple } from '@phosphor-icons/react'r, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'mponents/ui/checkbox'
import { encryptData, decryptData, type EncryptedData } from '@/lib/encryption'
import type { Workspace } from '@/lib/types'
import { generateSampleData } from '@/lib/sampleData'

  const [showNewDialog, setS
  onLoad: (workspace: Workspace, fileName: string, password: string) => void
 

  const [loadingFile, setLoadingFile] = useState<File | nul
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const handleCreateNetwork = async () => {
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loadPassword, setLoadPassword] = useState('')
  const [loadingFile, setLoadingFile] = useState<File | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>('')
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string>('')
      const encrypted = await encryptData(workspaceJson, new

      const blob = new Blob([JSON.string
      setDownloadUrl(url)
      setCreatedWorkspace(newWorkspace)

    }
     
      console.log(`📊 S


    }
      setNewFileName('')
      setNewPasswordConfirm('')
    t


  const handleLoadNetwork = 
  const handleLoadNetwork = 
      toa
    }('Please 
    }
    }


      con
      onLoad(workspace, fileName, loadPassword)
      onLoad(workspace, fileName, loadPassword)
      setLoadingFile(null)
      const newWorkspace: Workspace = includeSampleData


      })
      const workspaceJson = JSON.stringify(newWorkspace)
      const encrypted = await encryptData(workspaceJson, newPassword)

      const fullFileName = `${trimmedFileName}.enc.json`
      const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
      setCreatedNetwork({
        workspace: newWorkspace,
      
      console.log(`📦 File: ${fullFileName}`)
      console.log(`📦 File: ${fullFileName}`)s (${(blob.size / 1024).toFixed(2)} KB)`)
        fileName: fullFileName,
      console.log(`🔐 Encrypted with AES-256-GCM`)

      console.log(`📦 File: ${fullFileName}`)
      console.log(`📊 Size: ${blob.size} bytes (${(blob.size / 1024).toFixed(2)} KB)`)
      console.log(`🔐 Encrypted with AES-256-GCM`)
    } catch (error) {
      toast.error('Failed to create network file')
      console.error('Error creating network:', error)
    }
  }, [newFileName, newPassword, newPasswordConfirm, includeSampleData])

  const handleLoadNetwork = useCallback(async () => {
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
    } catch (error) {
      toast.error('Incorrect password or corrupted file', {
        description: 'Please check your password and try again',
      })
      console.error(error)
    }
  }, [loadingFile, loadPassword, onLoad])

  const handleContinueWithoutDownload = useCallback(() => {
    if (createdNetwork) {
      onLoad(createdNetwork.workspace, createdNetwork.name, createdNetwork.password)
    }
  }, [createdNetwork, onLoad])

  const handleResetNewDialog = useCallback(() => {
    setShowNewDialog(false)
    setNewFileName('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setIncludeSampleData(true)
    
    if (createdNetwork?.downloadUrl) {
      URL.revokeObjectURL(createdNetwork.downloadUrl)
    }
    setCreatedNetwork(null)
  }, [createdNetwork])
          className="relative w-full max
              <p clas {
              </p>
          <motion.div
    setLoadingFile(null)
  }, [])

  useEffect(() => {
    return () => {
      if (createdNetwork?.downloadUrl) {
        URL.revokeObjectURL(createdNetwork.downloadUrl)
      }
    }
  }, [createdNetwork])

  if (createdNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="relative w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <Logo size={64} showText={false} className="justify-center" />
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Network Created Successfully!</h1>
              <p className="text-muted-foreground">Download your encrypted file to keep it safe</p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-8 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <FilePlus size={20} className="text-primary" weight="duotone" />
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
                className="flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98]"
              >
                <DownloadSimple size={20} weight="bold" />
                Download {createdNetwork.fileName}
              </a>

              <p className="text-xs text-muted-foreground text-center">
                Right-click this link and select <strong>"Save link as..."</strong> if download doesn't start automatically
              </p>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                🔒 Security & Important Information
              </h3>
              <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                <li>• <strong>Keep your password safe!</strong> If you lose it, your data cannot be recovered</li>
                <li>• Your file is encrypted with AES-256-GCM encryption</li>
                <li>• Store the file in a secure location</li>
                <li>• You can continue working without downloading (not recommended)</li>
              <Button variant="outline" onClick={handleResetNewDialog} className="flex-1">
                Create Another
              </Button>
              <Button onClick={handleContinueWithoutDownload} className="flex-1">
ntinue Without Download
            </DialogDescription>
   
          </div>
        </div>
      </div>
    )
  }

  return (
    </div>nter justify-center p-8 bg-gradient-to-br from-background via-primary/5 to-accent/10">
}-md space-y-12">
v className="text-center space-y-6">
          <Logo size={80} showText={true} className="justify-center" />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Create and visualize professional relationships with end-to-end encryption
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full h-20 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] group"
ize="lg"
          >
"mr-3 group-hover:scale-110 transition-transform" weight="duotone" />

            >utton>

   <Button
            onClick={() => setShowLoadDialog(true)}

            className="w-full h-20 text-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] group"
            size="lg"
          >
            <FolderOpen size={28} className="mr-3 group-hover:scale-110 transition-transform" weight="duotone" />
            Load Existing Network
          </Button>


div className="text-center text-xs text-muted-foreground/60">
p>🔒 All data is encrypted locally in your browser</p>

            animate={{ opacity: 1, y: 0 }}

          >}>
        <DialogContent className="sm:max-w-md">

            <DialogTitle className="flex items-center gap-2">
-mono text-sm font-medium truncate">{downloadFileName}</p>
              Create New Network
            </DialogTitle>
            <DialogDescription>
              Set up your encrypted relationship network
                href={downloadUrl}

          <div className="space-y-4 py-4">

              <Label htmlFor="new-filename">File Name</Label>
              <Input
                id="new-filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-network"
                className="focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPassword && newPasswordConfirm) {
                    handleCreateNetwork()
}
                }}
              />
              <p className="text-xs text-muted-foreground">
                Will be saved as: <span className="font-mono">{newFileName.trim() || 'my-network'}.enc.json</span>
              </p>
            </div>

          </motion.div>
              <Label htmlFor="new-password">Password</Label>
          <Input
                id="new-password"
                type="password"
            animate={{ opacity: 1 }}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPasswordConfirm) {
dleCreateNetwork()
                  }

              />
          </motion.div>ame="text-xs text-muted-foreground">
                Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.
          <motion.div 
            </div>
            initial={{ opacity: 0, y: 20 }}
            <div className="space-y-2">
            transition={{ duration: 0.3, delay: 0.6 }}nfirm Password</Label>

            <h3 className="text-sm font-medium flex items-center gap-2">
                type="password"
            </h3>
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="focus-visible:ring-primary"
              <li>• <strong>Keep your password safe!</strong> If you lose it, your data cannot be recovered</li>
                  if (e.key === 'Enter') {
         handleCreateNetwork()
                  }
                }}
              />
      ) : ( </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Checkbox
                id="include-sample"
                checked={includeSampleData}
                onCheckedChange={(checked) => setIncludeSampleData(checked === true)}

              <Label htmlFor="include-sample" className="cursor-pointer text-sm font-normal">
                Include sample data to explore features


            transition={{ duration: 0.4, delay: 0.2 }}

          <DialogFooter>
            <Button variant="outline" onClick={handleResetNewDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateNetwork} className="bg-gradient-to-r from-primary to-accent">
   Create Network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          </motion.div>

            <DialogTitle className="flex items-center gap-2">
              <FolderOpen size={24} className="text-primary" weight="duotone" />
            transition={{ duration: 0.4, delay: 0.4 }}
            </DialogTitle>

Select your encrypted network file
            </DialogDescription>
              <Input
        </div>  id="load-file"

                accept=".json,.enc.json"
                className="focus-visible:ring-primary cursor-pointer"

                  const file = e.target.files?.[0]
            size="lg"
                    setLoadingFile(file)
            <FilePlus size={24} className="mr-3" />
                }}
              />
ound">
our <span className="font-mono">.enc.json</span> file
            </p>
            variant="outline"

            <div className="space-y-2">
              <Label htmlFor="load-password">Password</Label>
            <FolderOpen size={24} className="mr-3" />
            Load Existing Network

        </div>
                onChange={(e) => setLoadPassword(e.target.value)}
                placeholder="Enter your password"
                className="focus-visible:ring-primary"
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>





                <span className="text-xs">🔒</span>
          <div className="space-y-4 py-4">">
            <div className="space-y-2">rypted locally in your browser
                </p>


          </div>

                onChange={(e) => setNewFileName(e.target.value)}
            <Button
              variant="outline"
    onClick={handleResetLoadDialog}
            >
              Cancel
            </Button>
            <Button onClick={handleLoadNetwork} className="bg-gradient-to-r from-primary to-accent">
              Load Network

          </DialogFooter>
        </DialogContent>
                type="password"
    </div>
  )
}
