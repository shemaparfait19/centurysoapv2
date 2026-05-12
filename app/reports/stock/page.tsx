'use client'

import { useEffect, useState } from 'react'
import { Download, Package2, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { IProduct } from '@/types'
import { cn } from '@/lib/utils'

function stockColor(closing: number, opening: number, stockIn: number) {
  const total = opening + stockIn
  if (closing === 0) return 'text-red-600 bg-red-50'
  if (total > 0 && closing / total < 0.2) return 'text-amber-600 bg-amber-50'
  return 'text-emerald-700 bg-emerald-50'
}

function stockLabel(closing: number, opening: number, stockIn: number) {
  const total = opening + stockIn
  if (closing === 0) return 'Out'
  if (total > 0 && closing / total < 0.2) return 'Low'
  return 'OK'
}

export default function StockReportPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const totalProducts = products.length
  const totalSizes = products.reduce((s, p) => s + p.sizes.length, 0)
  const outOfStock = products.reduce((s, p) => s + p.sizes.filter(sz => sz.closingStock === 0).length, 0)
  const lowStock = products.reduce((s, p) => s + p.sizes.filter(sz => {
    const total = sz.openingStock + sz.stockIn
    return sz.closingStock > 0 && total > 0 && sz.closingStock / total < 0.2
  }).length, 0)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Century Cleaning Agency — Stock Report', 14, 18)
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 25)

    const rows: any[][] = []
    products.forEach(p => {
      p.sizes.forEach(sz => {
        rows.push([
          p.name,
          `${sz.size} ${sz.unit}`,
          sz.openingStock,
          sz.stockIn,
          sz.stockSold,
          sz.closingStock,
          stockLabel(sz.closingStock, sz.openingStock, sz.stockIn),
        ])
      })
    })

    autoTable(doc, {
      startY: 30,
      head: [['Product', 'Size', 'Opening', 'Stock In', 'Sold', 'Remaining', 'Status']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'center' },
      },
    })

    doc.save(`stock_report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Stock Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">Current inventory levels for all products</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={loading || products.length === 0}
          className="flex items-center gap-2 text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:text-slate-900 px-3 h-10 rounded-xl transition-colors disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> PDF
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Products', value: totalProducts, color: 'bg-slate-50 border-slate-200 text-slate-900' },
          { label: 'Variants', value: totalSizes, color: 'bg-blue-50 border-blue-200 text-blue-900' },
          { label: 'Low Stock', value: lowStock, color: 'bg-amber-50 border-amber-200 text-amber-900' },
          { label: 'Out of Stock', value: outOfStock, color: 'bg-red-50 border-red-200 text-red-900' },
        ].map(c => (
          <div key={c.label} className={cn('rounded-2xl p-4 border', c.color)}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{c.label}</p>
            <p className="text-2xl font-black mt-1">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Good stock
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Low (under 20%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Out of stock
        </span>
      </div>

      {/* Product cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Package2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No products found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={String(product._id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Product header */}
              <div className="px-5 py-3 bg-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-white">{product.name}</h2>
                <span className="text-xs text-slate-400">{product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-5 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Size</span>
                <span className="text-center">Opening</span>
                <span className="text-center">Stock In</span>
                <span className="text-center">Sold</span>
                <span className="text-center">Remaining</span>
              </div>

              {/* Size rows */}
              <div className="divide-y divide-slate-50">
                {product.sizes.map((sz, i) => {
                  const status = stockLabel(sz.closingStock, sz.openingStock, sz.stockIn)
                  const colorClass = stockColor(sz.closingStock, sz.openingStock, sz.stockIn)
                  const total = sz.openingStock + sz.stockIn
                  const pct = total > 0 ? Math.round((sz.closingStock / total) * 100) : 0

                  return (
                    <div key={i} className="grid grid-cols-5 px-5 py-3 items-center">
                      {/* Size label */}
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{sz.size}</p>
                        <p className="text-[10px] text-slate-400">{sz.unit}</p>
                      </div>

                      {/* Opening */}
                      <div className="text-center">
                        <span className="text-sm font-medium text-slate-600">{sz.openingStock}</span>
                      </div>

                      {/* Stock In */}
                      <div className="text-center">
                        <span className="text-sm font-semibold text-blue-600">+{sz.stockIn}</span>
                      </div>

                      {/* Sold */}
                      <div className="text-center">
                        <span className="text-sm font-semibold text-orange-500">−{sz.stockSold}</span>
                      </div>

                      {/* Remaining */}
                      <div className="text-center flex flex-col items-center gap-1">
                        <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', colorClass)}>
                          {sz.closingStock}
                        </span>
                        {total > 0 && (
                          <div className="w-full max-w-[60px] h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                status === 'Out' ? 'bg-red-400' : status === 'Low' ? 'bg-amber-400' : 'bg-emerald-400'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
