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
      const link = document.createElement('a')
      link.href = downloadUrl
      const downloadFileName = fileName.endsWith('.enc.json') 
        ? fileName 
        : `${fileName}.enc.json`
      link.download = downloadFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        onSaveAndContinue()
      }, 100)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You have unsaved changes. Would you like to save before continuing?</p>
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
