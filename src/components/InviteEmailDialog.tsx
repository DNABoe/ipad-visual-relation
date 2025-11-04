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

🚀 Get Started
Click the link below to set up your account:
${inviteLink}

📝 Login Information
After creating your account, use your email address (${userEmail}) to log in.

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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <EnvelopeSimple className="w-6 h-6 text-primary" weight="duotone" />
            </div>
            <div>
              <DialogTitle className="text-xl">Invitation Email</DialogTitle>
              <DialogDescription>
                Copy this message and paste it into your email program
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
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

          <ScrollArea className="flex-1 border border-border rounded-lg bg-muted/30">
            <div className="p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </ScrollArea>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="text-xs font-medium text-primary mb-2">📋 Quick Actions</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyLink}
                className="flex-1 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link Only
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenMailClient}
                className="flex-1 flex items-center gap-2"
              >
                <EnvelopeSimple className="w-4 h-4" />
                Open in Mail App
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopyEmail} className="flex items-center gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
