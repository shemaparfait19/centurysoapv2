"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { DollarSign, AlertCircle } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

export default function CreditsPage() {
  const { toast } = useToast()
  const [credits, setCredits] = useState<any[]>([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [loading, setLoading] = useState(true)

  // Payment dialog
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
      toast({ variant: "destructive", title: "Invalid amount", description: "Enter a valid payment amount." })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sales/${dialog.sale._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod, note: payNote }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast({ title: "Payment recorded", description: `${formatCurrency(amount)} recorded.` })
      setDialog({ open: false, sale: null })
      fetchCredits()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Failed" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Pending') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Unpaid</span>
    if (status === 'Partial') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Partial</span>
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Credit Tracking</h1>
      </div>

      {/* Summary card */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">Total Outstanding Balance</p>
              <p className="text-3xl font-bold text-red-700">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-red-600">{credits.length} unpaid / partially paid sale(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Credit Sales</CardTitle>
          <CardDescription>All sales with a remaining balance. Click "Collect" to record a payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Sale Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No outstanding credits. All sales are fully paid.
                    </TableCell>
                  </TableRow>
                ) : (
                  credits.map((sale) => (
                    <TableRow key={sale._id} className={sale.paymentStatus === 'Pending' ? "bg-red-50/50" : "bg-amber-50/50"}>
                      <TableCell className="text-xs font-medium">{format(new Date(sale.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{sale.customer?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{sale.customer?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{sale.workerName}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.grandTotal)}</TableCell>
                      <TableCell className="text-right text-green-700 font-medium">{formatCurrency(sale.amountPaid || 0)}</TableCell>
                      <TableCell className="text-right text-red-700 font-bold">{formatCurrency(sale.balance || 0)}</TableCell>
                      <TableCell>{getStatusBadge(sale.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => openDialog(sale)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" /> Collect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {dialog.sale && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><span className="font-medium">Customer:</span> {dialog.sale.customer?.name}</p>
                <p><span className="font-medium">Phone:</span> {dialog.sale.customer?.phone}</p>
                <p><span className="font-medium">Sale Total:</span> {formatCurrency(dialog.sale.grandTotal)}</p>
                <p><span className="font-medium">Paid so far:</span> {formatCurrency(dialog.sale.amountPaid || 0)}</p>
                <p className="text-red-600 font-bold">Balance: {formatCurrency(dialog.sale.balance || 0)}</p>
              </div>

              {(dialog.sale.payments || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Payment History</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {(dialog.sale.payments || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs p-2 bg-green-50 rounded">
                        <span>{format(new Date(p.date), "dd MMM yyyy")} · {p.method}{p.note ? ` — ${p.note}` : ''}</span>
                        <span className="font-semibold text-green-700">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Amount to collect (RWF)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={dialog.sale.balance}
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
            <Button variant="outline" onClick={() => setDialog({ open: false, sale: null })}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>
              {submitting ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
