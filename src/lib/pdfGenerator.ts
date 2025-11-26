interface InvestigationData {
  name: string
  position: string
  country: string
  report: string
  photo?: string
}

export async function generateInvestigationPDF(data: InvestigationData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  doc.setFillColor(25, 30, 45)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('courier', 'bold')
  doc.text('CLASSIFIED', margin, 12)
  doc.text('CLASSIFIED', pageWidth - margin - 30, 12)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const title = 'INTELLIGENCE ASSESSMENT REPORT'
  const titleWidth = doc.getTextWidth(title)
  doc.text(title, (pageWidth - titleWidth) / 2, 23)

  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  const now = new Date()
  const reportNumber = `REF: INT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  doc.text(reportNumber, pageWidth / 2, 30, { align: 'center' })

  yPosition = 45

  doc.setFillColor(240, 242, 245)
  doc.rect(margin, yPosition, contentWidth, 55, 'F')
  
  doc.setDrawColor(100, 110, 130)
  doc.setLineWidth(0.3)
  doc.rect(margin, yPosition, contentWidth, 55)

  if (data.photo) {
    try {
      const imgSize = 45
      doc.addImage(data.photo, 'JPEG', margin + 5, yPosition + 5, imgSize, imgSize, undefined, 'FAST')
      
      const textStartX = margin + imgSize + 12
      const labelX = textStartX
      const valueX = textStartX + 30
      
      yPosition += 12
      
      doc.setTextColor(60, 70, 85)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('SUBJECT:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(14)
      doc.setTextColor(20, 25, 35)
      doc.text(data.name.toUpperCase(), valueX, yPosition)
      
      yPosition += 10
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 70, 85)
      doc.text('POSITION:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(40, 50, 65)
      const positionLines = doc.splitTextToSize(data.position, contentWidth - imgSize - 40)
      doc.text(positionLines[0] || '', valueX, yPosition)
      
      yPosition += 8
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 70, 85)
      doc.text('LOCATION:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(40, 50, 65)
      doc.text(data.country, valueX, yPosition)
      
      yPosition += 8
      
      doc.setFontSize(7)
      doc.setFont('courier', 'normal')
      doc.setTextColor(100, 110, 125)
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`GENERATED: ${dateStr}`, labelX, yPosition)
      
      yPosition = 45 + 55 + 5
    } catch (error) {
      console.error('Error adding photo to PDF:', error)
      yPosition += 10
      
      doc.setTextColor(20, 25, 35)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('SUBJECT:', margin + 5, yPosition)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text(data.name.toUpperCase(), margin + 35, yPosition)
      yPosition += 8
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 70, 85)
      doc.text('POSITION:', margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(data.position, margin + 35, yPosition)
      yPosition += 8
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('LOCATION:', margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(data.country, margin + 35, yPosition)
      
      yPosition = 45 + 55 + 5
    }
  } else {
    yPosition += 10
    
    doc.setTextColor(20, 25, 35)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('SUBJECT:', margin + 5, yPosition)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(data.name.toUpperCase(), margin + 35, yPosition)
    yPosition += 10
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 70, 85)
    doc.text('POSITION:', margin + 5, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(data.position, margin + 35, yPosition)
    yPosition += 8
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('LOCATION:', margin + 5, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(data.country, margin + 35, yPosition)
    
    yPosition = 45 + 55 + 5
  }

  yPosition += 5
  
  doc.setFillColor(25, 30, 45)
  doc.rect(margin, yPosition, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ASSESSMENT', margin + 3, yPosition + 5.5)
  
  yPosition += 13

  doc.setTextColor(30, 35, 45)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')

  const lines = doc.splitTextToSize(data.report, contentWidth)
  
  for (let i = 0; i < lines.length; i++) {
    if (yPosition > pageHeight - margin - 20) {
      doc.addPage()
      yPosition = margin + 10
    }

    const line = lines[i]
    
    if (line.match(/^\d+\./)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(25, 30, 45)
      yPosition += 4
    } else if (line.match(/^[A-Z][A-Za-z\s]+:$/)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 50, 65)
      yPosition += 3
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 35, 45)
    }
    
    doc.text(line, margin, yPosition)
    yPosition += 5.5
  }

  doc.setFontSize(7)
  doc.setTextColor(120, 130, 145)
  doc.setFont('courier', 'normal')
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setFillColor(240, 242, 245)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
    
    doc.setDrawColor(180, 185, 195)
    doc.setLineWidth(0.2)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    doc.text(
      `PAGE ${i} OF ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
    doc.setFontSize(6.5)
    doc.text(
      'CONFIDENTIAL // FOR OFFICIAL USE ONLY // NOT FOR DISTRIBUTION',
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
