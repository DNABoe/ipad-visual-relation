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
  downloadUrl: string | null
  fileName: string
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  downloadUrl,
  fileName,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You have unsaved changes. Would you like to save before continuing?</p>
            {downloadUrl && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">To save your work:</p>
                <a
                  href={downloadUrl}
                  download={`${fileName}.enc.json`}
                  className="text-sm text-accent hover:underline font-medium inline-flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadSimple size={16} weight="bold" />
                  {fileName}.enc.json
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  Right-click the link above and choose "Save link as..."
                </p>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
