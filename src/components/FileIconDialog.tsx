import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DownloadSimple, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { downloadIcoFile } from '@/lib/fileIcon'

interface FileIconDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileIconDialog({ open, onOpenChange }: FileIconDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Windows File Icon Setup</DialogTitle>
          <DialogDescription>
            Configure Windows to display the RelEye icon for your .enc.releye files
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To have Windows show the RelEye icon for your <span className="font-mono text-foreground">.enc.releye</span> files, 
            download the icon and setup files below. Right-click each download button and select "Save Link As..." to save the files.
          </p>
          
          <div className="flex flex-col gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                toast.info('Right-click and select "Save Link As..." to download')
              }}
              onContextMenu={async (e) => {
                e.preventDefault()
                try {
                  await downloadIcoFile('releye-icon.ico')
                  toast.success('Icon file downloaded! Save it to a permanent location (e.g., C:\\Icons\\)')
                } catch (error) {
                  toast.error('Failed to generate icon file')
                }
              }}
              className="block"
            >
              <Button
                variant="outline"
                size="default"
                className="w-full gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
                asChild
              >
                <span>
                  <DownloadSimple size={20} weight="regular" />
                  Download Icon File (.ico)
                </span>
              </Button>
            </a>
            
            <a
              href="/setup-windows-icon.bat"
              download="setup-windows-icon.bat"
              onClick={(e) => {
                e.preventDefault()
                toast.info('Right-click and select "Save Link As..." to download')
              }}
              className="block"
            >
              <Button
                variant="outline"
                size="default"
                className="w-full gap-2"
                asChild
              >
                <span>
                  <DownloadSimple size={20} weight="regular" />
                  Download Setup Script (.bat)
                </span>
              </Button>
            </a>
            
            <Button
              onClick={() => {
                window.open('https://github.com/yourusername/releye/blob/main/WINDOWS_ICON_SETUP.md', '_blank')
                toast.info('Opening setup instructions...')
              }}
              variant="outline"
              size="default"
              className="w-full gap-2"
            >
              <FileText size={20} weight="regular" />
              View Setup Instructions
            </Button>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-4 space-y-3 text-sm mt-4">
            <p className="font-medium text-foreground">Quick Setup:</p>
            <ol className="text-muted-foreground space-y-2 pl-5 list-decimal">
              <li>Download the icon file above and save it permanently (e.g., <span className="font-mono text-xs">C:\Icons\releye-icon.ico</span>)</li>
              <li>Download the setup script (.bat file)</li>
              <li>Right-click the .bat file and select "Run as administrator"</li>
              <li>Enter the path where you saved the icon</li>
              <li>The script will configure Windows automatically</li>
            </ol>
            <p className="text-muted-foreground/80 pt-2 flex items-start gap-2">
              <span className="text-warning">⚠️</span>
              <span>
                <strong>Important:</strong> Don't move or delete the icon file after setup - Windows references it directly!
              </span>
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
