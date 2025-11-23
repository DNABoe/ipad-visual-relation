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
import type { UserRole } from '@/lib/types'
import type { WorkspaceUser } from '@/lib/userManagement'
import { 
  generateInviteLink,
  generateInviteToken, 
  getRoleDisplayName, 
  getRoleDescription
} from '@/lib/userManagement'
import { format } from 'date-fns'
import { storage } from '@/lib/storage'
import { InviteEmailDialog } from '@/components/InviteEmailDialog'
import { DirectUserDialog } from '@/components/DirectUserDialog'
import * as UserRegistry from '@/lib/userRegistry'

interface AdminDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
}

export function AdminDashboard({
  open,
  onOpenChange,
  currentUserId
}: AdminDashboardProps) {
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showDirectUserDialog, setShowDirectUserDialog] = useState(false)
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
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Array<{
    name: string
    email: string
    role: UserRole
    token: string
    expiry: number
    createdAt: number
  }>>([])
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<WorkspaceUser[]>([])
  const [currentUser, setCurrentUser] = useState<UserRegistry.RegisteredUser | null>(null)
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await UserRegistry.getUserById(currentUserId)
      setCurrentUser(user || null)
    }
    if (open) {
      loadCurrentUser()
    }
  }, [open, currentUserId])

  useEffect(() => {
    const loadPendingInvites = async () => {
      try {
        console.log('[AdminDashboard] Loading pending invites from UserRegistry...')
        const invites = await UserRegistry.getAllInvites()
        console.log('[AdminDashboard] Found', invites.length, 'invites')
        
        const now = Date.now()
        const validInvites = invites
          .filter(inv => inv.expiresAt > now)
          .map(inv => ({
            name: inv.name,
            email: inv.email,
            role: inv.role,
            token: inv.token,
            expiry: inv.expiresAt,
            createdAt: inv.createdAt
          }))
        
        console.log('[AdminDashboard] Valid invites:', validInvites.length)
        setPendingInvites(validInvites)
      } catch (error) {
        console.error('[AdminDashboard] Failed to load pending invites:', error)
      }
    }

    const loadAllRegisteredUsers = async () => {
      try {
        console.log('[AdminDashboard] Loading all registered users from UserRegistry...')
        const registeredUsers = await UserRegistry.getAllUsers()
        console.log('[AdminDashboard] Found', registeredUsers.length, 'registered users')
        
        const workspaceUsers: WorkspaceUser[] = registeredUsers.map(user => ({
          userId: user.userId,
          username: user.name,
          email: user.email,
          role: user.role,
          addedAt: user.createdAt,
          addedBy: 'system',
          status: 'active' as const,
          canInvestigate: user.canInvestigate,
          loginCount: user.loginCount,
          lastLoginAt: user.lastLogin
        }))
        
        console.log('[AdminDashboard] Converted to workspace users:', workspaceUsers.length)
        setAllRegisteredUsers(workspaceUsers)
      } catch (error) {
        console.error('[AdminDashboard] Failed to load registered users:', error)
      }
    }

    if (open) {
      loadPendingInvites()
      loadAllRegisteredUsers()
    }
  }, [open])

  const filteredUsers = useMemo(() => {
    return allRegisteredUsers.filter(user => 
      user.status !== 'pending' &&
      (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.githubLogin?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [allRegisteredUsers, searchQuery])

  const stats = useMemo(() => {
    const totalLogins = allRegisteredUsers.reduce((sum, u) => sum + (u.loginCount || 0), 0)
    const maxLogins = Math.max(...allRegisteredUsers.map(u => u.loginCount || 0), 1)
    
    return {
      total: allRegisteredUsers.length,
      active: allRegisteredUsers.filter(u => u.status === 'active').length,
      pending: pendingInvites.length,
      admins: allRegisteredUsers.filter(u => u.role === 'admin').length,
      editors: allRegisteredUsers.filter(u => u.role === 'editor').length,
      viewers: allRegisteredUsers.filter(u => u.role === 'viewer').length,
      totalLogins,
      maxLogins
    }
  }, [allRegisteredUsers, pendingInvites])

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

    try {
      console.log('[AdminDashboard] ========== CREATING INVITATION ==========')
      console.log('[AdminDashboard] Email:', newUserEmail.trim())
      console.log('[AdminDashboard] Name:', newUserName.trim())
      console.log('[AdminDashboard] Role:', newUserRole)
      console.log('[AdminDashboard] Created by:', currentUserId)
      
      const invite = await UserRegistry.createInvite(
        newUserEmail.trim(),
        newUserName.trim(),
        newUserRole,
        currentUserId
      )
      
      console.log('[AdminDashboard] ✓ Invite created in UserRegistry')
      console.log('[AdminDashboard] Invite token:', invite.token.substring(0, 8) + '...')
      console.log('[AdminDashboard] Expires at:', new Date(invite.expiresAt).toISOString())
      
      const inviteLink = generateInviteLink(invite.token, newUserEmail.trim())
      console.log('[AdminDashboard] Generated invite link:', inviteLink)
      console.log('[AdminDashboard] ========== INVITATION CREATED SUCCESSFULLY ==========')
      
      const pendingInvite = {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        token: invite.token,
        expiry: invite.expiresAt,
        createdAt: invite.createdAt
      }
      
      setPendingInvites(prev => [...prev, pendingInvite])
      
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
    } catch (error) {
      console.error('[AdminDashboard] ❌ Failed to create invitation:', error)
      toast.error('Failed to create invitation. Please try again.')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    if (selectedUser.userId === currentUserId) {
      toast.error('You cannot delete your own account')
      return
    }

    try {
      await UserRegistry.deleteUser(selectedUser.userId)

      setAllRegisteredUsers(prev => prev.filter(u => u.userId !== selectedUser.userId))

      toast.success(`User ${selectedUser.username} removed`)
      setSelectedUser(null)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('[AdminDashboard] Failed to delete user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleChangeRole = async (user: WorkspaceUser, newRole: UserRole) => {
    if (user.userId === currentUserId) {
      toast.error('You cannot change your own role')
      return
    }

    try {
      const registeredUser = await UserRegistry.getUserById(user.userId)
      if (registeredUser) {
        const updatedRegisteredUser = { ...registeredUser, role: newRole }
        await UserRegistry.updateUser(updatedRegisteredUser)
      }

      setAllRegisteredUsers(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, role: newRole } : u
      ))

      toast.success(`${user.username}'s role updated to ${getRoleDisplayName(newRole)}`)
    } catch (error) {
      console.error('[AdminDashboard] Failed to update user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const handleSuspendUser = (user: WorkspaceUser) => {
    if (user.userId === currentUserId) {
      toast.error('You cannot suspend your own account')
      return
    }

    toast.info('User suspension is not yet implemented in this version')
  }

  const handleCopyInviteLink = (invite: typeof pendingInvites[0]) => {
    const inviteLink = generateInviteLink(invite.token, invite.email)
    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied to clipboard')
  }

  const handleRevokeInvite = async (invite: typeof pendingInvites[0]) => {
    try {
      console.log('[AdminDashboard] Revoking invite:', invite.token.substring(0, 8) + '...')
      await UserRegistry.revokeInvite(invite.token)
      console.log('[AdminDashboard] ✓ Invite revoked from UserRegistry')
      
      setPendingInvites(prev => prev.filter(inv => inv.token !== invite.token))

      toast.success(`Invitation revoked for ${invite.name}`)
    } catch (error) {
      console.error('[AdminDashboard] Failed to revoke invite:', error)
      toast.error('Failed to revoke invitation. Please try again.')
    }
  }

  const handleDirectUserCreated = async (createdUser: UserRegistry.RegisteredUser) => {
    console.log('[AdminDashboard] Direct user created, reloading user list...')
    console.log('[AdminDashboard] Created user:', createdUser)
    
    const workspaceUser: WorkspaceUser = {
      userId: createdUser.userId,
      username: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      addedAt: createdUser.createdAt,
      addedBy: currentUserId,
      status: 'active',
      canInvestigate: createdUser.canInvestigate,
      loginCount: 0
    }
    
    console.log('[AdminDashboard] Adding to registered users list')
    setAllRegisteredUsers(prev => [...prev, workspaceUser])
    
    toast.success(`User ${createdUser.name} created successfully!`)
  }

  const handleToggleInvestigateAccess = async (user: WorkspaceUser, canInvestigate: boolean) => {
    try {
      const registeredUser = await UserRegistry.getUserById(user.userId)
      if (registeredUser) {
        const updatedRegisteredUser = { ...registeredUser, canInvestigate }
        await UserRegistry.updateUser(updatedRegisteredUser)
      }

      setAllRegisteredUsers(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, canInvestigate } : u
      ))

      toast.success(`Investigate access ${canInvestigate ? 'granted' : 'revoked'} for ${user.username}`)
    } catch (error) {
      console.error('[AdminDashboard] Failed to update investigate access:', error)
      toast.error('Failed to update investigate access')
    }
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
        <DialogContent className="max-w-[85vw] w-[1100px] h-[85vh] p-0 flex flex-col">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Admin Dashboard</DialogTitle>
                  <DialogDescription className="text-sm">
                    Manage user accounts and system settings
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden min-h-0">
              <Tabs defaultValue="users" className="h-full flex flex-col">
                <div className="px-6 pt-4 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Users
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
                      <Button onClick={() => setShowDirectUserDialog(true)} variant="outline" className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </Button>
                      <Button onClick={() => setShowAddUserDialog(true)} className="flex items-center gap-2">
                        <EnvelopeSimple className="w-4 h-4" />
                        Send Invite
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
                                        <SelectContent position="popper" sideOffset={5}>
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
                          {allRegisteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No users to display</p>
                            </div>
                          ) : (
                            allRegisteredUsers.map(user => {
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

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog} modal={true}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Invite New User</DialogTitle>
            <DialogDescription className="text-sm">
              Send an invitation to collaborate on this workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This email will be used as their login username
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter full name"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The person's full name (used in the invitation email)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger id="role" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">Administrator</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('admin')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">Editor</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('editor')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">Viewer</span>
                      <span className="text-xs text-muted-foreground">{getRoleDescription('viewer')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="text-sm gap-2">
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} modal={true}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedUser?.status === 'pending' ? 'Revoke Invitation' : 'Remove User'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedUser?.status === 'pending' 
                ? `Are you sure you want to revoke the invitation for ${selectedUser?.username}? The invitation link will no longer work.`
                : `Are you sure you want to remove ${selectedUser?.username}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-sm">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="text-sm gap-2">
              <Trash className="w-4 h-4" />
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

      <DirectUserDialog
        open={showDirectUserDialog}
        onOpenChange={setShowDirectUserDialog}
        onUserCreated={handleDirectUserCreated}
        currentUserId={currentUserId}
      />
    </>
  )
}
