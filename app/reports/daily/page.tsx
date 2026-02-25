"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Download, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { DailyReport } from "@/types"

export default function DailyReportPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [reportData, setReportData] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport(date)
  }, [date])

  async function fetchReport(selectedDate: Date) {
    setLoading(true)
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const res = await fetch(`/api/reports/daily?date=${formattedDate}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        setReportData(null)
      }
    } catch (error) {
      console.error("Failed to fetch report", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load daily report.",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const title = `Daily Sales Report - ${format(date, "PPP")}`
    
    doc.setFontSize(20)
    doc.text(title, 14, 22)

    doc.setFontSize(11)
    doc.text(`Total Sales: ${formatCurrency(reportData.totalSales)}`, 14, 32)
    doc.text(`Cash: ${formatCurrency(reportData.cashSales)}`, 14, 38)
    doc.text(`MoMo: ${formatCurrency(reportData.momoSales)}`, 14, 44)
    doc.text(`Total Transactions: ${reportData.transactionCount}`, 14, 50)

    const normalizedSales: any[] = []
    reportData.sales.forEach(s => {
      if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
          normalizedSales.push({
            time: format(new Date(s.date), "HH:mm"),
            product: item.product,
            size: item.size,
            qty: item.quantity,
            price: item.unitPrice,
            total: item.total,
            payment: s.paymentMethod,
            worker: s.workerName
          })
        })
      } else {
        // Legacy
        normalizedSales.push({
          time: format(new Date(s.date), "HH:mm"),
          product: (s as any).product,
          size: (s as any).size,
          qty: (s as any).quantity,
          price: (s as any).unitPrice,
          total: (s as any).total,
          payment: s.paymentMethod,
          worker: s.workerName
        })
      }
    })

    const tableData = normalizedSales.map(s => [
      s.time,
      s.product,
      s.size,
      s.qty.toString(),
      formatCurrency(s.price),
      formatCurrency(s.total),
      s.payment,
      s.worker
    ])

    autoTable(doc, {
      startY: 58,
      head: [['Time', 'Product', 'Size', 'Qty', 'Unit Price', 'Total', 'Payment', 'Worker']],
      body: tableData,
    })

    doc.save(`daily_report_${format(date, "yyyy-MM-dd")}.pdf`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Daily Summary</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={exportPDF} disabled={!reportData || loading} variant="default">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reportData ? (
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(reportData.totalSales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.transactionCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.cashSales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MoMo Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.momoSales)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Breakdown</CardTitle>
              <CardDescription>Detailed list of transactions for {format(date, "PPP")}</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.sales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 px-2 font-medium">Time</th>
                        <th className="py-2 px-2 font-medium">Product (Items)</th>
                        <th className="py-2 px-2 font-medium text-right">Total</th>
                        <th className="py-2 px-2 font-medium text-center">Payment</th>
                        <th className="py-2 px-2 font-medium">Worker</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales.map((sale) => (
                        <tr key={sale._id.toString()} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-2">{format(new Date(sale.date), "HH:mm")}</td>
                          <td className="py-2 px-2">
                            {sale.items && sale.items.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {sale.items.map((item, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium">{item.quantity}x</span> {item.product} ({item.size})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>{(sale as any).product} ({(sale as any).size})</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatCurrency(sale.grandTotal || (sale as any).total)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{sale.workerName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No sales recorded for this date.</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Select a date to view the report.</div>
      )}
    </div>
  )
}
