import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, CheckCircle, EnvelopeSimple, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Logo } from '@/components/Logo'

interface InviteEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  userEmail: string
  userRole: string
  roleDescription: string
  inviteLink: string
}

export function InviteEmailDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  userRole,
  roleDescription,
  inviteLink
}: InviteEmailDialogProps) {
  const [copied, setCopied] = useState(false)

  const emailSubject = `You've been invited to join RelEye`
  
  const emailBody = `Hello ${userName},

You've been invited to join RelEye - a secure relationship network visualization platform.

🔐 Secure & Private
RelEye uses end-to-end encryption and zero-knowledge architecture to keep your data safe. All network files are stored locally and encrypted.

👤 Your Account Details
• Email: ${userEmail}
• Role: ${userRole}
• Access: ${roleDescription}

🚀 IMPORTANT: Two-Step Setup Process

STEP 1: Accept Your Invitation
Click the link below to create your account:
${inviteLink}

STEP 2: Request the Workspace File
After creating your account, you'll need the encrypted workspace file (.enc.releye) to access the network. Contact the person who invited you to share this file with you. Once you receive it, load it using the "Load Network" button.

📝 Login Information
After completing both steps, use your email address (${userEmail}) to log in.

📋 What You Can Do
• Map relationships between people and organizations
• Visualize connections with advanced analytics
• Collaborate securely with your team
• Export and share insights

This invitation expires in 7 days.

Welcome to RelEye!

---
This is an automated invitation from RelEye. If you received this email in error, please disregard it.`

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailBody)
      setCopied(true)
      toast.success('Email content copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invitation link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleOpenMailClient = () => {
    const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <EnvelopeSimple className="w-6 h-6 text-primary" weight="duotone" />
            </div>
            <div>
              <DialogTitle className="text-xl">Invitation Email</DialogTitle>
              <DialogDescription>
                Send this invitation to your colleague
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 overflow-y-auto min-h-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 pb-4">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
                  <Warning className="w-5 h-5" />
                  Important: You Must Share the Workspace File
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  RelEye uses local-only storage for security. For {userName} to access the workspace, you must:
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 pl-5 list-decimal">
                  <li>Send them this invitation email (using the button below)</li>
                  <li><strong>Share your encrypted workspace file (.enc.releye)</strong> via email, secure file transfer, or cloud storage</li>
                  <li>They will accept the invitation and create their account</li>
                  <li>Then they will load the workspace file you shared</li>
                </ol>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                  <EnvelopeSimple className="w-4 h-4" weight="duotone" />
                  Quick Send Options
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleOpenMailClient}
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <EnvelopeSimple className="w-5 h-5" weight="duotone" />
                    Open in Default Email App
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyEmail}
                      className="flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Full Email
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link Only
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Logo size={32} showText={false} animated={false} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">RelEye Invitation</div>
                    <div className="text-xs text-muted-foreground">Relationship Network Platform</div>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex gap-2 text-sm">
                    <span className="text-muted-foreground font-medium min-w-[60px]">To:</span>
                    <span className="text-foreground">{userEmail}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-muted-foreground font-medium min-w-[60px]">Subject:</span>
                    <span className="text-foreground">{emailSubject}</span>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {emailBody}
                </pre>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
