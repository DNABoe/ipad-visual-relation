import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  UserPlus, 
  Users, 
  Trash, 
  Copy, 
  CheckCircle, 
  Clock, 
  Prohibit,
  Shield,
  Eye,
  PencilSimple,
  Activity,
  Crown,
  EnvelopeSimple,
  Link as LinkIcon,
  Detective,
  Warning,
  TrashSimple,
  ChartBar
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { WorkspaceUser, ActivityLog, UserRole } from '@/lib/types'
import { 
  generateInviteLink,
  generateInviteToken, 
  getRoleDisplayName, 
  getRoleDescription,
  filterActivityLog
} from '@/lib/userManagement'
import { format } from 'date-fns'
import { storage } from '@/lib/storage'
import { InviteEmailDialog } from '@/components/InviteEmailDialog'
import * as UserRegistry from '@/lib/userRegistry'

interface AdminDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: WorkspaceUser[]
  activityLog: ActivityLog[]
  currentUserId: string
  workspaceId: string
  onUpdateUsers: (users: WorkspaceUser[]) => void
  onLogActivity: (log: ActivityLog) => void
}

export function AdminDashboard({
  open,
  onOpenChange,
  users,
  activityLog,
  currentUserId,
  workspaceId,
  onUpdateUsers,
  onLogActivity
}: AdminDashboardProps) {
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showInviteEmailDialog, setShowInviteEmailDialog] = useState(false)
  const [inviteEmailData, setInviteEmailData] = useState<{
    userName: string
    userEmail: string
    userRole: string
    roleDescription: string
    inviteLink: string
  } | null>(null)
  const [resetConfirmStep, setResetConfirmStep] = useState(0)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [selectedUser, setSelectedUser] = useState<WorkspaceUser | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Array<{
    name: string
    email: string
    role: UserRole
    token: string
    expiry: number
    createdAt: number
  }>>([])

  const currentUser = users.find(u => u.userId === currentUserId)
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    const loadPendingInvites = async () => {
      try {
        const invites = await storage.get<typeof pendingInvites>('pending-invites') || []
        const now = Date.now()
        const validInvites = invites.filter(inv => inv.expiry > now)
        
        if (validInvites.length !== invites.length) {
          await storage.set('pending-invites', validInvites)
        }
        
        setPendingInvites(validInvites)
      } catch (error) {
        console.error('Failed to load pending invites:', error)
      }
    }

    if (open) {
      loadPendingInvites()
    }
  }, [open])

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.status !== 'pending' &&
      (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.githubLogin?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [users, searchQuery])

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return activityLog
    return filterActivityLog(activityLog, { entityType: activityFilter as any })
  }, [activityLog, activityFilter])

  const stats = useMemo(() => {
    const totalLogins = users.reduce((sum, u) => sum + (u.loginCount || 0), 0)
    const maxLogins = Math.max(...users.map(u => u.loginCount || 0), 1)
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      pending: pendingInvites.length,
      admins: users.filter(u => u.role === 'admin').length,
      editors: users.filter(u => u.role === 'editor').length,
      viewers: users.filter(u => u.role === 'viewer').length,
      totalLogins,
      maxLogins
    }
  }, [users, pendingInvites])

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserEmail.trim()) {
      toast.error('Email address is required for invitations')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!newUserName.trim()) {
      toast.error('Please enter the user\'s name')
      return
    }

    console.log('[AdminDashboard] ========== CREATING INVITATION ==========')
    const inviteToken = generateInviteToken()
    console.log('[AdminDashboard] Generated invite token:', inviteToken)
    
    const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000)
    console.log('[AdminDashboard] Invitation expiry:', new Date(expiry).toISOString())
    
    const pendingInvite = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      token: inviteToken,
      expiry,
      createdAt: Date.now()
    }

    console.log('[AdminDashboard] Pending invite object:', pendingInvite)
    console.log('[AdminDashboard] Fetching existing invites from storage...')
    
    const invites = await storage.get<typeof pendingInvite[]>('pending-invites') || []
    console.log('[AdminDashboard] Existing invites count:', invites.length)
    
    const updatedInvites = [...invites, pendingInvite]
    console.log('[AdminDashboard] Saving updated invites (count:', updatedInvites.length, ')...')
    
    await storage.set('pending-invites', updatedInvites)
    console.log('[AdminDashboard] ✓ Invites saved to storage')
    
    console.log('[AdminDashboard] Verifying save...')
    const verifyInvites = await storage.get<typeof pendingInvite[]>('pending-invites')
    console.log('[AdminDashboard] Verification: found', verifyInvites?.length || 0, 'invites')
    
    const foundInvite = verifyInvites?.find(inv => inv.token === inviteToken)
    console.log('[AdminDashboard] Verification: new invite found:', !!foundInvite)
    
    if (!foundInvite) {
      console.error('[AdminDashboard] ❌ Failed to verify invite was saved!')
      toast.error('Failed to save invitation. Please try again.')
      return
    }
    
    setPendingInvites(updatedInvites)

    const inviteLink = generateInviteLink(inviteToken, newUserEmail.trim())
    console.log('[AdminDashboard] Generated invite link:', inviteLink)
    console.log('[AdminDashboard] ========== INVITATION CREATED SUCCESSFULLY ==========')
    
    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'invited',
      entityType: 'user',
      entityId: inviteToken,
      details: `Invited ${newUserName.trim()} (${newUserEmail}) as ${getRoleDisplayName(newUserRole)}`
    })

    setInviteEmailData({
      userName: newUserName.trim(),
      userEmail: newUserEmail.trim(),
      userRole: getRoleDisplayName(newUserRole),
      roleDescription: getRoleDescription(newUserRole),
      inviteLink
    })
    
    setNewUserName('')
    setNewUserEmail('')
    setNewUserRole('viewer')
    setShowAddUserDialog(false)
    setShowInviteEmailDialog(true)
    
    toast.success('User invited successfully!')
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    if (selectedUser.userId === currentUserId) {
      toast.error('You cannot delete your own account')
      return
    }

    const updatedUsers = users.filter(u => u.userId !== selectedUser.userId)
    onUpdateUsers(updatedUsers)

    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'removed',
      entityType: 'user',
      entityId: selectedUser.userId,
      details: `Removed user ${selectedUser.username}`
    })

    toast.success(`User ${selectedUser.username} removed`)
    setSelectedUser(null)
    setShowDeleteDialog(false)
  }

  const handleChangeRole = (user: WorkspaceUser, newRole: UserRole) => {
    if (user.userId === currentUserId) {
      toast.error('You cannot change your own role')
      return
    }

    const updatedUsers: WorkspaceUser[] = users.map(u => 
      u.userId === user.userId ? { ...u, role: newRole } : u
    )
    onUpdateUsers(updatedUsers)

    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'updated',
      entityType: 'user',
      entityId: user.userId,
      details: `Changed ${user.username}'s role to ${getRoleDisplayName(newRole)}`
    })

    toast.success(`${user.username}'s role updated to ${getRoleDisplayName(newRole)}`)
  }

  const handleSuspendUser = (user: WorkspaceUser) => {
    if (user.userId === currentUserId) {
      toast.error('You cannot suspend your own account')
      return
    }

    const newStatus: WorkspaceUser['status'] = user.status === 'suspended' ? 'active' : 'suspended'
    const updatedUsers: WorkspaceUser[] = users.map(u => 
      u.userId === user.userId ? { ...u, status: newStatus } : u
    )
    onUpdateUsers(updatedUsers)

    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: newStatus === 'suspended' ? 'suspended' : 'reactivated',
      entityType: 'user',
      entityId: user.userId,
      details: `${newStatus === 'suspended' ? 'Suspended' : 'Reactivated'} user ${user.username}`
    })

    toast.success(`User ${user.username} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`)
  }

  const handleCopyInviteLink = (invite: typeof pendingInvites[0]) => {
    const inviteLink = generateInviteLink(invite.token, invite.email)
    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied to clipboard')
  }

  const handleRevokeInvite = async (invite: typeof pendingInvites[0]) => {
    const updatedInvites = pendingInvites.filter(inv => inv.token !== invite.token)
    await storage.set('pending-invites', updatedInvites)
    setPendingInvites(updatedInvites)

    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'revoked',
      entityType: 'user',
      entityId: invite.token,
      details: `Revoked invitation for ${invite.name} (${invite.email})`
    })

    toast.success(`Invitation revoked for ${invite.name}`)
  }

  const handleToggleInvestigateAccess = (user: WorkspaceUser, canInvestigate: boolean) => {
    const updatedUsers: WorkspaceUser[] = users.map(u => 
      u.userId === user.userId ? { ...u, canInvestigate } : u
    )
    onUpdateUsers(updatedUsers)

    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'updated',
      entityType: 'user',
      entityId: user.userId,
      details: `${canInvestigate ? 'Granted' : 'Revoked'} investigate access for ${user.username}`
    })

    toast.success(`Investigate access ${canInvestigate ? 'granted' : 'revoked'} for ${user.username}`)
  }

  const handleResetApplication = async () => {
    if (resetConfirmStep === 0) {
      setResetConfirmStep(1)
      return
    }

    if (resetConfirmStep === 1) {
      if (resetConfirmText.toLowerCase() !== 'reset everything') {
        toast.error('Please type "RESET EVERYTHING" to confirm')
        return
      }
      setResetConfirmStep(2)
      return
    }

    if (resetConfirmStep === 2) {
      try {
        console.log('[AdminDashboard] ⚠️⚠️⚠️ RESETTING ALL DATA ⚠️⚠️⚠️')
        
        await UserRegistry.resetAllData()
        
        await storage.delete('app-settings')
        await storage.delete('setup-completed')
        
        toast.success('Application reset complete. Reloading...')
        
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        console.error('Failed to reset application:', error)
        toast.error('Failed to reset application. Please check your connection to the backend.')
      }
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />
      case 'editor':
        return <PencilSimple className="w-4 h-4" />
      case 'viewer':
        return <Eye className="w-4 h-4" />
    }
  }

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'viewer':
        return 'outline'
    }
  }

  const getStatusBadge = (status: WorkspaceUser['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive"><Prohibit className="w-3 h-3 mr-1" />Suspended</Badge>
    }
  }

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-[1400px] h-[90vh] p-0 flex flex-col">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Admin Dashboard</DialogTitle>
                  <DialogDescription>
                    Manage users, view activity, and control workspace access
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden min-h-0">
              <Tabs defaultValue="users" className="h-full flex flex-col">
                <div className="px-6 pt-4 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-2">
                      <ChartBar className="w-4 h-4" />
                      Stats
                    </TabsTrigger>
                    <TabsTrigger value="reset" className="flex items-center gap-2">
                      <Warning className="w-4 h-4" />
                      Reset
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="users" className="flex-1 px-6 pb-6 overflow-hidden">
                  <div className="flex flex-col gap-4 h-full">
                    {stats.pending > 0 && (
                      <div className="rounded-lg bg-warning/10 border border-warning/30 p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-warning" />
                          <span className="font-medium text-warning">
                            {stats.pending} pending invitation{stats.pending !== 1 ? 's' : ''}
                          </span>
                          <span className="text-muted-foreground">
                            · Waiting for user{stats.pending !== 1 ? 's' : ''} to accept
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Search users by name, email, or GitHub..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button onClick={() => setShowAddUserDialog(true)} className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite User
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 border border-border rounded-lg">
                      <div className="p-4 space-y-3">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No users found</p>
                          </div>
                        ) : (
                          filteredUsers.map(user => (
                            <Card key={user.userId} className="p-4">
                              <div className="flex items-start gap-4">
                                {user.githubAvatar ? (
                                  <img 
                                    src={user.githubAvatar} 
                                    alt={user.username}
                                    className="w-12 h-12 rounded-full"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                    {user.username.substring(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold truncate">{user.username}</h4>
                                    {user.userId === currentUserId && (
                                      <Badge variant="secondary" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  
                                  {user.email && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                      <EnvelopeSimple className="w-3 h-3" />
                                      <span className="truncate">{user.email}</span>
                                    </div>
                                  )}

                                  {user.githubLogin && (
                                    <div className="text-xs text-muted-foreground mb-2">
                                      GitHub: @{user.githubLogin}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(user.status)}
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                                      {getRoleIcon(user.role)}
                                      {getRoleDisplayName(user.role)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Added {format(user.addedAt, 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  {user.userId !== currentUserId && (
                                    <>
                                      <Select
                                        value={user.role}
                                        onValueChange={(value) => handleChangeRole(user, value as UserRole)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="editor">Editor</SelectItem>
                                          <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <div className="flex items-center gap-2 py-1">
                                        <Detective className="w-4 h-4 text-warning" />
                                        <Label htmlFor={`investigate-${user.userId}`} className="text-xs cursor-pointer">Investigate</Label>
                                        <Switch
                                          id={`investigate-${user.userId}`}
                                          checked={user.canInvestigate ?? true}
                                          onCheckedChange={(checked) => handleToggleInvestigateAccess(user, checked)}
                                          className="scale-75"
                                        />
                                      </div>

                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSuspendUser(user)}
                                          title={user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                        >
                                          <Prohibit className="w-4 h-4" />
                                        </Button>

                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedUser(user)
                                            setShowDeleteDialog(true)
                                          }}
                                          title="Remove user"
                                        >
                                          <Trash className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                        
                        {pendingInvites.length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-2">
                                <Clock className="w-4 h-4 text-warning" />
                                <h3 className="font-semibold text-sm">Pending Invitations</h3>
                                <Badge variant="secondary">{pendingInvites.length}</Badge>
                              </div>
                              {pendingInvites.map(invite => (
                                <Card key={invite.token} className="p-4 bg-warning/5 border-warning/20">
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning font-semibold">
                                      {invite.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{invite.name}</h4>
                                        <Badge variant="secondary" className="text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                        <EnvelopeSimple className="w-3 h-3" />
                                        <span className="truncate">{invite.email}</span>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={getRoleBadgeVariant(invite.role)} className="flex items-center gap-1">
                                          {getRoleIcon(invite.role)}
                                          {getRoleDisplayName(invite.role)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Invited {format(invite.createdAt, 'MMM d, yyyy')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          • Expires {format(invite.expiry, 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyInviteLink(invite)}
                                        title="Copy invite link"
                                      >
                                        <LinkIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRevokeInvite(invite)}
                                        title="Revoke invitation"
                                      >
                                        <Prohibit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="flex-1 px-6 pb-6 overflow-hidden">
                  <div className="flex flex-col gap-4 h-full">
                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activity</SelectItem>
                        <SelectItem value="user">User Management</SelectItem>
                        <SelectItem value="person">Person Changes</SelectItem>
                        <SelectItem value="connection">Connections</SelectItem>
                        <SelectItem value="group">Groups</SelectItem>
                        <SelectItem value="workspace">Workspace</SelectItem>
                      </SelectContent>
                    </Select>

                    <ScrollArea className="flex-1 border border-border rounded-lg">
                      <div className="p-4 space-y-2">
                        {filteredActivity.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No activity to display</p>
                          </div>
                        ) : (
                          filteredActivity.slice().reverse().map(log => (
                            <div key={log.id} className="p-3 rounded-lg bg-card border border-border">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded bg-primary/10 text-primary">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{log.username}</span>
                                    <span className="text-sm text-muted-foreground">{log.action}</span>
                                    {log.entityType && (
                                      <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                                    )}
                                  </div>
                                  {log.details && (
                                    <p className="text-sm text-muted-foreground">{log.details}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(log.timestamp, 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="flex-1 px-6 pb-6 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{stats.total}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-success">{stats.active}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-warning">{stats.pending}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-accent">{stats.totalLogins}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{stats.admins}</div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Editors</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{stats.editors}</div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>User Login Activity</CardTitle>
                          <CardDescription>Number of times each user has logged in</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No users to display</p>
                            </div>
                          ) : (
                            users.map(user => {
                              const loginCount = user.loginCount || 0
                              const percentage = stats.maxLogins > 0 ? (loginCount / stats.maxLogins) * 100 : 0
                              
                              return (
                                <div key={user.userId} className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{user.username}</span>
                                      {user.role === 'admin' && <Crown className="w-3 h-3 text-accent" />}
                                      {user.userId === currentUserId && <Badge variant="secondary" className="text-xs">You</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground">{loginCount} login{loginCount !== 1 ? 's' : ''}</span>
                                      {user.lastLoginAt && (
                                        <span className="text-xs text-muted-foreground">
                                          {format(user.lastLoginAt, 'MMM d, h:mm a')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <Progress 
                                      value={percentage} 
                                      className="h-2"
                                    />
                                    <div 
                                      className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>User Roles</CardTitle>
                          <CardDescription>Distribution of permissions across your workspace</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Crown className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">Administrator</span>
                                  <span className="text-sm text-muted-foreground">{stats.admins}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{getRoleDescription('admin')}</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                              <PencilSimple className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">Editor</span>
                                  <span className="text-sm text-muted-foreground">{stats.editors}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{getRoleDescription('editor')}</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                              <Eye className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">Viewer</span>
                                  <span className="text-sm text-muted-foreground">{stats.viewers}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{getRoleDescription('viewer')}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="reset" className="flex-1 px-6 pb-6 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 pr-4">
                      <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader>
                          <CardTitle className="text-destructive flex items-center gap-2">
                            <Warning className="w-5 h-5" />
                            Application Reset
                          </CardTitle>
                          <CardDescription>
                            Reset the entire application to its initial state
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg bg-background border border-destructive/30 p-4 space-y-3">
                            <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                              <Warning className="w-4 h-4" />
                              What will be deleted
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2 pl-6">
                              <li>• All user accounts and credentials</li>
                              <li>• All login history and permissions</li>
                              <li>• All application settings</li>
                              <li>• The application will reload and require a new admin setup</li>
                            </ul>
                          </div>

                          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                            <p className="text-sm font-medium text-primary mb-2">ℹ️ Important Note</p>
                            <p className="text-sm text-muted-foreground">
                              This action does NOT delete your workspace files. Only user accounts and application settings will be reset.
                              Your networks, people, connections, and all data will remain intact.
                            </p>
                          </div>

                          <Button
                            variant="destructive"
                            onClick={() => setShowResetDialog(true)}
                            className="w-full gap-2"
                            size="lg"
                          >
                            <TrashSimple className="w-5 h-5" />
                            Reset Application
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on this workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This email will be used as their login username
              </p>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter full name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The person's full name (used in the invitation email)
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Administrator</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('admin')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Editor</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('editor')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Viewer</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('viewer')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'pending' ? 'Revoke Invitation' : 'Remove User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === 'pending' 
                ? `Are you sure you want to revoke the invitation for ${selectedUser?.username}? The invitation link will no longer work.`
                : `Are you sure you want to remove ${selectedUser?.username}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash className="w-4 h-4 mr-2" />
              {selectedUser?.status === 'pending' ? 'Revoke Invitation' : 'Remove User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={(open) => {
        setShowResetDialog(open)
        if (!open) {
          setResetConfirmStep(0)
          setResetConfirmText('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Warning className="w-6 h-6" />
              Reset Application
            </DialogTitle>
            <DialogDescription>
              {resetConfirmStep === 0 && "This will delete all user credentials and reset the application to its initial state."}
              {resetConfirmStep === 1 && "This action is IRREVERSIBLE and will require setting up a new admin account."}
              {resetConfirmStep === 2 && "Final confirmation: This will delete everything and reload the application."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetConfirmStep === 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Warning className="w-4 h-4" />
                  Warning: The following will be deleted
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 pl-6">
                  <li>• All user accounts and credentials</li>
                  <li>• All login history and permissions</li>
                  <li>• All application settings</li>
                  <li>• You will need to set up a new admin account</li>
                </ul>
              </div>
            )}

            {resetConfirmStep === 1 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                  <p className="text-sm font-semibold text-destructive mb-2">⚠️ Final Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Type <span className="font-mono font-bold text-foreground">RESET EVERYTHING</span> below to confirm:
                  </p>
                </div>
                <Input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="RESET EVERYTHING"
                  className="font-mono"
                  autoFocus
                />
              </div>
            )}

            {resetConfirmStep === 2 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Warning className="w-4 h-4" />
                  Last chance to cancel
                </p>
                <p className="text-sm text-muted-foreground">
                  Clicking "Reset Now" will immediately delete all data and reload the application.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResetDialog(false)
                setResetConfirmStep(0)
                setResetConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetApplication}
              disabled={resetConfirmStep === 1 && resetConfirmText.toLowerCase() !== 'reset everything'}
            >
              {resetConfirmStep === 0 && "Continue"}
              {resetConfirmStep === 1 && "Confirm Reset"}
              {resetConfirmStep === 2 && "Reset Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {inviteEmailData && (
        <InviteEmailDialog
          open={showInviteEmailDialog}
          onOpenChange={setShowInviteEmailDialog}
          userName={inviteEmailData.userName}
          userEmail={inviteEmailData.userEmail}
          userRole={inviteEmailData.userRole}
          roleDescription={inviteEmailData.roleDescription}
          inviteLink={inviteEmailData.inviteLink}
        />
      )}
    </>
  )
}
