import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ISale } from "@/types"

export const generateInvoicePDF = (sale: ISale) => {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.width
  
  // Header section
  doc.setFillColor(79, 70, 229) // Theme indigo
  doc.rect(0, 0, pageWidth, 40, "F")
  
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("CENTURY CLEANING", margin, 25)
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("QUALITY SOAPS & CLEANING SERVICES", margin, 32)
  
  // Invoice Badge in Header
  doc.setFillColor(255, 255, 255, 0.2)
  doc.roundedRect(pageWidth - 70, 12, 50, 18, 2, 2, "F")
  doc.setFontSize(9)
  doc.text("INVOICE NO:", pageWidth - 65, 19)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(`#${sale._id.toString().substring(0, 8).toUpperCase()}`, pageWidth - 65, 26)
  
  // Billing & Info Section
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO:", margin, 55)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(14)
  doc.text(sale.customer.name, margin, 65)
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Phone: ${sale.customer.phone}`, margin, 72)
  
  // Details Column
  doc.setTextColor(40, 40, 40)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE DETAILS:", pageWidth - 90, 55)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const saleAny = sale as any
  const paymentStatus: string = saleAny.paymentStatus || 'Paid'
  const paymentLabel =
    sale.paymentMethod === 'Credit'
      ? `Credit — ${paymentStatus}`
      : sale.paymentMethod

  const detailRows = [
    ["Date:", format(new Date(sale.date), "PPP")],
    ["Worker:", sale.workerName],
    ["Payment:", paymentLabel],
  ]

  let detailY = 62
  detailRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, pageWidth - 90, detailY)
    doc.setFont("helvetica", "normal")
    doc.text(value, pageWidth - 65, detailY)
    detailY += 7
  })
  
  // Table
  const tableHeaders = [["Product", "Size", "Qty", "Price", "Total"]]
  const tableData = sale.items.map(item => [
    item.product,
    item.size,
    item.quantity.toString(),
    new Intl.NumberFormat('en-RW').format(item.unitPrice),
    new Intl.NumberFormat('en-RW').format(item.total)
  ])
  
  autoTable(doc, {
    startY: 95,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [79, 70, 229], 
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  })
  
  // Total Section
  const finalY = (doc as any).lastAutoTable.finalY + 15
  
  // Summary Sub-box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(pageWidth - 95, finalY, 75, 25, 2, 2, "F")
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("GRAND TOTAL", pageWidth - 88, finalY + 10)
  
  doc.setFontSize(16)
  doc.setTextColor(79, 70, 229)
  doc.setFont("helvetica", "bold")
  const totalStr = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(sale.grandTotal)
  doc.text(totalStr, pageWidth - 25, finalY + 18, { align: 'right' })
  
  // Credit payment summary
  let afterTotalY = finalY + 35
  if (saleAny.paymentMethod === 'Credit') {
    const amountPaid: number = saleAny.amountPaid || 0
    const balance: number = saleAny.balance || 0
    const payments: any[] = saleAny.payments || []

    // Box
    doc.setFillColor(255, 247, 237) // amber-50
    doc.roundedRect(margin, afterTotalY, pageWidth - margin * 2, payments.length > 0 ? 40 + payments.length * 8 : 32, 2, 2, 'F')
    doc.setDrawColor(251, 191, 36)
    doc.roundedRect(margin, afterTotalY, pageWidth - margin * 2, payments.length > 0 ? 40 + payments.length * 8 : 32, 2, 2, 'S')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14) // amber-800
    doc.text('CREDIT PAYMENT SUMMARY', margin + 5, afterTotalY + 9)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 53, 15)
    doc.text(`Total:`, margin + 5, afterTotalY + 18)
    doc.text(new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(sale.grandTotal), margin + 35, afterTotalY + 18)

    doc.text(`Paid:`, margin + 5, afterTotalY + 26)
    doc.setTextColor(amountPaid >= sale.grandTotal ? 21 : 120, amountPaid >= sale.grandTotal ? 128 : 53, amountPaid >= sale.grandTotal ? 61 : 15)
    doc.text(new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(amountPaid), margin + 35, afterTotalY + 26)

    if (balance > 0) {
      doc.setTextColor(185, 28, 28)
      doc.setFont('helvetica', 'bold')
      doc.text(`Balance due:`, margin + 5, afterTotalY + 34)
      doc.text(new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(balance), margin + 45, afterTotalY + 34)
    }

    if (payments.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(120, 53, 15)
      doc.setFontSize(8)
      doc.text('Payment history:', margin + 5, afterTotalY + 42)
      doc.setFont('helvetica', 'normal')
      payments.forEach((p, i) => {
        doc.text(
          `${format(new Date(p.date), 'dd MMM yyyy')}  ${p.method}  +${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(p.amount)}${p.note ? '  (' + p.note + ')' : ''}`,
          margin + 5,
          afterTotalY + 50 + i * 8
        )
      })
    }

    afterTotalY += (payments.length > 0 ? 48 + payments.length * 8 : 40)
  }

  // Footer
  const footerY = Math.max(afterTotalY + 10, 270)
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.setFont("helvetica", "normal")
  doc.text("CENTURY CLEANING AGENCY - Quality You Can Trust", pageWidth / 2, footerY, { align: "center" })
  doc.text("Thank you for choosing our services!", pageWidth / 2, footerY + 5, { align: "center" })
  
  // Save/Download
  doc.save(`Invoice_${sale.customer.name.replace(/\s+/g, '_')}_${format(new Date(sale.date), "yyyyMMdd")}.pdf`)
}
