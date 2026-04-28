'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Download, Loader2, TrendingUp, Banknote, Smartphone, ShoppingBag, CreditCard } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { DailyReport } from '@/types'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={cn('rounded-2xl p-4 border', color)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DailyReportPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [reportData, setReportData] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  useEffect(() => { fetchReport(date) }, [date])

  async function fetchReport(selectedDate: Date) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/daily?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      if (res.ok) setReportData(await res.json())
      else setReportData(null)
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load daily report.' })
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    if (!reportData) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Daily Report — ${format(date, 'PPP')}`, 14, 22)
    doc.setFontSize(10)
    doc.text(`Total: ${formatCurrency(reportData.totalSales)}  |  Cash: ${formatCurrency(reportData.cashSales)}  |  MoMo: ${formatCurrency(reportData.momoSales)}`, 14, 32)

    const rows: any[][] = []
    reportData.sales.forEach(s => {
      const items = s.items && s.items.length > 0 ? s.items : [{ product: (s as any).product, size: (s as any).size, quantity: (s as any).quantity, unitPrice: (s as any).unitPrice, total: (s as any).total }]
      items.forEach(item => {
        rows.push([format(new Date(s.date), 'HH:mm'), item.product, item.size, item.quantity, formatCurrency(item.unitPrice), formatCurrency(item.total), s.paymentMethod, s.workerName])
      })
    })

    autoTable(doc, {
      startY: 40,
      head: [['Time', 'Product', 'Size', 'Qty', 'Unit Price', 'Total', 'Payment', 'Worker']],
      body: rows,
    })
    doc.save(`daily_report_${format(date, 'yyyy-MM-dd')}.pdf`)
  }

  const paymentBadge = (method: string) => {
    if (method === 'Cash') return 'bg-emerald-100 text-emerald-700'
    if (method === 'MoMo') return 'bg-blue-100 text-blue-700'
    return 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daily Summary</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sales breakdown for a selected date</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('justify-start text-left font-normal rounded-xl border-slate-200 h-10', !date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setCalOpen(false) } }}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={exportPDF}
            disabled={!reportData || loading}
            className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : reportData ? (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Sales"
              value={formatCurrency(reportData.totalSales)}
              color="bg-emerald-50 border-emerald-200 text-emerald-900"
            />
            <StatCard
              label="Transactions"
              value={String(reportData.transactionCount)}
              color="bg-slate-50 border-slate-200 text-slate-900"
            />
            <StatCard
              label="Cash"
              value={formatCurrency(reportData.cashSales)}
              color="bg-blue-50 border-blue-200 text-blue-900"
            />
            <StatCard
              label="MoMo"
              value={formatCurrency(reportData.momoSales)}
              color="bg-violet-50 border-violet-200 text-violet-900"
            />
          </div>

          {/* Sales table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">{format(date, 'PPP')}</p>
            </div>
            {reportData.sales.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No sales recorded for this date.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {reportData.sales.map((sale) => (
                  <div key={sale._id.toString()} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{format(new Date(sale.date), 'HH:mm')}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', paymentBadge(sale.paymentMethod))}>
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {(sale.items && sale.items.length > 0 ? sale.items : [{ product: (sale as any).product, size: (sale as any).size, quantity: (sale as any).quantity }]).map((item, idx) => (
                          <p key={idx} className="text-sm text-slate-700">
                            <span className="font-semibold">{item.quantity}×</span> {item.product} <span className="text-slate-400">({item.size})</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{sale.workerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900">{formatCurrency(sale.grandTotal || (sale as any).total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Select a date to view the daily report</p>
        </div>
      )}
    </div>
  )
}
