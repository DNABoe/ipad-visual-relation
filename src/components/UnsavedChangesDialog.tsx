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
  const downloadFileName = fileName.endsWith('.enc.releye') 
    ? fileName 
    : `${fileName}.enc.releye`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You have unsaved changes. Would you like to save before continuing?</p>
            {downloadUrl && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                <p className="text-sm font-medium text-foreground">
                  To save your work:
                </p>
                <ol className="text-xs space-y-1.5 text-muted-foreground list-decimal list-inside">
                  <li>Right-click the download link below</li>
                  <li>Select "Save Link As..." from the menu</li>
                  <li>Choose where to save the file</li>
                  <li>Click "Continue" below</li>
                </ol>
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    download={downloadFileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors border border-primary/30"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    {downloadFileName}
                  </a>
                </div>
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
            onClick={onSaveAndContinue}
            disabled={!downloadUrl}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
