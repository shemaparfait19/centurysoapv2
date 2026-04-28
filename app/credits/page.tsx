"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { DollarSign, AlertCircle, CheckCircle2, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

export default function CreditsPage() {
  const { toast } = useToast()
  const [credits, setCredits] = useState<any[]>([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [loading, setLoading] = useState(true)

  const [dialog, setDialog] = useState<{ open: boolean; sale: any | null }>({ open: false, sale: null })
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState<"Cash" | "MoMo">("Cash")
  const [payNote, setPayNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchCredits() }, [])

  async function fetchCredits() {
    setLoading(true)
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setCredits(data.credits)
        setTotalOutstanding(data.totalOutstanding)
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load credit sales." })
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (sale: any) => {
    setDialog({ open: true, sale })
    setPayAmount("")
    setPayMethod("Cash")
    setPayNote("")
  }

  const handleRecordPayment = async () => {
    if (!dialog.sale) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sales/${dialog.sale._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod, note: payNote }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed")
      toast({ title: "Payment recorded", description: `${formatCurrency(amount)} collected.` })
      setDialog({ open: false, sale: null })
      fetchCredits()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Failed" })
    } finally {
      setSubmitting(false)
    }
  }

  const pending = credits.filter(c => c.paymentStatus === 'Pending')
  const partial = credits.filter(c => c.paymentStatus === 'Partial')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Tracking</h1>
        <p className="text-muted-foreground mt-1">Track customers who haven't paid yet and record their payments.</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-800">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">Unpaid</p>
                <p className="text-2xl font-bold text-orange-800">{pending.length} sale{pending.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Partially Paid</p>
                <p className="text-2xl font-bold text-amber-800">{partial.length} sale{partial.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit list */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balances</CardTitle>
          <CardDescription>Click "Collect" to record a payment from a customer.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : credits.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="font-medium text-emerald-700">All clear — no outstanding balances!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credits.map((sale) => {
                const isPending = sale.paymentStatus === 'Pending'
                const paidPct = Math.round(((sale.amountPaid || 0) / sale.grandTotal) * 100)
                return (
                  <div
                    key={sale._id}
                    className={`rounded-xl border p-4 ${isPending ? 'border-red-200 bg-red-50/40' : 'border-amber-200 bg-amber-50/40'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800 truncate">{sale.customer?.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            isPending ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {isPending ? 'Unpaid' : 'Partial'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sale.customer?.phone} &middot; {format(new Date(sale.date), "dd MMM yyyy")} &middot; {sale.workerName}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Paid {formatCurrency(sale.amountPaid || 0)} of {formatCurrency(sale.grandTotal)}</span>
                            <span className="font-semibold text-red-700">{formatCurrency(sale.balance)} left</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all"
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Payment history pills */}
                        {(sale.payments || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sale.payments.map((p: any, i: number) => (
                              <span key={i} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                +{formatCurrency(p.amount)} · {format(new Date(p.date), "dd MMM")} · {p.method}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 text-white"
                        onClick={() => openDialog(sale)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Collect
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {dialog.sale && (
            <div className="space-y-4 py-1">
              <div className="p-3 bg-slate-50 rounded-lg border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-semibold">{dialog.sale.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale total</span>
                  <span className="font-medium">{formatCurrency(dialog.sale.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already paid</span>
                  <span className="font-medium text-emerald-700">{formatCurrency(dialog.sale.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="font-semibold">Balance due</span>
                  <span className="font-bold text-red-700">{formatCurrency(dialog.sale.balance || 0)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Amount collecting now (RWF)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={dialog.sale.balance}
                    placeholder={`Max ${formatCurrency(dialog.sale.balance)}`}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRecordPayment()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as "Cash" | "MoMo")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="MoMo">MoMo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input placeholder="e.g. partial payment" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, sale: null })}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>
              {submitting ? "Saving..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
