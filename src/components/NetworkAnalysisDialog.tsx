import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { Person, Connection, Group, Workspace } from '@/lib/types'
import {
  Users,
  Link as LinkIcon,
  TrendUp,
  Target,
  Star,
  Warning,
  UsersThree,
  Network,
  Detective,
  ChartBar,
  FileText,
  Download,
} from '@phosphor-icons/react'
import { generateAnalysisPDF } from '@/lib/analysisReportGenerator'
import { toast } from 'sonner'

interface NetworkAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
}

interface NetworkMetrics {
  totalNodes: number
  totalConnections: number
  totalGroups: number
  avgConnectionsPerNode: number
  isolatedNodes: number
  highValueNodes: number
  advocateNodes: number
  nodesWithReports: number
}

interface NodeRanking {
  person: Person
  connectionCount: number
  connectionStrength: number
  hasReport: boolean
}

interface GroupAnalysis {
  group: Group
  memberCount: number
  internalConnections: number
  externalConnections: number
}

interface ConnectionStrength {
  connection: Connection
  fromPerson: Person
  toPerson: Person
  weight: 'thin' | 'medium' | 'thick'
}

export function NetworkAnalysisDialog({ open, onOpenChange, workspace }: NetworkAnalysisDialogProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const metrics = useMemo((): NetworkMetrics => {
    const totalNodes = workspace.persons.filter(p => !p.hidden).length
    const totalConnections = workspace.connections.length
    const totalGroups = workspace.groups.length

    const connectionCounts = new Map<string, number>()
    workspace.connections.forEach(conn => {
      connectionCounts.set(conn.fromPersonId, (connectionCounts.get(conn.fromPersonId) || 0) + 1)
      connectionCounts.set(conn.toPersonId, (connectionCounts.get(conn.toPersonId) || 0) + 1)
    })

    const avgConnectionsPerNode = totalNodes > 0 ? totalConnections * 2 / totalNodes : 0
    const isolatedNodes = workspace.persons.filter(p => !p.hidden && !connectionCounts.has(p.id)).length
    const highValueNodes = workspace.persons.filter(p => !p.hidden && p.score >= 8).length
    const advocateNodes = workspace.persons.filter(p => !p.hidden && p.advocate).length
    
    const personsWithReports = workspace.persons.filter(p => 
      !p.hidden && 
      p.attachments && 
      p.attachments.length > 0 && 
      p.attachments.some(att => att.name.startsWith('Investigation_') && att.type === 'application/pdf')
    )
    const nodesWithReports = personsWithReports.length
    
    console.log('[NetworkAnalysis] Investigation reports check:', {
      totalNodes,
      nodesWithReports,
      personsChecked: workspace.persons.filter(p => !p.hidden).length,
      personsWithAttachments: workspace.persons.filter(p => !p.hidden && p.attachments && p.attachments.length > 0).length,
      reportNames: personsWithReports.flatMap(p => 
        p.attachments?.filter(att => att.name.startsWith('Investigation_')).map(att => att.name) || []
      )
    })

    return {
      totalNodes,
      totalConnections,
      totalGroups,
      avgConnectionsPerNode,
      isolatedNodes,
      highValueNodes,
      advocateNodes,
      nodesWithReports,
    }
  }, [workspace])

  const topConnectedNodes = useMemo((): NodeRanking[] => {
    const connectionCounts = new Map<string, number>()
    const connectionStrengths = new Map<string, number>()

    workspace.connections.forEach(conn => {
      const weightValue = conn.weight === 'thick' ? 3 : conn.weight === 'medium' ? 2 : 1
      
      connectionCounts.set(conn.fromPersonId, (connectionCounts.get(conn.fromPersonId) || 0) + 1)
      connectionCounts.set(conn.toPersonId, (connectionCounts.get(conn.toPersonId) || 0) + 1)
      
      connectionStrengths.set(conn.fromPersonId, (connectionStrengths.get(conn.fromPersonId) || 0) + weightValue)
      connectionStrengths.set(conn.toPersonId, (connectionStrengths.get(conn.toPersonId) || 0) + weightValue)
    })

    const rankings: NodeRanking[] = workspace.persons
      .filter(p => !p.hidden)
      .map(person => ({
        person,
        connectionCount: connectionCounts.get(person.id) || 0,
        connectionStrength: connectionStrengths.get(person.id) || 0,
        hasReport: !!(
          person.attachments && 
          person.attachments.length > 0 && 
          person.attachments.some(att => att.name.startsWith('Investigation_') && att.type === 'application/pdf')
        ),
      }))
      .sort((a, b) => {
        if (b.connectionStrength !== a.connectionStrength) {
          return b.connectionStrength - a.connectionStrength
        }
        return b.connectionCount - a.connectionCount
      })

    return rankings.slice(0, 10)
  }, [workspace])

  const strongestConnections = useMemo((): ConnectionStrength[] => {
    const personMap = new Map(workspace.persons.map(p => [p.id, p]))
    
    return workspace.connections
      .map(conn => {
        const fromPerson = personMap.get(conn.fromPersonId)
        const toPerson = personMap.get(conn.toPersonId)
        
        if (!fromPerson || !toPerson || fromPerson.hidden || toPerson.hidden) {
          return null
        }
        
        return {
          connection: conn,
          fromPerson,
          toPerson,
          weight: conn.weight || 'thin',
        }
      })
      .filter((item): item is ConnectionStrength => item !== null)
      .filter(item => item.weight === 'thick')
      .slice(0, 10)
  }, [workspace])

  const groupAnalysis = useMemo((): GroupAnalysis[] => {
    return workspace.groups.map(group => {
      const members = workspace.persons.filter(p => !p.hidden && p.groupId === group.id)
      const memberIds = new Set(members.map(m => m.id))
      
      const internalConnections = workspace.connections.filter(conn => 
        memberIds.has(conn.fromPersonId) && memberIds.has(conn.toPersonId)
      ).length
      
      const externalConnections = workspace.connections.filter(conn => 
        (memberIds.has(conn.fromPersonId) && !memberIds.has(conn.toPersonId)) ||
        (!memberIds.has(conn.fromPersonId) && memberIds.has(conn.toPersonId))
      ).length
      
      return {
        group,
        memberCount: members.length,
        internalConnections,
        externalConnections,
      }
    })
  }, [workspace])

  const keyInsights = useMemo((): string[] => {
    const insights: string[] = []
    
    if (metrics.isolatedNodes > 0) {
      insights.push(`${metrics.isolatedNodes} isolated node(s) with no connections detected`)
    }
    
    if (topConnectedNodes.length > 0 && topConnectedNodes[0].connectionCount >= 5) {
      insights.push(`${topConnectedNodes[0].person.name} is a key hub with ${topConnectedNodes[0].connectionCount} connections`)
    }
    
    if (metrics.avgConnectionsPerNode < 2) {
      insights.push('Network shows low connectivity - consider identifying missing relationships')
    }
    
    if (metrics.highValueNodes / metrics.totalNodes > 0.3) {
      insights.push('High concentration of high-value targets detected')
    }
    
    const advocatePercentage = metrics.totalNodes > 0 ? (metrics.advocateNodes / metrics.totalNodes) * 100 : 0
    if (advocatePercentage > 25) {
      insights.push(`${Math.round(advocatePercentage)}% of network members are advocates - high influence potential`)
    }
    
    if (metrics.nodesWithReports > 0 && metrics.nodesWithReports === metrics.totalNodes) {
      insights.push(`Complete intelligence coverage: all ${metrics.totalNodes} persons have investigation reports`)
    } else if (metrics.nodesWithReports > 0 && metrics.nodesWithReports >= metrics.totalNodes * 0.7) {
      insights.push(`Strong intelligence coverage: ${metrics.nodesWithReports} of ${metrics.totalNodes} persons have investigation reports`)
    } else if (metrics.nodesWithReports < metrics.totalNodes * 0.3 && metrics.totalNodes > 0) {
      insights.push('Limited intelligence coverage - consider gathering more investigation reports')
    }
    
    const largestGroup = groupAnalysis.length > 0 ? groupAnalysis.reduce((max, g) => g.memberCount > max.memberCount ? g : max, groupAnalysis[0]) : null
    if (largestGroup && largestGroup.memberCount > metrics.totalNodes * 0.4) {
      insights.push(`${largestGroup.group.name} dominates the network with ${largestGroup.memberCount} members`)
    }
    
    const negativeNodes = workspace.persons.filter(p => !p.hidden && p.frameColor === 'red').length
    const positiveNodes = workspace.persons.filter(p => !p.hidden && p.frameColor === 'green').length
    if (negativeNodes > positiveNodes && negativeNodes > metrics.totalNodes * 0.4) {
      insights.push(`High proportion of negative contacts (${negativeNodes}) - consider mitigation strategies`)
    } else if (positiveNodes > metrics.totalNodes * 0.5) {
      insights.push(`Strong positive network sentiment with ${positiveNodes} favorable contacts`)
    }
    
    return insights
  }, [metrics, topConnectedNodes, groupAnalysis, workspace.persons])

  const handleExportAnalysis = async () => {
    setIsGeneratingPDF(true)
    try {
      await generateAnalysisPDF(workspace, {
        metrics,
        topConnectedNodes,
        strongestConnections,
        groupAnalysis,
        keyInsights,
      })
      toast.success('Analysis report exported successfully', { duration: 2000 })
    } catch (error) {
      console.error('Failed to export analysis:', error)
      toast.error('Failed to export analysis report', { duration: 3000 })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-destructive'
    if (score >= 5) return 'text-warning'
    return 'text-muted-foreground'
  }

  const getGroupColor = (color: string) => {
    return `bg-group-${color}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <ChartBar className="h-6 w-6 text-primary" weight="duotone" />
                Network Analysis
              </DialogTitle>
              <DialogDescription className="mt-1">
                Comprehensive intelligence analysis of network relationships and patterns
              </DialogDescription>
            </div>
            <Button
              onClick={handleExportAnalysis}
              disabled={isGeneratingPDF}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Export Report'}
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <Tabs defaultValue="overview" className="flex-1">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nodes">Key Nodes</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(85vh-200px)] px-6 pb-6">
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Total Nodes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.totalNodes}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.totalConnections}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <UsersThree className="h-4 w-4 text-primary" />
                      Groups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.totalGroups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendUp className="h-4 w-4 text-primary" />
                      Avg Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.avgConnectionsPerNode.toFixed(1)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Network Composition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-destructive" />
                        High-Value Targets
                      </span>
                      <span className="font-semibold">{metrics.highValueNodes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning" />
                        Advocates
                      </span>
                      <span className="font-semibold">{metrics.advocateNodes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Detective className="h-4 w-4 text-primary" />
                        With Reports
                      </span>
                      <span className="font-semibold">{metrics.nodesWithReports}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Warning className="h-4 w-4 text-muted-foreground" />
                        Isolated
                      </span>
                      <span className="font-semibold">{metrics.isolatedNodes}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Network Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Connectivity</span>
                        <span className="font-medium">
                          {Math.min(100, (metrics.avgConnectionsPerNode / 5) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (metrics.avgConnectionsPerNode / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Intelligence Coverage</span>
                        <span className="font-medium">
                          {((metrics.nodesWithReports / metrics.totalNodes) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(metrics.nodesWithReports / metrics.totalNodes) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Connected Nodes</span>
                        <span className="font-medium">
                          {(((metrics.totalNodes - metrics.isolatedNodes) / metrics.totalNodes) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${((metrics.totalNodes - metrics.isolatedNodes) / metrics.totalNodes) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="nodes" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Connected & Influential Nodes</CardTitle>
                  <CardDescription>
                    Ranked by connection strength and quantity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topConnectedNodes.map((ranking, index) => (
                      <div
                        key={ranking.person.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        
                        {ranking.person.photo && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                            <img
                              src={ranking.person.photo}
                              alt={ranking.person.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{ranking.person.name}</span>
                            {ranking.person.advocate && (
                              <Star className="h-4 w-4 text-warning flex-shrink-0" weight="fill" />
                            )}
                            {ranking.hasReport && (
                              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {ranking.person.position && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ranking.person.position}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-medium">{ranking.connectionCount} links</div>
                            <div className="text-xs text-muted-foreground">
                              Strength: {ranking.connectionStrength}
                            </div>
                          </div>
                          <Badge variant="outline" className={getScoreColor(ranking.person.score)}>
                            Score: {ranking.person.score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Strongest Connections</CardTitle>
                  <CardDescription>
                    High-strength relationships in the network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {strongestConnections.length > 0 ? (
                    <div className="space-y-3">
                      {strongestConnections.map((item) => (
                        <div
                          key={item.connection.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.fromPerson.name}
                            </div>
                            <Network className="h-4 w-4 text-primary flex-shrink-0" weight="bold" />
                            <div className="text-sm font-medium truncate">
                              {item.toPerson.name}
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {item.weight} connection
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No thick connections found in the network
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="mt-4 space-y-4">
              <div className="space-y-4">
                {groupAnalysis.map((analysis) => (
                  <Card key={analysis.group.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-sm ${getGroupColor(analysis.group.color)}`}
                        />
                        {analysis.group.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{analysis.memberCount}</div>
                          <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{analysis.internalConnections}</div>
                          <div className="text-xs text-muted-foreground">Internal Links</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{analysis.externalConnections}</div>
                          <div className="text-xs text-muted-foreground">External Links</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {groupAnalysis.length === 0 && (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-sm text-muted-foreground text-center">
                        No groups defined in the network
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Key Intelligence Insights</CardTitle>
                  <CardDescription>
                    Automated analysis findings and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {keyInsights.length > 0 ? (
                    <div className="space-y-3">
                      {keyInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <p className="text-sm flex-1">{insight}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No significant insights detected
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
