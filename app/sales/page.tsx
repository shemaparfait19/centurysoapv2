"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Download, Search, Trash2, FileText, ExternalLink } from "lucide-react"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ISale, IProduct, IWorker } from "@/types"
import { generateInvoicePDF } from "@/lib/invoice-pdf"

export default function SalesHistoryPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [workerFilter, setWorkerFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)

  // Data for filters
  const [workers, setWorkers] = useState<IWorker[]>([])

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => setWorkers(data))
      .catch(err => console.error("Failed to load workers", err))
  }, [])

  useEffect(() => {
    fetchSales()
  }, [currentPage, workerFilter, paymentFilter, dateFilter])

  async function fetchSales() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })

      if (workerFilter && workerFilter !== "all") params.append("worker", workerFilter)
      if (paymentFilter && paymentFilter !== "all") params.append("paymentMethod", paymentFilter)
      if (dateFilter) params.append("startDate", dateFilter)

      const res = await fetch(`/api/sales?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.sales)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.pages)
        setTotalAmount(data.totalAmount)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch sales history" })
    } finally {
      setLoading(false)
    }
  }

  // Normalize sale for UI (Legacy vs New structure)
  const normalizeSale = (sale: any): ISale => {
    if (sale.items && Array.isArray(sale.items)) return sale as ISale;
    
    // Convert legacy to new format for display
    return {
      ...sale,
      customer: { name: sale.clientName || "Unknown", phone: "N/A" },
      items: [{
        product: sale.product,
        size: sale.size,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.total
      }],
      grandTotal: sale.total
    } as unknown as ISale;
  }

  const exportToExcel = () => {
    const flatSales: any[] = []
    sales.forEach(s => {
      const ns = normalizeSale(s)
      ns.items.forEach(item => {
        flatSales.push({
          Date: format(new Date(ns.date), "yyyy-MM-dd"),
          Invoice: ns._id.toString().substring(0, 8).toUpperCase(),
          Customer: ns.customer.name,
          Worker: ns.workerName,
          Product: item.product,
          Size: item.size,
          Qty: item.quantity,
          Price: item.unitPrice,
          ItemTotal: item.total,
          GrandTotal: ns.grandTotal,
          Payment: ns.paymentMethod
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(flatSales)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Sales")
    XLSX.writeFile(workbook, `sales_report_${format(new Date(), "yyyyMMdd")}.xlsx`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will restore stock for all items in this sale.")) return
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: "Deleted", description: "Sale record removed and stock restored." })
        fetchSales()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View, print invoices, and manage sales.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select value={workerFilter} onValueChange={setWorkerFilter}>
              <SelectTrigger><SelectValue placeholder="Worker" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(w => <SelectItem key={w._id.toString()} value={w.name}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="MoMo">MoMo</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No sales found.</TableCell></TableRow>
                ) : (
                  sales.map((s) => {
                    const sale = normalizeSale(s)
                    return (
                      <TableRow key={sale._id.toString()}>
                        <TableCell className="font-medium text-xs">{formatShortDate(sale.date)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{sale.customer.name}</span>
                            <span className="text-[10px] text-muted-foreground">{sale.workerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="flex gap-1">
                                <span className="font-medium">{item.quantity}x</span>
                                <span className="truncate max-w-[120px]">{item.product} ({item.size})</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(sale.grandTotal)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sale.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {sale.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-indigo-600 hover:text-indigo-800"
                              onClick={() => generateInvoicePDF(sale)}
                            >
                              <FileText className="h-4 w-4 mr-1" /> Invoice
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(sale._id.toString())}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm font-medium">
              Period Total: <span className="text-xl font-bold text-primary ml-2">{formatCurrency(totalAmount)}</span>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
