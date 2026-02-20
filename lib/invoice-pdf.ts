import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { ISale } from "@/types"

// Extend jsPDF with autotable types
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const generateInvoicePDF = (sale: ISale) => {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.width
  
  // Header
  doc.setFontSize(22)
  doc.setTextColor(40, 40, 40)
  doc.text("CENTURY CLEANING AGENCY", margin, 30)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("Quality Soaps & Cleaning Services", margin, 37)
  
  // Invoice Info Box
  doc.setFillColor(245, 245, 245)
  doc.rect(pageWidth - 80, 20, 60, 25, "F")
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - 70, 30)
  doc.setFont("helvetica", "normal")
  doc.text(`#${sale._id.toString().substring(0, 8).toUpperCase()}`, pageWidth - 70, 37)
  
  // Horizontal Line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 50, pageWidth - margin, 50)
  
  // Billing Info
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO:", margin, 65)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(sale.customer.name, margin, 72)
  doc.text(sale.customer.phone, margin, 77)
  
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("DETAILS:", pageWidth - 80, 65)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Date: ${format(new Date(sale.date), "PPP")}`, pageWidth - 80, 72)
  doc.text(`Served by: ${sale.workerName}`, pageWidth - 80, 77)
  doc.text(`Payment: ${sale.paymentMethod}`, pageWidth - 80, 82)
  
  // Table
  const tableHeaders = [["Product", "Size", "Qty", "Unit Price", "Total"]]
  const tableData = sale.items.map(item => [
    item.product,
    item.size,
    item.quantity.toString(),
    new Intl.NumberFormat('en-RW').format(item.unitPrice),
    new Intl.NumberFormat('en-RW').format(item.total)
  ])
  
  doc.autoTable({
    startY: 95,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  })
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("GRAND TOTAL:", pageWidth - 80, finalY + 5)
  doc.setTextColor(79, 70, 229)
  doc.text(
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(sale.grandTotal), 
    pageWidth - 45, 
    finalY + 5, 
    { align: 'right' }
  )
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.setFont("helvetica", "italic")
  doc.text("Thank you for your business!", pageWidth / 2, 280, { align: "center" })
  
  // Save/Download
  doc.save(`Invoice_${sale.customer.name.replace(/\s+/g, '_')}_${format(new Date(sale.date), "yyyyMMdd")}.pdf`)
}
