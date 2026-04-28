"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Package2, Search, ChevronDown, ChevronUp, Boxes, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

interface BatchItem {
  product: string
  size: string
  unit: string
  quantityIn: number
  quantitySold: number
  remaining: number
}

interface BatchGroup {
  batchNumber: string
  receivedDate: string
  items: BatchItem[]
  totalIn: number
  totalSold: number
  totalRemaining: number
}

export default function BatchesPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<BatchGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { fetchBatches() }, [])

  async function fetchBatches() {
    setLoading(true)
    try {
      const res = await fetch('/api/batches')
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches)
        // Expand all by default so user sees everything immediately
        setExpanded(new Set(data.batches.map((b: BatchGroup) => b.batchNumber)))
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load batches." })
    } finally {
      setLoading(false)
    }
  }

  const toggle = (batchNumber: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(batchNumber) ? n.delete(batchNumber) : n.add(batchNumber); return n })

  const filtered = batches.filter(b =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.items.some(i => i.product.toLowerCase().includes(search.toLowerCase()))
  )

  const totalUnits = batches.reduce((s, b) => s + b.totalRemaining, 0)
  const totalBatches = batches.length
  const depletedCount = batches.filter(b => b.totalRemaining === 0).length

  const getBatchStatus = (b: BatchGroup) => {
    if (b.totalRemaining === 0) return { label: "Depleted", cls: "bg-slate-100 text-slate-500 border-slate-200" }
    const pct = (b.totalRemaining / b.totalIn) * 100
    if (pct < 20) return { label: "Low", cls: "bg-red-100 text-red-700 border-red-200" }
    if (pct < 50) return { label: "Medium", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "Good", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Tracking</h1>
        <p className="text-muted-foreground mt-1">See all stock batches, how much came in, sold, and what's remaining.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Boxes className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Total Batches</p>
                <p className="text-2xl font-bold text-blue-800">{totalBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200 rounded-lg">
                <Package2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">Units Remaining</p>
                <p className="text-2xl font-bold text-emerald-800">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 rounded-lg">
                <Boxes className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Depleted</p>
                <p className="text-2xl font-bold text-slate-700">{depletedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>All Batches</CardTitle>
              <CardDescription>Each batch shows all products that came in together.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batch # or product..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <Boxes className="h-10 w-10 opacity-30" />
              <p>{batches.length === 0 ? "No batches recorded yet. Add a batch from Stock Management." : "No batches match your search."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((batch) => {
                const isExpanded = expanded.has(batch.batchNumber)
                const status = getBatchStatus(batch)
                const pct = Math.round((batch.totalRemaining / batch.totalIn) * 100)
                const depleted = batch.totalRemaining === 0

                return (
                  <div
                    key={batch.batchNumber}
                    className={`rounded-xl border overflow-hidden ${depleted ? 'opacity-60' : ''}`}
                  >
                    {/* Batch header — always visible */}
                    <button
                      className="w-full text-left"
                      onClick={() => toggle(batch.batchNumber)}
                    >
                      <div className="px-5 py-4 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                              <Boxes className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-base text-slate-800">{batch.batchNumber}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Received {format(new Date(batch.receivedDate), "dd MMM yyyy")} &middot; {batch.items.length} product line{batch.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Numbers */}
                          <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Total In</p>
                              <p className="font-bold text-slate-700">{batch.totalIn}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Sold</p>
                              <p className="font-bold text-orange-600">{batch.totalSold}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className={`font-bold text-lg ${depleted ? 'text-slate-400' : 'text-emerald-700'}`}>{batch.totalRemaining}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>

                          {/* Mobile */}
                          <div className="sm:hidden flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className={`font-bold ${depleted ? 'text-slate-400' : 'text-emerald-700'}`}>{batch.totalRemaining}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              depleted ? 'bg-slate-300' :
                              pct < 20 ? 'bg-red-400' :
                              pct < 50 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Product breakdown — expanded */}
                    {isExpanded && (
                      <div className="border-t bg-slate-50">
                        {/* Table header */}
                        <div className="px-5 py-2 grid grid-cols-[1fr_auto_auto_auto] gap-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b">
                          <span>Product / Size</span>
                          <span className="text-right w-16">In</span>
                          <span className="text-right w-16">Sold</span>
                          <span className="text-right w-20">Remaining</span>
                        </div>

                        {batch.items.map((item, i) => {
                          const itemPct = Math.round((item.remaining / item.quantityIn) * 100)
                          return (
                            <div key={i} className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b last:border-0 bg-white hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{
                                  background: item.remaining === 0 ? '#cbd5e1' :
                                    itemPct < 20 ? '#f87171' :
                                    itemPct < 50 ? '#fbbf24' : '#34d399'
                                }} />
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{item.product}</p>
                                  <p className="text-xs text-muted-foreground">{item.size} {item.unit}</p>
                                </div>
                              </div>
                              <span className="text-right w-16 text-sm font-medium text-slate-700">{item.quantityIn}</span>
                              <span className="text-right w-16 text-sm font-medium text-orange-600">{item.quantitySold}</span>
                              <div className="text-right w-20">
                                <span className={`text-sm font-bold ${
                                  item.remaining === 0 ? 'text-slate-400' :
                                  item.remaining < 10 ? 'text-red-600' : 'text-emerald-700'
                                }`}>
                                  {item.remaining === 0 ? '—' : item.remaining}
                                </span>
                                {item.remaining > 0 && (
                                  <p className="text-[10px] text-muted-foreground">{itemPct}% left</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
