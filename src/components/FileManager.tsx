import { useState } from 'react'
import { Input } from '@/components/ui
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
      })


      })
    }

    if (createdWorkspace 
      setDownloadFileName(fullFileName)
      setCreatedPassword(newPassword)
      setCreatedName(fileName)
      setCreatedName(fileName)
      
      console.log(`📦 File: ${fullFileName}`)
      console.log(`📦 File: ${fullFileName}`)s (${(blob.size / 1024).toFixed(2)} KB)`)
      console.log(`📊 Size: ${blob.size} bytes (${(blob.size / 1024).toFixed(2)} KB)`)
      console.log(`🔐 Encrypted with AES-256-GCM`)
              <span className="font-semibold
            <Button
        
              <FolderOpen cla

      setShowNewDialog(false)
              animate={{ opacit
      setNewPassword('')
              <p clas
      setIncludeSampleData(false) • Zero-Knowledge
            </motion.div>
      toast.error('Failed to create network file')
      console.error('Error creating network:', error)
    }


                  <FilePlus size={20} cla

              
    if (!loadingFile) {
     
                  </p>

    if (!loadPassword) {
      toast.error('Please enter a password')
      return
    }

                  <Label htmlFor="new-password" className="tex
      
                    value={newPassword}
      ceholder="Enter a strong password
      const decrypted = await decryptData(encrypted, loadPassword)
      const workspace: Workspace = JSON.parse(decrypted)
             <Input
      const fileName = loadingFile.name.replace('.enc.json', '')
      onLoad(workspace, fileName, loadPassword)
                    class
                </div>
      setLoadPassword('')={handleCreateNetwork} className="flex-
        
                    v
                      setShowNewDialog(false)
    } catch (error) {
      toast.error('Incorrect password or corrupted file', {
                    size="
     
      console.error(error)

        )}
&& (
  const handleContinueWithoutDownload = () => {
    if (createdWorkspace && createdName && createdPassword) {
      onLoad(createdWorkspace, createdName, createdPassword)
       
          className="relative w-full max
              <p clas
              </p>
          <motion.div
            animate={{ opacity:

          </motion.div>

   
            onClick={() => setShowNewDialo
           
            onClick={() => setShowNewDialo
           
          <Button
        
          <Button"lg"
         <FolderOpen size
          </Button>

        </motion.div>

          initial={{ opacit
          <DialogHeader>
            <DialogDesc
            </DialogDescription>
          <div className="space-y-4 py-4">
              <spName</Label>
            <p className="text-xs text-muted-f
        
                onKeyDown=
      )}etwork()
                }}
          <DialogHeader>
            <DialogDesc
            </DialogDescription>
          <div className="space-y-4 py-4">
              <Label htmlFor="new-filename">File Name</Label>
                id="new-filename"
          
                onKeyDown=
            <div className="space-y-2">
                type="password"
          
              <L
     
                value={newPassword}
                onKeyDown
                    handleNewNetwork()xt-muted-foreground">
          
              <p classN
            <div className="space-y-2">
              <Input
            </Button>
          </DialogFooter>
       
     
    

              <p className="text-xs text-muted-foreground">
              </p>-y-4 py-4">
          </div> classN
            <Button variant="ou
            </div>
            </Button>>Password</Label
                i
                value={loadP
      <Dial
   

            </DialogDescription>
   
              <p classN
                Your file will be de
            </div>
              <Label htmlFor="load-password">Password</Label
              Cancel
                value={loadP
        </DialogContent>
    </div>
}



          

              }}
              Cancel
            >
        </DialogContent>
    </div>





            >







            >







            animate={{ opacity: 1, y: 0 }}

          >
            >


-mono text-sm font-medium truncate">{downloadFileName}</p>




                href={downloadUrl}

          >e-flex items-center gap-2 transition-colors"

                <DownloadSimple size={20} weight="bold" />






                href={downloadUrl}
                download={downloadFileName}



                {downloadFileName}
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Right-click this link and select <strong>"Save link as..."</strong>

            </div>
          </motion.div>




            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >







          </motion.div>

          <motion.div 

            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}

            <h3 className="text-sm font-medium flex items-center gap-2">
              🔒 Security & Important Information
            </h3>
            <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">


              <li>• <strong>Keep your password safe!</strong> If you lose it, your data cannot be recovered</li>




        </motion.div>
      ) : (



          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >

          <h1 className="text-3xl font-semibold tracking-tight">Visual Relationship Network</h1>



            transition={{ duration: 0.4, delay: 0.2 }}

            <p className="text-sm text-muted-foreground leading-relaxed">



          <motion.div



          >



          </motion.div>


            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}




          </motion.div>
        </div>

        <div className="space-y-4">


            className="w-full h-24 text-lg"
            size="lg"

            <FilePlus size={24} className="mr-3" />
            Create New Network
          </Button>



            variant="outline"
            className="w-full h-24 text-lg"
            size="lg"

            <FolderOpen size={24} className="mr-3" />
            Load Existing Network

        </div>
        </motion.div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>





          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">




                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}




                }}






                type="password"





                  }


              <p className="text-xs text-muted-foreground">Use a strong, unique password. Recommended: 12+ characters with mixed case, numbers, and symbols.</p>

            <div className="space-y-2">




                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewNetwork()
                  }
                }}







            </div>

          <DialogFooter>



              Cancel

            <Button onClick={handleNewNetwork}>Create Network</Button>

        </DialogContent>


      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>





























          </div>