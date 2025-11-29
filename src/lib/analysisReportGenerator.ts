import type { Workspace, Person, Connection, Group } from './types'

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

interface ConnectionStrength {
  connection: Connection
  fromPerson: Person
  toPerson: Person
  weight: 'thin' | 'medium' | 'thick'
}

interface GroupAnalysis {
  group: Group
  memberCount: number
  internalConnections: number
  externalConnections: number
}

interface AnalysisData {
  metrics: NetworkMetrics
  topConnectedNodes: NodeRanking[]
  strongestConnections: ConnectionStrength[]
  groupAnalysis: GroupAnalysis[]
  keyInsights: string[]
}

function generateRelEyeLogo(doc: any, x: number, y: number, size: number) {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const r = size / 2
  
  doc.setDrawColor(102, 178, 191)
  doc.setLineWidth(0.4)
  doc.circle(centerX, centerY, r * 0.94, 'S')
  
  doc.setLineWidth(0.8)
  const ellipseW = r * 0.88
  const ellipseH = r * 0.6
  doc.ellipse(centerX, centerY, ellipseW, ellipseH, 'S')
  
  const irisR = r * 0.4
  doc.setFillColor(102, 178, 191)
  doc.circle(centerX, centerY, irisR, 'F')
  
  const pupilR = r * 0.18
  doc.setFillColor(25, 30, 45)
  doc.circle(centerX, centerY, pupilR, 'F')
  
  const highlightR = r * 0.07
  doc.setFillColor(255, 255, 255)
  doc.circle(centerX - pupilR * 0.4, centerY - pupilR * 0.4, highlightR, 'F')
  
  const lineLen = r * 0.2
  doc.setLineWidth(0.5)
  doc.setDrawColor(102, 178, 191)
  doc.line(centerX - r, centerY, centerX - r + lineLen, centerY)
  doc.line(centerX + r - lineLen, centerY, centerX + r, centerY)
  doc.line(centerX, centerY - r, centerX, centerY - r + lineLen)
  doc.line(centerX, centerY + r - lineLen, centerX, centerY + r)
}

export async function generateAnalysisPDF(
  workspace: Workspace,
  analysis: AnalysisData
): Promise<void> {
  try {
    console.log('[AnalysisPDF] Starting PDF generation...')
    const { jsPDF } = await import('jspdf')
    console.log('[AnalysisPDF] jsPDF imported successfully')
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin
    
    console.log('[AnalysisPDF] Document initialized:', { pageWidth, pageHeight })

    doc.setFillColor(25, 30, 45)
    doc.rect(0, 0, pageWidth, 30, 'F')

    generateRelEyeLogo(doc, margin, 8, 14)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    const title = 'NETWORK ANALYSIS REPORT'
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, (pageWidth - titleWidth) / 2, 20)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('courier', 'bold')
    doc.text('CLASSIFIED', pageWidth - margin - 30, 12)

    yPosition = 40
    const now = new Date()

    doc.setFillColor(245, 247, 250)
    doc.rect(margin, yPosition, contentWidth, 40, 'F')
    
    doc.setDrawColor(180, 190, 200)
    doc.setLineWidth(0.2)
    doc.rect(margin, yPosition, contentWidth, 40)

    doc.setTextColor(60, 70, 80)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORT METADATA', margin + 5, yPosition + 7)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Report Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin + 5, yPosition + 14)
    doc.text(`Network Name: ${workspace.name || 'Untitled Network'}`, margin + 5, yPosition + 21)
    doc.text(`Classification: CONFIDENTIAL`, margin + 5, yPosition + 28)
    doc.text(`Total Entities Analyzed: ${analysis.metrics.totalNodes}`, margin + 5, yPosition + 35)

    yPosition += 50

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 30, 45)
    doc.text('EXECUTIVE SUMMARY', margin, yPosition)
    
    yPosition += 8
    doc.setDrawColor(102, 178, 191)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 70, 80)

    const summaryText = `This comprehensive network analysis report examines ${analysis.metrics.totalNodes} entities connected through ${analysis.metrics.totalConnections} relationships across ${analysis.metrics.totalGroups} organizational groups. The analysis identifies key influencers, relationship patterns, and strategic intelligence gaps within the network structure.`
    
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 10

    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 30, 45)
    doc.text('NETWORK METRICS', margin, yPosition)
    
    yPosition += 8
    doc.setDrawColor(102, 178, 191)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    
    yPosition += 10

    const metricsData = [
      ['Total Network Nodes', analysis.metrics.totalNodes.toString()],
      ['Total Connections', analysis.metrics.totalConnections.toString()],
      ['Organizational Groups', analysis.metrics.totalGroups.toString()],
      ['Average Connections per Node', analysis.metrics.avgConnectionsPerNode.toFixed(2)],
      ['Isolated Nodes', analysis.metrics.isolatedNodes.toString()],
      ['High-Value Targets (Score ≥8)', analysis.metrics.highValueNodes.toString()],
      ['Identified Advocates', analysis.metrics.advocateNodes.toString()],
      ['Nodes with Intel Reports', analysis.metrics.nodesWithReports.toString()],
    ]

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    metricsData.forEach(([label, value]) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setTextColor(100, 110, 120)
      doc.text(label, margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(25, 30, 45)
      doc.text(value, pageWidth - margin - 5, yPosition, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      yPosition += 7
    })

    yPosition += 10

    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 30, 45)
    doc.text('KEY NETWORK INFLUENCERS', margin, yPosition)
    
    yPosition += 8
    doc.setDrawColor(102, 178, 191)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    
    yPosition += 10

    const top5 = analysis.topConnectedNodes.slice(0, 5)
    
    doc.setFontSize(9)
    top5.forEach((ranking, index) => {
      if (yPosition > pageHeight - 25) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition - 3, contentWidth, 18, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(102, 178, 191)
      doc.text(`${index + 1}.`, margin + 3, yPosition + 3)
      
      doc.setTextColor(25, 30, 45)
      doc.text(ranking.person.name, margin + 10, yPosition + 3)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 110, 120)
      if (ranking.person.position) {
        const posText = doc.splitTextToSize(ranking.person.position, contentWidth - 20)
        doc.text(posText[0], margin + 10, yPosition + 8)
      }
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 70, 80)
      doc.text(`${ranking.connectionCount} connections`, margin + 10, yPosition + 13)
      doc.text(`Strength: ${ranking.connectionStrength}`, margin + 60, yPosition + 13)
      doc.text(`Score: ${ranking.person.score}/10`, margin + 110, yPosition + 13)
      
      if (ranking.hasReport) {
        doc.setTextColor(102, 178, 191)
        doc.text('✓ Intel Report', pageWidth - margin - 25, yPosition + 13)
      }
      
      yPosition += 22
    })

    yPosition += 5

    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 30, 45)
    doc.text('STRONGEST RELATIONSHIPS', margin, yPosition)
    
    yPosition += 8
    doc.setDrawColor(102, 178, 191)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    
    yPosition += 10

    if (analysis.strongestConnections.length > 0) {
      doc.setFontSize(9)
      const top5Connections = analysis.strongestConnections.slice(0, 5)
      
      top5Connections.forEach((conn) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 30, 45)
        doc.text(`${conn.fromPerson.name}`, margin + 5, yPosition)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(102, 178, 191)
        doc.text('⟷', margin + 5 + doc.getTextWidth(conn.fromPerson.name) + 2, yPosition)
        
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 30, 45)
        doc.text(`${conn.toPerson.name}`, margin + 5 + doc.getTextWidth(conn.fromPerson.name) + 8, yPosition)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 110, 120)
        doc.text(`[${conn.weight.toUpperCase()}]`, pageWidth - margin - 20, yPosition, { align: 'right' })
        
        yPosition += 7
      })
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 110, 120)
      doc.text('No strong connections identified in network.', margin + 5, yPosition)
      yPosition += 10
    }

    yPosition += 10

    if (analysis.groupAnalysis.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(25, 30, 45)
      doc.text('GROUP ANALYSIS', margin, yPosition)
      
      yPosition += 8
      doc.setDrawColor(102, 178, 191)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      
      yPosition += 10

      doc.setFontSize(9)
      analysis.groupAnalysis.forEach((group) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 30, 45)
        doc.text(group.group.name, margin + 5, yPosition)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 110, 120)
        doc.text(
          `${group.memberCount} members | ${group.internalConnections} internal | ${group.externalConnections} external`,
          margin + 5,
          yPosition + 5
        )
        
        yPosition += 12
      })

      yPosition += 5
    }

    if (analysis.keyInsights.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(25, 30, 45)
      doc.text('KEY INTELLIGENCE INSIGHTS', margin, yPosition)
      
      yPosition += 8
      doc.setDrawColor(102, 178, 191)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      
      yPosition += 10

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      analysis.keyInsights.forEach((insight, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = margin
        }

        doc.setTextColor(102, 178, 191)
        doc.text('•', margin + 3, yPosition)
        
        doc.setTextColor(60, 70, 80)
        const insightLines = doc.splitTextToSize(insight, contentWidth - 10)
        doc.text(insightLines, margin + 8, yPosition)
        
        yPosition += insightLines.length * 5 + 3
      })
    }

    yPosition = pageHeight - 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150, 160, 170)
    doc.text(
      'This document contains classified intelligence information. Unauthorized disclosure is prohibited.',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    )

    const networkName = workspace.name || 'network'
    const timestamp = now.toISOString().split('T')[0]
    const fileName = `${networkName}_analysis_${timestamp}.pdf`
    
    console.log('[AnalysisPDF] Saving file:', fileName)
    doc.save(fileName)
    console.log('[AnalysisPDF] PDF generation completed successfully')
  } catch (error) {
    console.error('[AnalysisPDF] Error generating PDF:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate analysis PDF: ${error.message}`)
    }
    throw new Error('Failed to generate analysis PDF: Unknown error')
  }
}
