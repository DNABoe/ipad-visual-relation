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
      <DialogContent className="max-w-[1400px] w-[95vw] max-h-[92vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-10 pt-10 pb-7 border-b border-border bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-lg">
              <EnvelopeSimple className="w-10 h-10 text-primary" weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-4xl font-bold mb-3 text-foreground">Send Invitation</DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground">
                Share access to RelEye with <span className="font-semibold text-foreground">{userName}</span> <span className="text-muted-foreground/60">•</span> <span className="font-medium">{userEmail}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-10 py-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-5 space-y-7">
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8 shadow-md space-y-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" weight="fill" />
                    <h3 className="text-2xl font-bold text-primary">How It Works</h3>
                  </div>
                  <ol className="space-y-5 text-base text-foreground ml-1">
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-base font-bold border border-primary/30">1</span>
                      <div className="pt-1.5 flex-1">
                        <div className="font-semibold mb-1.5 text-lg">Send the invitation</div>
                        <div className="text-muted-foreground leading-relaxed">Click "Open in Email App" or copy the invitation link to share</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-base font-bold border border-primary/30">2</span>
                      <div className="pt-1.5 flex-1">
                        <div className="font-semibold mb-1.5 text-lg">User receives email</div>
                        <div className="text-muted-foreground leading-relaxed">{userName} clicks the invitation link in their email</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-base font-bold border border-primary/30">3</span>
                      <div className="pt-1.5 flex-1">
                        <div className="font-semibold mb-1.5 text-lg">Account creation</div>
                        <div className="text-muted-foreground leading-relaxed">They create their account with a secure password</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-base font-bold border border-primary/30">4</span>
                      <div className="pt-1.5 flex-1">
                        <div className="font-semibold mb-1.5 text-lg">Start using RelEye</div>
                        <div className="text-muted-foreground leading-relaxed">Immediate access to their own workspace</div>
                      </div>
                    </li>
                  </ol>
                  <div className="mt-6 pt-6 border-t border-primary/20">
                    <p className="text-base text-muted-foreground flex items-center gap-3">
                      <span className="text-warning text-2xl">⏰</span>
                      <span>This invitation expires in <strong className="text-foreground font-bold">7 days</strong></span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 px-8 py-5 border-b border-border">
                    <div className="flex items-center gap-4">
                      <Logo size={52} showText={false} animated={false} />
                      <div>
                        <div className="text-lg font-bold text-foreground">RelEye Invitation</div>
                        <div className="text-sm text-muted-foreground">Secure Relationship Network Platform</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-8 py-6 space-y-5">
                    <div className="grid grid-cols-[130px_1fr] gap-x-6 gap-y-4">
                      <span className="text-base text-muted-foreground font-semibold">To:</span>
                      <span className="text-base text-foreground font-medium break-all">{userEmail}</span>
                      
                      <span className="text-base text-muted-foreground font-semibold">Name:</span>
                      <span className="text-base text-foreground font-medium">{userName}</span>
                      
                      <span className="text-base text-muted-foreground font-semibold">Role:</span>
                      <span className="text-base text-foreground font-medium">{roleDescription}</span>
                      
                      <span className="text-base text-muted-foreground font-semibold">Subject:</span>
                      <span className="text-base text-foreground font-medium">{emailSubject}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-7 space-y-7">
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                    <EnvelopeSimple className="w-6 h-6" weight="duotone" />
                    Send Options
                  </h3>
                  <Button 
                    onClick={handleOpenMailClient}
                    className="w-full h-20 text-xl font-semibold gap-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-xl hover:shadow-2xl transition-all"
                    size="lg"
                  >
                    <EnvelopeSimple className="w-8 h-8" weight="duotone" />
                    Open in Email App
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyEmail}
                      className="h-16 flex items-center justify-center gap-3 font-semibold text-lg border-2 hover:border-primary/50 hover:bg-primary/5"
                    >
                      {copiedFull ? (
                        <>
                          <CheckCircle className="w-6 h-6" weight="fill" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-6 h-6" />
                          Copy Full Email
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyLink}
                      className="h-16 flex items-center justify-center gap-3 font-semibold text-lg border-2 hover:border-primary/50 hover:bg-primary/5"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle className="w-6 h-6" weight="fill" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-6 h-6" />
                          Copy Link Only
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden shadow-md">
                  <div className="bg-muted/40 px-7 py-4 border-b border-border">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Preview</span>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="p-8">
                      <pre className="whitespace-pre-wrap font-sans text-base text-foreground/90 leading-relaxed">
                        {emailBody}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-10 py-6 border-t border-border bg-gradient-to-br from-muted/20 to-background">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full h-14 font-semibold text-lg border-2 hover:bg-muted/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
