import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, CheckCircle, EnvelopeSimple } from '@phosphor-icons/react'
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
  const [copiedFull, setCopiedFull] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const emailSubject = `You've been invited to join RelEye`
  
  const emailBody = `Hello ${userName},

You've been invited to join RelEye - a secure relationship network visualization platform.

🔐 Secure & Private
RelEye uses end-to-end encryption and zero-knowledge architecture to keep your data safe. All network files are stored locally on your device and encrypted.

👤 Your Account Details
• Email: ${userEmail}
• Name: ${userName}
• Access Level: ${roleDescription}

🚀 Getting Started

Click the link below to create your account:
${inviteLink}

You'll be asked to choose a password to secure your account. Once your account is created, you can immediately start creating your own relationship networks!

📝 Your Personal Workspace
• Each user has their own independent network files
• Create, save, and load as many networks as you need
• All files are encrypted and stored locally on your device
• Your networks are completely private to you

📋 What You Can Do
• Map relationships between people and organizations
• Visualize connections with advanced analytics
• ${userRole === 'Administrator' ? 'Manage users and system settings' : userRole === 'Editor' ? 'Create and edit network visualizations' : 'View and explore network visualizations'}
• Export and share insights

This invitation expires in 7 days.

Welcome to RelEye!

---
This is an automated invitation from RelEye. If you received this email in error, please disregard it.`

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailBody)
      setCopiedFull(true)
      toast.success('Email content copied to clipboard!')
      setTimeout(() => setCopiedFull(false), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedLink(true)
      toast.success('Invitation link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
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

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pr-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Simple Invitation Process
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {userName} will get their own independent workspace:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 pl-5 list-decimal">
                <li>Send them this invitation email (using the button below)</li>
                <li>They click the link and create their account with a password</li>
                <li>They can immediately start creating their own network files</li>
                <li>Each user manages their own encrypted files independently</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <EnvelopeSimple className="w-4 h-4" weight="duotone" />
                Quick Send Options
              </div>
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
                  {copiedFull ? (
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
                  {copiedLink ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link Only
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Logo size={32} showText={false} animated={false} />
                <div>
                  <div className="text-sm font-semibold text-foreground">RelEye Invitation</div>
                  <div className="text-xs text-muted-foreground">Relationship Network Platform</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground font-medium min-w-[60px]">To:</span>
                  <span className="text-foreground break-all">{userEmail}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground font-medium min-w-[60px]">Subject:</span>
                  <span className="text-foreground">{emailSubject}</span>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
