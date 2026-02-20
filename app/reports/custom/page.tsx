"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, Download, FileText, Filter, Loader2, TrendingUp } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { IWorker } from "@/types"

export default function CustomReportsPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [workers, setWorkers] = useState<IWorker[]>([])
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [worker, setWorker] = useState("all")

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(setWorkers)
      .catch(console.error)
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate, worker })
      const res = await fetch(`/api/reports/custom?${params.toString()}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("CENTURY CLEANING AGENCY - SUMMARY REPORT", 14, 20)
    doc.setFontSize(10)
    doc.text(`Range: ${startDate} to ${endDate}`, 14, 28)
    doc.text(`Worker: ${worker === 'all' ? 'All Employees' : worker}`, 14, 33)
    
    // Summary
    doc.autoTable({
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Total Sales", formatCurrency(data.summary.totalSales)],
        ["Cash Payments", formatCurrency(data.summary.cashSales)],
        ["MoMo Payments", formatCurrency(data.summary.momoSales)],
        ["Total Transactions", data.summary.count.toString()]
      ]
    })
    
    // Product Breakdown
    doc.text("PRODUCT PERFORMANCE", 14, (doc as any).lastAutoTable.finalY + 10)
    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Product", "Size", "Quantity", "Revenue"]],
      body: data.products.map((p: any) => [p.product, p.size, p.quantity, formatCurrency(p.total)])
    })
    
    doc.save(`Report_${startDate}_${endDate}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
        <div className="flex gap-2">
          <Button onClick={fetchReport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
            Generate Report
          </Button>
          {data && (
            <Button onClick={generatePDF} variant="outline">
              <Download className="h-4 w-4 mr-2" /> PDF Summary
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Employee</label>
            <Select value={worker} onValueChange={setWorker}>
              <SelectTrigger><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {workers.map(w => <SelectItem key={w._id.toString()} value={w.name}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Total Sales</CardDescription>
                <CardTitle className="text-2xl font-bold text-primary">{formatCurrency(data.summary.totalSales)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cash Received</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary.cashSales)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>MoMo Received</CardDescription>
                <CardTitle className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.momoSales)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Product Sales Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.product}</TableCell>
                      <TableCell>{p.size}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
