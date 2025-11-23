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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <EnvelopeSimple className="w-8 h-8 text-primary" weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-3xl font-bold mb-2">Send Invitation</DialogTitle>
              <DialogDescription className="text-base">
                Share access to RelEye with <span className="font-semibold text-foreground">{userName}</span> ({userEmail})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-8 py-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-primary flex-shrink-0" weight="fill" />
                    <h3 className="text-lg font-bold text-primary">How It Works</h3>
                  </div>
                  <ol className="space-y-4 text-sm text-foreground ml-1">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
                      <div className="pt-1">
                        <div className="font-semibold mb-1">Send the invitation</div>
                        <div className="text-muted-foreground">Click "Open in Email App" or copy the invitation link</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
                      <div className="pt-1">
                        <div className="font-semibold mb-1">User receives email</div>
                        <div className="text-muted-foreground">{userName} clicks the invitation link</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">3</span>
                      <div className="pt-1">
                        <div className="font-semibold mb-1">Account creation</div>
                        <div className="text-muted-foreground">They create their account with a secure password</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">4</span>
                      <div className="pt-1">
                        <div className="font-semibold mb-1">Start using RelEye</div>
                        <div className="text-muted-foreground">Immediate access to their own workspace</div>
                      </div>
                    </li>
                  </ol>
                  <div className="mt-5 pt-5 border-t border-primary/20">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-warning text-xl">⏰</span>
                      <span>This invitation expires in <strong className="text-foreground">7 days</strong></span>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Logo size={44} showText={false} animated={false} />
                      <div>
                        <div className="text-base font-bold text-foreground">RelEye Invitation</div>
                        <div className="text-xs text-muted-foreground">Secure Relationship Network Platform</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-3">
                      <span className="text-sm text-muted-foreground font-semibold">To:</span>
                      <span className="text-sm text-foreground font-medium break-all">{userEmail}</span>
                      
                      <span className="text-sm text-muted-foreground font-semibold">Name:</span>
                      <span className="text-sm text-foreground font-medium">{userName}</span>
                      
                      <span className="text-sm text-muted-foreground font-semibold">Role:</span>
                      <span className="text-sm text-foreground font-medium">{roleDescription}</span>
                      
                      <span className="text-sm text-muted-foreground font-semibold">Subject:</span>
                      <span className="text-sm text-foreground font-medium">{emailSubject}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <EnvelopeSimple className="w-5 h-5" weight="duotone" />
                    Send Options
                  </h3>
                  <Button 
                    onClick={handleOpenMailClient}
                    className="w-full h-16 text-lg font-semibold gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
                    size="lg"
                  >
                    <EnvelopeSimple className="w-7 h-7" weight="duotone" />
                    Open in Email App
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyEmail}
                      className="h-14 flex items-center justify-center gap-2 font-medium text-base"
                    >
                      {copiedFull ? (
                        <>
                          <CheckCircle className="w-5 h-5" weight="fill" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Full Email
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyLink}
                      className="h-14 flex items-center justify-center gap-2 font-medium text-base"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle className="w-5 h-5" weight="fill" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Link Only
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                  <div className="bg-muted/40 px-5 py-3 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Preview</span>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="p-6">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">
                        {emailBody}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-8 py-5 border-t border-border bg-muted/20">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full h-12 font-semibold text-base"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
