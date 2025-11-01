import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface UnsavedChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
  onSaveAndContinue: () => void
  downloadUrl: string | null
  fileName: string
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSaveAndContinue,
  downloadUrl,
  fileName,
}: UnsavedChangesDialogProps) {
  const handleSaveClick = () => {
    if (downloadUrl) {
      try {
        const link = document.createElement('a')
        link.href = downloadUrl
        const downloadFileName = fileName.endsWith('.enc.json') 
          ? fileName 
          : `${fileName}.enc.json`
        link.download = downloadFileName
        link.style.display = 'none'
        
        document.body.appendChild(link)
        
        setTimeout(() => {
          link.click()
          setTimeout(() => {
            document.body.removeChild(link)
            toast.success('Download started! Check your Downloads folder.')
            onSaveAndContinue()
          }, 100)
        }, 0)
      } catch (error) {
        console.error('Download error:', error)
        toast.error('Download failed. Your browser may be blocking automatic downloads.')
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You have unsaved changes. Would you like to save before continuing?</p>
            {downloadUrl && (
              <div className="text-xs text-muted-foreground/70 pt-2">
                Tip: If download doesn't start,{' '}
                <a
                  href={downloadUrl}
                  download={fileName.endsWith('.enc.json') ? fileName : `${fileName}.enc.json`}
                  className="text-primary hover:text-accent underline underline-offset-2"
                >
                  right-click here to "Save Link As..."
                </a>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Don't Save
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleSaveClick}
            disabled={!downloadUrl}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <DownloadSimple size={16} weight="bold" />
            Save & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
