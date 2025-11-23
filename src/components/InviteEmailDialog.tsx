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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-8 pt-6 pb-4 border-b border-border bg-gradient-to-br from-background to-muted/20 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-md">
              <EnvelopeSimple className="w-6 h-6 text-primary" weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold mb-1.5 text-foreground">Send Invitation</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Share access to RelEye with <span className="font-semibold text-foreground">{userName}</span> <span className="text-muted-foreground/60">•</span> <span className="font-medium break-all">{userEmail}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" weight="fill" />
                    <h3 className="text-sm font-bold text-primary">How It Works</h3>
                  </div>
                  <ol className="space-y-3 ml-0.5">
                    <li className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 mt-0.5">1</span>
                      <div className="pt-0.5 flex-1 min-w-0">
                        <div className="font-semibold mb-0.5 text-sm">Send the invitation</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">Click "Open in Email App" or copy the invitation link to share</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 mt-0.5">2</span>
                      <div className="pt-0.5 flex-1 min-w-0">
                        <div className="font-semibold mb-0.5 text-sm">User receives email</div>
                        <div className="text-xs text-muted-foreground leading-relaxed break-words">{userName} clicks the invitation link in their email</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 mt-0.5">3</span>
                      <div className="pt-0.5 flex-1 min-w-0">
                        <div className="font-semibold mb-0.5 text-sm">Account creation</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">They create their account with a secure password</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 mt-0.5">4</span>
                      <div className="pt-0.5 flex-1 min-w-0">
                        <div className="font-semibold mb-0.5 text-sm">Start using RelEye</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">Immediate access to their own workspace</div>
                      </div>
                    </li>
                  </ol>
                  <div className="pt-3 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="text-warning text-sm">⏰</span>
                      <span>This invitation expires in <strong className="text-foreground font-semibold">7 days</strong></span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <EnvelopeSimple className="w-4 h-4" weight="duotone" />
                    Send Options
                  </h3>
                  <Button 
                    onClick={handleOpenMailClient}
                    className="w-full h-10 text-sm font-semibold gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all"
                  >
                    <EnvelopeSimple className="w-4 h-4" weight="duotone" />
                    Open in Email App
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyEmail}
                      className="h-9 flex items-center justify-center gap-2 font-medium text-sm hover:border-primary/50 hover:bg-primary/5"
                    >
                      {copiedFull ? (
                        <>
                          <CheckCircle className="w-4 h-4" weight="fill" />
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
                      className="h-9 flex items-center justify-center gap-2 font-medium text-sm hover:border-primary/50 hover:bg-primary/5"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle className="w-4 h-4" weight="fill" />
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

                <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <Logo size={28} showText={false} animated={false} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground">RelEye Invitation</div>
                        <div className="text-xs text-muted-foreground">Secure Relationship Network Platform</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
                      <span className="text-muted-foreground font-medium">To:</span>
                      <span className="text-foreground font-medium break-all">{userEmail}</span>
                      
                      <span className="text-muted-foreground font-medium">Name:</span>
                      <span className="text-foreground font-medium break-words">{userName}</span>
                      
                      <span className="text-muted-foreground font-medium">Role:</span>
                      <span className="text-foreground font-medium">{roleDescription}</span>
                      
                      <span className="text-muted-foreground font-medium">Subject:</span>
                      <span className="text-foreground font-medium break-words">{emailSubject}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 overflow-hidden shadow-sm flex flex-col">
                <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Preview</span>
                </div>
                <ScrollArea className="flex-1 h-[500px]">
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed break-words">
                      {emailBody}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-8 py-4 border-t border-border bg-gradient-to-br from-muted/20 to-background flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full h-10 font-medium text-sm hover:bg-muted/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
