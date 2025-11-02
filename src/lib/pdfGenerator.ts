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

  doc.setFillColor(15, 15, 35)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('INTELLIGENCE BRIEF', margin, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(dateStr, pageWidth - margin, 25, { align: 'right' })

  yPosition = 55

  if (data.photo) {
    try {
      const imgWidth = 35
      const imgHeight = 35
      doc.addImage(data.photo, 'JPEG', margin, yPosition, imgWidth, imgHeight, undefined, 'FAST')
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(data.name, margin + imgWidth + 10, yPosition + 10)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(data.position, margin + imgWidth + 10, yPosition + 18)
      doc.text(`Country: ${data.country}`, margin + imgWidth + 10, yPosition + 26)
      
      yPosition += imgHeight + 15
    } catch (error) {
      console.error('Error adding photo to PDF:', error)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(data.name, margin, yPosition)
      yPosition += 8
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(data.position, margin, yPosition)
      yPosition += 6
      doc.text(`Country: ${data.country}`, margin, yPosition)
      yPosition += 15
    }
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(data.name, margin, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(data.position, margin, yPosition)
    yPosition += 6
    doc.text(`Country: ${data.country}`, margin, yPosition)
    yPosition += 15
  }

  doc.setDrawColor(100, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const lines = doc.splitTextToSize(data.report, contentWidth)
  
  for (let i = 0; i < lines.length; i++) {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage()
      yPosition = margin
    }

    const line = lines[i]
    
    if (line.match(/^\d+\./)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(0, 100, 150)
      yPosition += 5
    } else if (line.match(/^[A-Z][A-Za-z\s]+:$/)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      yPosition += 3
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
    }
    
    doc.text(line, margin, yPosition)
    yPosition += 6
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      'CONFIDENTIAL - For Internal Use Only',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
