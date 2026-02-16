"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Download, Search, Trash2, Edit } from "lucide-react"
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

export default function SalesHistoryPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [productFilter, setProductFilter] = useState("all")
  const [workerFilter, setWorkerFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)

  // Data for filters
  const [products, setProducts] = useState<IProduct[]>([])
  const [workers, setWorkers] = useState<IWorker[]>([])

  useEffect(() => {
    // Fetch filter options
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/workers').then(res => res.json())
    ]).then(([productsData, workersData]) => {
      setProducts(productsData)
      setWorkers(workersData)
    }).catch(err => console.error("Failed to load filter options", err))
  }, [])

  useEffect(() => {
    fetchSales()
  }, [currentPage, productFilter, workerFilter, paymentFilter, dateFilter])

  async function fetchSales() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })

      if (productFilter && productFilter !== "all") params.append("product", productFilter)
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch sales history.",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sales.map(sale => ({
      Date: format(new Date(sale.date), "yyyy-MM-dd"),
      Client: sale.clientName,
      Worker: sale.workerName,
      Product: sale.product,
      Size: sale.size,
      Quantity: sale.quantity,
      "Unit Price": sale.unitPrice,
      Total: sale.total,
      "Payment Method": sale.paymentMethod
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History")
    XLSX.writeFile(workbook, `sales_history_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale? Stock will be restored.")) return

    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: "Sale deleted", description: "Stock has been restored." })
        fetchSales()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete sale." })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            View and manage all sales records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map(p => (
                  <SelectItem key={p._id as string} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workerFilter} onValueChange={setWorkerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(w => (
                  <SelectItem key={w._id as string} value={w.name}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="MoMo">MoMo</SelectItem>
              </SelectContent>
            </Select>

            <Input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              placeholder="Filter by Date"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale._id as string}>
                      <TableCell>{formatShortDate(sale.date)}</TableCell>
                      <TableCell>{sale.clientName}</TableCell>
                      <TableCell>{sale.workerName}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={sale.product}>{sale.product}</TableCell>
                      <TableCell>{sale.size}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sale.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(sale._id as string)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Total Sales Amount: <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
