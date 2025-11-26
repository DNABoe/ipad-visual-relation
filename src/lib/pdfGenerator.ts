interface InvestigationData {
  name: string
  position: string
  country: string
  report: string
  photo?: string
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

export async function generateInvestigationPDF(data: InvestigationData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  doc.setFillColor(25, 30, 45)
  doc.rect(0, 0, pageWidth, 30, 'F')

  generateRelEyeLogo(doc, margin, 8, 14)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const title = 'INTELLIGENCE ASSESSMENT REPORT'
  const titleWidth = doc.getTextWidth(title)
  doc.text(title, (pageWidth - titleWidth) / 2, 20)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('courier', 'bold')
  doc.text('CLASSIFIED', pageWidth - margin - 30, 12)

  yPosition = 40
  const now = new Date()

  doc.setFillColor(245, 247, 250)
  doc.rect(margin, yPosition, contentWidth, 52, 'F')
  
  doc.setDrawColor(180, 190, 200)
  doc.setLineWidth(0.2)
  doc.rect(margin, yPosition, contentWidth, 52)

  if (data.photo) {
    try {
      const imgSize = 42
      doc.addImage(data.photo, 'JPEG', margin + 6, yPosition + 5, imgSize, imgSize, undefined, 'FAST')
      
      const textStartX = margin + imgSize + 14
      const labelX = textStartX
      const valueX = textStartX + 28
      
      yPosition += 10
      
      doc.setTextColor(70, 80, 95)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text('SUBJECT:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.setTextColor(25, 30, 40)
      doc.text(data.name.toUpperCase(), valueX, yPosition)
      
      yPosition += 9
      
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(70, 80, 95)
      doc.text('POSITION:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(45, 55, 70)
      const positionLines = doc.splitTextToSize(data.position, contentWidth - imgSize - 42)
      doc.text(positionLines[0] || '', valueX, yPosition)
      
      yPosition += 7
      
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(70, 80, 95)
      doc.text('LOCATION:', labelX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(45, 55, 70)
      doc.text(data.country, valueX, yPosition)
      
      yPosition += 7
      
      doc.setFontSize(6.5)
      doc.setFont('courier', 'normal')
      doc.setTextColor(110, 120, 135)
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`GENERATED: ${dateStr}`, labelX, yPosition)
      
      yPosition = 40 + 52 + 5
    } catch (error) {
      console.error('Error adding photo to PDF:', error)
      yPosition += 8
      
      doc.setTextColor(25, 30, 40)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text('SUBJECT:', margin + 6, yPosition)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'normal')
      doc.text(data.name.toUpperCase(), margin + 35, yPosition)
      yPosition += 9
      
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(70, 80, 95)
      doc.text('POSITION:', margin + 6, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(data.position, margin + 35, yPosition)
      yPosition += 7
      
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text('LOCATION:', margin + 6, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(data.country, margin + 35, yPosition)
      
      yPosition = 40 + 52 + 5
    }
  } else {
    yPosition += 8
    
    doc.setTextColor(25, 30, 40)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('SUBJECT:', margin + 6, yPosition)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.text(data.name.toUpperCase(), margin + 35, yPosition)
    yPosition += 9
    
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(70, 80, 95)
    doc.text('POSITION:', margin + 6, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(data.position, margin + 35, yPosition)
    yPosition += 7
    
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('LOCATION:', margin + 6, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(data.country, margin + 35, yPosition)
    
    yPosition = 40 + 52 + 5
  }

  yPosition += 4
  
  doc.setFillColor(25, 30, 45)
  doc.rect(margin, yPosition, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.text('ASSESSMENT', margin + 3, yPosition + 5)
  
  yPosition += 11

  doc.setTextColor(30, 35, 45)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')

  const lines = doc.splitTextToSize(data.report, contentWidth)
  
  for (let i = 0; i < lines.length; i++) {
    if (yPosition > pageHeight - margin - 18) {
      doc.addPage()
      yPosition = margin + 8
    }

    const line = lines[i]
    
    if (line.match(/^\d+\./)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(25, 30, 45)
      yPosition += 3
    } else if (line.match(/^[A-Z][A-Za-z\s]+:$/)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 50, 65)
      yPosition += 2.5
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 35, 45)
    }
    
    doc.text(line, margin, yPosition)
    yPosition += 5.5
  }

  doc.setFontSize(6.5)
  doc.setTextColor(120, 130, 145)
  doc.setFont('courier', 'normal')
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setFillColor(245, 247, 250)
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
    
    doc.setDrawColor(200, 205, 210)
    doc.setLineWidth(0.15)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    
    doc.text(
      `PAGE ${i} OF ${pageCount}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    )
    doc.setFontSize(6)
    doc.text(
      'CONFIDENTIAL // FOR OFFICIAL USE ONLY',
      pageWidth / 2,
      pageHeight - 3.5,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
