'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Download, Filter, Loader2, TrendingUp, BarChart3 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { IWorker } from '@/types'
import { cn } from '@/lib/utils'

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={cn('rounded-2xl p-4 border', color)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}

export default function CustomReportsPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [worker, setWorker] = useState('all')

  useEffect(() => {
    fetch('/api/workers').then(r => r.json()).then(setWorkers).catch(console.error)
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate, worker })
      const res = await fetch(`/api/reports/custom?${params}`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Century Cleaning Agency — Business Report', 14, 20)
    doc.setFontSize(9)
    doc.text(`Period: ${startDate} to ${endDate}  |  Worker: ${worker === 'all' ? 'All' : worker}`, 14, 28)

    autoTable(doc, {
      startY: 36,
      head: [['Metric', 'Value']],
      body: [
        ['Total Sales', formatCurrency(data.summary.totalSales)],
        ['Cash', formatCurrency(data.summary.cashSales)],
        ['MoMo', formatCurrency(data.summary.momoSales)],
        ['Transactions', String(data.summary.count)],
      ],
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Product', 'Size', 'Qty', 'Revenue']],
      body: data.products.map((p: any) => [p.product, p.size, p.quantity, formatCurrency(p.total)]),
    })

    doc.save(`Report_${startDate}_${endDate}.pdf`)
  }

  const maxProduct = data?.products?.reduce((max: number, p: any) => Math.max(max, p.total), 0) || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Business Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Custom date range analysis</p>
        </div>
        {data && (
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-2 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Filter Report</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-slate-200 rounded-xl h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-slate-200 rounded-xl h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Worker</label>
            <Select value={worker} onValueChange={setWorker}>
              <SelectTrigger className="border-slate-200 rounded-xl h-10">
                <SelectValue placeholder="All Workers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(w => (
                  <SelectItem key={w._id.toString()} value={w.name}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={fetchReport}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
          Generate Report
        </Button>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Sales" value={formatCurrency(data.summary.totalSales)} color="bg-emerald-50 border-emerald-200 text-emerald-900" />
            <StatCard label="Transactions" value={String(data.summary.count)} color="bg-slate-50 border-slate-200 text-slate-900" />
            <StatCard label="Cash" value={formatCurrency(data.summary.cashSales)} color="bg-blue-50 border-blue-200 text-blue-900" />
            <StatCard label="MoMo" value={formatCurrency(data.summary.momoSales)} color="bg-violet-50 border-violet-200 text-violet-900" />
          </div>

          {/* Product breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <h2 className="font-semibold text-slate-900">Product Performance</h2>
            </div>
            {data.products.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No sales in this period.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.products.map((p: any, i: number) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="font-semibold text-sm text-slate-900">{p.product}</span>
                        <span className="text-xs text-slate-400 ml-2">({p.size})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900">{formatCurrency(p.total)}</span>
                        <span className="text-xs text-slate-400 ml-2">{p.quantity} units</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.round((p.total / maxProduct) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Set your filters and generate a report</p>
        </div>
      )}
    </div>
  )
}
