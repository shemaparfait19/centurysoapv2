"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Download, Trash2, FileText, DollarSign } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/pagination"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ISale, IWorker } from "@/types"
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

  // Record Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; sale: ISale | null }>({ open: false, sale: null })
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState<"Cash" | "MoMo">("Cash")
  const [payNote, setPayNote] = useState("")
  const [paySubmitting, setPaySubmitting] = useState(false)

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
      const params = new URLSearchParams({ page: currentPage.toString(), limit: "20" })
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

  const normalizeSale = (sale: any): ISale => {
    if (sale.customer && sale.items && Array.isArray(sale.items)) return sale as ISale
    return {
      ...sale,
      customer: sale.customer || { name: sale.clientName || "Unknown", phone: "N/A" },
      items: (sale.items && Array.isArray(sale.items) && sale.items.length > 0)
        ? sale.items
        : [{ product: sale.product, size: sale.size, quantity: sale.quantity, unitPrice: sale.unitPrice, total: sale.total }],
      grandTotal: sale.grandTotal || sale.total || 0,
    } as unknown as ISale
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
          Payment: ns.paymentMethod,
          Status: (ns as any).paymentStatus || 'Paid',
          Balance: (ns as any).balance || 0,
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

  const openPaymentDialog = (sale: ISale) => {
    setPaymentDialog({ open: true, sale })
    setPayAmount("")
    setPayMethod("Cash")
    setPayNote("")
  }

  const handleRecordPayment = async () => {
    if (!paymentDialog.sale) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Enter a valid payment amount." })
      return
    }
    setPaySubmitting(true)
    try {
      const res = await fetch(`/api/sales/${(paymentDialog.sale as any)._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod, note: payNote }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast({ title: "Payment recorded", description: `${formatCurrency(amount)} recorded successfully.` })
      setPaymentDialog({ open: false, sale: null })
      fetchSales()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Failed to record payment" })
    } finally {
      setPaySubmitting(false)
    }
  }

  const getPaymentBadge = (sale: any) => {
    const method = sale.paymentMethod
    const status = sale.paymentStatus || 'Paid'
    if (method === 'Credit' && status === 'Pending') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Unpaid</span>
    }
    if (method === 'Credit' && status === 'Partial') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Partial</span>
    }
    if (method === 'Credit' && status === 'Paid') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Credit (Paid)</span>
    }
    if (method === 'Cash') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Cash</span>
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">MoMo</span>
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
          <CardDescription>View, print invoices, record payments, and manage sales.</CardDescription>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="Credit">Credit</SelectItem>
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">No sales found.</TableCell></TableRow>
                ) : (
                  sales.map((s) => {
                    const sale = normalizeSale(s)
                    const saleAny = sale as any
                    const hasBalance = (saleAny.balance || 0) > 0
                    return (
                      <TableRow key={sale._id.toString()} className={hasBalance ? "bg-amber-50/50" : ""}>
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
                        <TableCell>{getPaymentBadge(saleAny)}</TableCell>
                        <TableCell>
                          {hasBalance ? (
                            <span className="text-red-600 font-semibold text-xs">{formatCurrency(saleAny.balance)}</span>
                          ) : (
                            <span className="text-green-600 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {hasBalance && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-amber-600 hover:text-amber-800"
                                onClick={() => openPaymentDialog(sale)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" /> Pay
                              </Button>
                            )}
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

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentDialog.sale && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><span className="font-medium">Customer:</span> {(paymentDialog.sale as any).customer?.name}</p>
                <p><span className="font-medium">Total:</span> {formatCurrency((paymentDialog.sale as any).grandTotal)}</p>
                <p><span className="font-medium">Paid so far:</span> {formatCurrency((paymentDialog.sale as any).amountPaid || 0)}</p>
                <p className="text-red-600 font-bold"><span className="font-medium text-foreground">Balance:</span> {formatCurrency((paymentDialog.sale as any).balance || 0)}</p>
              </div>

              {/* Payment history */}
              {((paymentDialog.sale as any).payments || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Payment History</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {((paymentDialog.sale as any).payments || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs p-2 bg-green-50 rounded">
                        <span>{format(new Date(p.date), "dd MMM yyyy")} · {p.method}</span>
                        <span className="font-semibold text-green-700">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Amount to pay (RWF)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={(paymentDialog.sale as any).balance}
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Payment method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as "Cash" | "MoMo")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="MoMo">MoMo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Note (optional)</Label>
                  <Input placeholder="e.g. partial payment" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, sale: null })}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={paySubmitting}>
              {paySubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
