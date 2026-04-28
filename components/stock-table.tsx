"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { IProduct } from "@/types"
import {
  Loader2, Save, Search, Plus, ChevronDown, ChevronUp,
  Package2, RotateCcw, Boxes, ArrowRight,
} from "lucide-react"

interface ExistingBatch {
  batchNumber: string
  receivedDate: string
}

export function StockTable() {
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [existingBatches, setExistingBatches] = useState<ExistingBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [openingEdits, setOpeningEdits] = useState<Record<string, Record<number, number>>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Restock dialog
  const [dialog, setDialog] = useState<{
    open: boolean
    productId: string
    productName: string
    sizeIndex: number
    sizeName: string
  } | null>(null)
  const [batchMode, setBatchMode] = useState<"existing" | "new">("existing")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [newBatchNumber, setNewBatchNumber] = useState("")
  const [newBatchDate, setNewBatchDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [restockQty, setRestockQty] = useState("")
  const [dialogSaving, setDialogSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/batches'),
      ])
      if (pRes.ok) setProducts(await pRes.json())
      if (bRes.ok) {
        const bd = await bRes.json()
        setExistingBatches(bd.batches.map((b: any) => ({
          batchNumber: b.batchNumber,
          receivedDate: b.receivedDate,
        })))
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data." })
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (key: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const setOpening = (productId: string, idx: number, val: string) =>
    setOpeningEdits(prev => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [idx]: parseInt(val) || 0 },
    }))

  const saveChanges = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(openingEdits).map(([productId, sizeMap]) => {
          const product = products.find(p => p._id.toString() === productId)!
          const updatedSizes = product.sizes.map((s, i) => {
            if (sizeMap[i] === undefined) return s
            const openingStock = sizeMap[i]
            return { ...s, openingStock, closingStock: openingStock + s.stockIn - s.stockSold }
          })
          return fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sizes: updatedSizes }),
          })
        })
      )
      toast({ title: "Saved", description: "Opening stock updated." })
      setOpeningEdits({})
      loadAll()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save." })
    } finally {
      setSaving(false)
    }
  }

  const handleCarryForward = async () => {
    if (!confirm("Start a new period? Closing stock becomes opening stock and batches are cleared.")) return
    setSaving(true)
    try {
      const res = await fetch('/api/products/carry-forward', { method: 'POST' })
      if (res.ok) {
        toast({ title: "New period started" })
        loadAll()
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally {
      setSaving(false)
    }
  }

  const openDialog = (productId: string, productName: string, sizeIndex: number, sizeName: string) => {
    setDialog({ open: true, productId, productName, sizeIndex, sizeName })
    setBatchMode(existingBatches.length > 0 ? "existing" : "new")
    setSelectedBatch(existingBatches[0]?.batchNumber || "")
    setNewBatchNumber("")
    setNewBatchDate(format(new Date(), "yyyy-MM-dd"))
    setRestockQty("")
  }

  const handleRestock = async () => {
    if (!dialog) return
    const qty = parseInt(restockQty)
    if (!qty || qty <= 0) { toast({ variant: "destructive", title: "Enter a valid quantity" }); return }

    const batchNumber = batchMode === "existing" ? selectedBatch : newBatchNumber.trim()
    const batchDate = batchMode === "existing"
      ? (existingBatches.find(b => b.batchNumber === selectedBatch)?.receivedDate || new Date().toISOString())
      : newBatchDate

    if (!batchNumber) { toast({ variant: "destructive", title: "Enter a batch number" }); return }

    setDialogSaving(true)
    try {
      const res = await fetch(`/api/products/${dialog.productId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sizeIndex: dialog.sizeIndex,
          batchNumber,
          receivedDate: batchDate,
          quantityIn: qty,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed")
      toast({ title: "Stock recorded", description: `${qty} units added to batch ${batchNumber}.` })
      setDialog(null)
      // auto-expand that product's batches
      setExpanded(prev => new Set(prev).add(dialog.productId))
      loadAll()
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Failed" })
    } finally {
      setDialogSaving(false)
    }
  }

  const getStatus = (closing: number) => {
    if (closing < 10) return { label: "Low", cls: "bg-red-100 text-red-700 border-red-200" }
    if (closing < 20) return { label: "Warning", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "OK", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Loading inventory...</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9 bg-white" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {Object.keys(openingEdits).length > 0 && (
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleCarryForward} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" /> New Period
          </Button>
        </div>
      </div>

      {/* Product cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No products found.</p>
          </div>
        ) : filtered.map((product) => {
          const productId = product._id.toString()
          const isBatchExpanded = expanded.has(productId)
          // Collect all batches across all sizes of this product
          const allBatches: Record<string, { batchNumber: string; receivedDate: string; items: { size: string; quantityIn: number; quantitySold: number; remaining: number }[] }> = {}
          product.sizes.forEach(size => {
            ((size as any).batches || []).forEach((b: any) => {
              if (!allBatches[b.batchNumber]) {
                allBatches[b.batchNumber] = { batchNumber: b.batchNumber, receivedDate: b.receivedDate, items: [] }
              }
              allBatches[b.batchNumber].items.push({ size: size.size, quantityIn: b.quantityIn, quantitySold: b.quantitySold, remaining: b.remaining })
            })
          })
          const batchGroups = Object.values(allBatches).sort(
            (a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
          )
          const hasBatches = batchGroups.length > 0

          return (
            <div key={productId} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Product header */}
              <div className="px-5 py-3 bg-slate-800 flex items-center gap-2">
                <Package2 className="h-4 w-4 text-slate-300" />
                <span className="font-semibold text-white">{product.name}</span>
                <span className="text-xs text-slate-400 ml-1">{product.sizes.length} size(s)</span>
              </div>

              {/* Size rows */}
              <div className="divide-y">
                {product.sizes.map((size, sizeIndex) => {
                  const editedOpening = openingEdits[productId]?.[sizeIndex]
                  const opening = editedOpening !== undefined ? editedOpening : size.openingStock
                  const stockIn = size.stockIn
                  const sold = size.stockSold
                  const closing = editedOpening !== undefined ? opening + stockIn - sold : size.closingStock
                  const status = getStatus(closing)

                  return (
                    <div key={sizeIndex} className="px-5 py-4 grid grid-cols-[auto_1fr] gap-4 items-center">
                      {/* Size label */}
                      <div className="w-20">
                        <span className="text-sm font-bold text-slate-700">{size.size}</span>
                        <p className="text-[10px] text-muted-foreground">{size.unit}</p>
                      </div>

                      {/* Stats + action */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Opening (editable) */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Opening</span>
                          <Input
                            type="number" min="0"
                            className="h-8 w-20 text-center text-sm"
                            value={opening}
                            onChange={(e) => setOpening(productId, sizeIndex, e.target.value)}
                          />
                        </div>

                        <span className="text-slate-300 text-lg">+</span>

                        {/* Stock In (from batches) */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Stock In</span>
                          <div className="h-8 w-16 flex items-center justify-center text-sm font-semibold text-blue-700 bg-blue-50 rounded-md border border-blue-100">
                            {stockIn}
                          </div>
                        </div>

                        <span className="text-slate-300 text-lg">−</span>

                        {/* Sold */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Sold</span>
                          <div className="h-8 w-16 flex items-center justify-center text-sm font-medium text-orange-600 bg-orange-50 rounded-md border border-orange-100">
                            {sold}
                          </div>
                        </div>

                        <span className="text-slate-300 text-lg">=</span>

                        {/* Closing */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Closing</span>
                          <div className={`h-8 w-16 flex items-center justify-center text-sm font-bold rounded-md border ${
                            closing < 10 ? 'bg-red-50 text-red-700 border-red-200' :
                            closing < 20 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {closing}
                          </div>
                        </div>

                        {/* Status pill */}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>
                          {status.label}
                        </span>

                        {/* Restock button */}
                        <Button
                          size="sm"
                          className="ml-auto h-8 bg-slate-800 hover:bg-slate-700 text-white text-xs"
                          onClick={() => openDialog(productId, product.name, sizeIndex, size.size)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Restock
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* View Batches toggle */}
              {hasBatches && (
                <div className="border-t">
                  <button
                    className="w-full flex items-center justify-between px-5 py-2.5 text-sm text-muted-foreground hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(productId)}
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="h-4 w-4" />
                      <span className="font-medium">
                        {isBatchExpanded ? "Hide batches" : `View batches (${batchGroups.length})`}
                      </span>
                    </div>
                    {isBatchExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {/* Batch breakdown */}
                  {isBatchExpanded && (
                    <div className="border-t bg-slate-50 divide-y">
                      {batchGroups.map((batch, bi) => {
                        const totalIn = batch.items.reduce((s, i) => s + i.quantityIn, 0)
                        const totalRemaining = batch.items.reduce((s, i) => s + i.remaining, 0)
                        const pct = Math.round((totalRemaining / totalIn) * 100)
                        const depleted = totalRemaining === 0

                        return (
                          <div key={bi} className={`px-5 py-4 ${depleted ? 'opacity-50' : ''}`}>
                            {/* Batch header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-blue-700">{batch.batchNumber}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(batch.receivedDate), "dd MMM yyyy")}
                                </span>
                                {depleted && (
                                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Depleted</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">{totalIn} in</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className={`font-bold ${depleted ? 'text-slate-400' : 'text-emerald-700'}`}>
                                  {totalRemaining} remaining
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                              <div
                                className={`h-full rounded-full ${
                                  depleted ? 'bg-slate-300' :
                                  pct < 20 ? 'bg-red-400' :
                                  pct < 50 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Size breakdown */}
                            <div className="flex flex-wrap gap-2">
                              {batch.items.map((item, ii) => (
                                <div key={ii} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-xs">
                                  <span className="font-semibold text-slate-700">{item.size}</span>
                                  <span className="text-muted-foreground">·</span>
                                  <span className="text-orange-600">{item.quantitySold} sold</span>
                                  <span className="text-muted-foreground">·</span>
                                  <span className={`font-bold ${item.remaining === 0 ? 'text-slate-400' : item.remaining < 10 ? 'text-red-600' : 'text-emerald-700'}`}>
                                    {item.remaining === 0 ? 'empty' : `${item.remaining} left`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Restock Dialog */}
      {dialog && (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Record Stock In</DialogTitle>
            </DialogHeader>

            {/* Product info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border text-sm">
              <Package2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <span className="font-semibold text-slate-800">{dialog.productName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-600">{dialog.sizeName}</span>
            </div>

            <div className="space-y-4">
              {/* Batch selection */}
              <div className="space-y-2">
                <Label>Batch</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      batchMode === "existing" ? "bg-slate-800 text-white" : "bg-white text-muted-foreground hover:bg-slate-50"
                    }`}
                    onClick={() => setBatchMode("existing")}
                    disabled={existingBatches.length === 0}
                  >
                    Existing batch
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      batchMode === "new" ? "bg-slate-800 text-white" : "bg-white text-muted-foreground hover:bg-slate-50"
                    }`}
                    onClick={() => setBatchMode("new")}
                  >
                    New batch
                  </button>
                </div>

                {batchMode === "existing" ? (
                  <select
                    className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    {existingBatches.map(b => (
                      <option key={b.batchNumber} value={b.batchNumber}>
                        {b.batchNumber} — {format(new Date(b.receivedDate), "dd MMM yyyy")}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Batch number</Label>
                      <Input
                        placeholder="e.g. B003"
                        value={newBatchNumber}
                        onChange={(e) => setNewBatchNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date received</Label>
                      <Input
                        type="date"
                        value={newBatchDate}
                        onChange={(e) => setNewBatchDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label>Quantity received</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Number of units"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRestock()}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleRestock} disabled={dialogSaving}>
                {dialogSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
