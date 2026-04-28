'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Download, Trash2, FileText, DollarSign, SlidersHorizontal } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/pagination'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { ISale, IWorker } from '@/types'
import { generateInvoicePDF } from '@/lib/invoice-pdf'
import { cn } from '@/lib/utils'

function PaymentBadge({ method, status }: { method: string; status?: string }) {
  if (method === 'Credit') {
    if (status === 'Pending') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Unpaid</span>
    if (status === 'Partial') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Partial</span>
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Credit ✓</span>
  }
  if (method === 'Cash') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Cash</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">MoMo</span>
}

export default function SalesHistoryPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [workerFilter, setWorkerFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; sale: ISale | null }>({ open: false, sale: null })
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'Cash' | 'MoMo'>('Cash')
  const [payNote, setPayNote] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/workers').then(r => r.json()).then(setWorkers).catch(console.error)
  }, [])

  useEffect(() => { fetchSales() }, [currentPage, workerFilter, paymentFilter, dateFilter])

  async function fetchSales() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' })
      if (workerFilter !== 'all') params.append('worker', workerFilter)
      if (paymentFilter !== 'all') params.append('paymentMethod', paymentFilter)
      if (dateFilter) params.append('startDate', dateFilter)
      const res = await fetch(`/api/sales?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.sales)
        setTotalPages(data.pagination.pages)
        setTotalAmount(data.totalAmount)
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch sales' })
    } finally {
      setLoading(false)
    }
  }

  const normalize = (sale: any): ISale => {
    if (sale.customer && Array.isArray(sale.items)) return sale as ISale
    return {
      ...sale,
      customer: sale.customer || { name: sale.clientName || 'Unknown', phone: 'N/A' },
      items: (Array.isArray(sale.items) && sale.items.length > 0)
        ? sale.items
        : [{ product: sale.product, size: sale.size, quantity: sale.quantity, unitPrice: sale.unitPrice, total: sale.total }],
      grandTotal: sale.grandTotal || sale.total || 0,
    } as unknown as ISale
  }

  const exportToExcel = () => {
    const rows: any[] = []
    sales.forEach(s => {
      const ns = normalize(s)
      ns.items.forEach(item => {
        rows.push({
          Date: format(new Date(ns.date), 'yyyy-MM-dd'),
          Invoice: ns._id.toString().substring(0, 8).toUpperCase(),
          Customer: ns.customer.name,
          Worker: ns.workerName,
          Product: item.product,
          Size: item.size,
          Qty: item.quantity,
          Price: item.unitPrice,
          Total: ns.grandTotal,
          Payment: ns.paymentMethod,
          Status: (ns as any).paymentStatus || 'Paid',
          Balance: (ns as any).balance || 0,
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales')
    XLSX.writeFile(wb, `sales_${format(new Date(), 'yyyyMMdd')}.xlsx`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale? Stock will be restored.')) return
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Sale removed and stock restored.' })
        fetchSales()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' })
    }
  }

  const openPaymentDialog = (sale: ISale) => {
    setPaymentDialog({ open: true, sale })
    setPayAmount('')
    setPayMethod('Cash')
    setPayNote('')
  }

  const handleRecordPayment = async () => {
    if (!paymentDialog.sale) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' })
      return
    }
    setPaySubmitting(true)
    try {
      const res = await fetch(`/api/sales/${(paymentDialog.sale as any)._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod, note: payNote }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Payment recorded', description: `${formatCurrency(amount)} recorded.` })
      setPaymentDialog({ open: false, sale: null })
      fetchSales()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e instanceof Error ? e.message : 'Failed' })
    } finally {
      setPaySubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales History</h1>
          <p className="text-sm text-slate-500 mt-0.5">All recorded transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border transition-colors',
              showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:text-slate-900 px-3 h-10 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={workerFilter} onValueChange={v => { setWorkerFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="border-slate-200 rounded-xl h-10">
                <SelectValue placeholder="Worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(w => <SelectItem key={w._id.toString()} value={w.name}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={v => { setPaymentFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="border-slate-200 rounded-xl h-10">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="MoMo">MoMo</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1) }}
              className="border-slate-200 rounded-xl h-10"
            />
          </div>
        </div>
      )}

      {/* Sale cards */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-[90px] animate-pulse border border-slate-100" />
          ))
        ) : sales.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No sales found</p>
          </div>
        ) : (
          sales.map((s) => {
            const sale = normalize(s)
            const saleAny = sale as any
            const hasBalance = (saleAny.balance || 0) > 0
            return (
              <div
                key={sale._id.toString()}
                className={cn(
                  'bg-white rounded-2xl p-4 shadow-sm border transition-colors',
                  hasBalance ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: customer + items */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{sale.customer.name}</span>
                      <PaymentBadge method={saleAny.paymentMethod} status={saleAny.paymentStatus} />
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {sale.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-slate-600">
                          <span className="font-semibold">{item.quantity}×</span> {item.product} <span className="text-slate-400">({item.size})</span>
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-400">{formatShortDate(sale.date)}</span>
                      <span className="text-[10px] text-slate-400">{sale.workerName}</span>
                      {hasBalance && (
                        <span className="text-[10px] font-semibold text-red-600">
                          Bal: {formatCurrency(saleAny.balance)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: total + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="font-bold text-slate-900">{formatCurrency(sale.grandTotal)}</span>
                    <div className="flex items-center gap-1">
                      {hasBalance && (
                        <button
                          onClick={() => openPaymentDialog(sale)}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          <DollarSign className="h-3 w-3" /> Pay
                        </button>
                      )}
                      <button
                        onClick={() => generateInvoicePDF(sale)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale._id.toString())}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {!loading && sales.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Period total: <span className="text-lg font-bold text-emerald-600 ml-1">{formatCurrency(totalAmount)}</span>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog(p => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentDialog.sale && (
            <div className="space-y-4 py-1">
              <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                <p><span className="font-medium">Customer:</span> {(paymentDialog.sale as any).customer?.name}</p>
                <p><span className="font-medium">Total:</span> {formatCurrency((paymentDialog.sale as any).grandTotal)}</p>
                <p><span className="font-medium">Paid:</span> {formatCurrency((paymentDialog.sale as any).amountPaid || 0)}</p>
                <p className="text-red-600 font-semibold">
                  <span className="font-medium text-slate-700">Balance:</span> {formatCurrency((paymentDialog.sale as any).balance || 0)}
                </p>
              </div>

              {((paymentDialog.sale as any).payments || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Payment History</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {((paymentDialog.sale as any).payments || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs p-2 bg-emerald-50 rounded-lg">
                        <span className="text-slate-600">{format(new Date(p.date), 'dd MMM yyyy')} · {p.method}</span>
                        <span className="font-semibold text-emerald-700">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Amount (RWF)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={(paymentDialog.sale as any).balance}
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as 'Cash' | 'MoMo')}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="MoMo">MoMo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Input
                    placeholder="e.g. partial payment"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, sale: null })}>Cancel</Button>
            <Button
              onClick={handleRecordPayment}
              disabled={paySubmitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {paySubmitting ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
