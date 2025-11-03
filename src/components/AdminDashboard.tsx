import { useState, useMemo } from 'react'
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
  Link as LinkIcon
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { WorkspaceUser, ActivityLog, UserRole } from '@/lib/types'
import { 
  createWorkspaceUser, 
  generateInviteLink, 
  getRoleDisplayName, 
  getRoleDescription,
  filterActivityLog
} from '@/lib/userManagement'
import { format } from 'date-fns'

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
  const [selectedUser, setSelectedUser] = useState<WorkspaceUser | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const currentUser = users.find(u => u.userId === currentUserId)
  const isAdmin = currentUser?.role === 'admin'

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.githubLogin?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return activityLog
    return filterActivityLog(activityLog, { entityType: activityFilter as any })
  }, [activityLog, activityFilter])

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length,
      admins: users.filter(u => u.role === 'admin').length,
      editors: users.filter(u => u.role === 'editor').length,
      viewers: users.filter(u => u.role === 'viewer').length
    }
  }, [users])

  const handleAddUser = () => {
    if (!newUserName.trim()) {
      toast.error('Please enter a username')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (newUserEmail && !emailRegex.test(newUserEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    const newUser = createWorkspaceUser(
      newUserName.trim(),
      newUserEmail.trim() || undefined,
      newUserRole,
      currentUserId
    )

    const inviteLink = generateInviteLink(workspaceId, newUser.inviteToken!)
    
    onUpdateUsers([...users, newUser])
    
    onLogActivity({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: currentUserId,
      username: currentUser?.username || 'Unknown',
      action: 'invited',
      entityType: 'user',
      entityId: newUser.userId,
      details: `Invited ${newUserName} as ${getRoleDisplayName(newUserRole)}`
    })

    navigator.clipboard.writeText(inviteLink)
    toast.success('User invited! Invitation link copied to clipboard')
    
    setNewUserName('')
    setNewUserEmail('')
    setNewUserRole('viewer')
    setShowAddUserDialog(false)
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

  const handleCopyInviteLink = (user: WorkspaceUser) => {
    if (!user.inviteToken) {
      toast.error('No invite token available')
      return
    }

    const inviteLink = generateInviteLink(workspaceId, user.inviteToken)
    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied to clipboard')
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
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
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

            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="users" className="h-full flex flex-col">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Stats
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="users" className="flex-1 px-6 pb-6 overflow-hidden">
                  <div className="flex flex-col gap-4 h-full">
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

                                      <div className="flex gap-1">
                                        {user.status === 'pending' && user.inviteToken && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopyInviteLink(user)}
                                            title="Copy invite link"
                                          >
                                            <LinkIcon className="w-4 h-4" />
                                          </Button>
                                        )}
                                        
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

                <TabsContent value="stats" className="flex-1 px-6 pb-6 overflow-auto">
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

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Viewers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.viewers}</div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2 lg:col-span-3">
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
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll need to share the invite link manually
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
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash className="w-4 h-4 mr-2" />
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
