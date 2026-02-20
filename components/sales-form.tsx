"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { IProduct, IWorker, ProductSize } from "@/types"
import { CustomerSearch } from "./customer-search"

const itemSchema = z.object({
  product: z.string().min(1, "Product is required"),
  size: z.string().min(1, "Size is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be at least 0"),
  total: z.number(),
})

const formSchema = z.object({
  date: z.date(),
  customer: z.object({
    name: z.string().min(2, "Customer name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    id: z.string().optional(),
  }),
  workerName: z.string().min(1, "Worker is required"),
  paymentMethod: z.enum(["Cash", "MoMo"]),
  items: z.array(itemSchema).min(1, "At least one item is required"),
})

type FormValues = z.infer<typeof formSchema>

export function SalesForm() {
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      customer: { name: "", phone: "" },
      workerName: "",
      paymentMethod: "Cash",
      items: [{ product: "", size: "", quantity: 1, unitPrice: 0, total: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  })

  // Fetch products and workers
  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, wRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/workers')
        ])
        if (pRes.ok && wRes.ok) {
          setProducts(await pRes.json())
          setWorkers(await wRes.json())
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Fetch Error", description: "Failed to load products/workers" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  // Watch items to update individual totals and grand total
  const watchedItems = form.watch("items")
  const grandTotal = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0)

  // Update individual item total when quantity or price changes
  const updateItemTotal = (index: number) => {
    const item = form.getValues(`items.${index}`)
    const total = (item.quantity || 0) * (item.unitPrice || 0)
    form.setValue(`items.${index}.total`, total)
  }

  const handleProductSelect = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName)
    if (product) {
      form.setValue(`items.${index}.product`, productName)
      form.setValue(`items.${index}.size`, "") // Reset size
    }
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      // 1. Process/Save Customer first
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values.customer),
      })
      const customerData = await custRes.json()
      
      // 2. Submit Sale
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          customer: {
            name: customerData.name,
            phone: customerData.phone,
            id: customerData._id
          },
          grandTotal
        }),
      })

      if (!saleRes.ok) {
        const err = await saleRes.json()
        throw new Error(err.error || "Failed to record sale")
      }

      toast({ title: "Success", description: "Sale recorded successfully" })
      form.reset({
        date: new Date(),
        customer: { name: "", phone: "" },
        items: [{ product: "", size: "", quantity: 1, unitPrice: 0, total: 0 }],
        paymentMethod: "Cash",
        workerName: values.workerName, // Keep worker for convenience
      })
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Submission failed" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-xl bg-white shadow-sm">
          {/* Customer & Global Info */}
          <FormField
            control={form.control}
            name="customer.name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Customer Search/Add</FormLabel>
                <FormControl>
                  <CustomerSearch 
                    defaultValue={field.value}
                    onSelect={(c) => {
                      form.setValue("customer.name", c.name)
                      form.setValue("customer.phone", c.phone)
                      form.setValue("customer.id", c.id)
                    }} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sold By (Worker)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {workers.map(w => <SelectItem key={w._id.toString()} value={w.name}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="MoMo">MoMo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sale Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ product: "", size: "", quantity: 1, unitPrice: 0, total: 0 })}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-slate-50 relative group">
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.product`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Product</FormLabel>
                        <Select onValueChange={(val) => handleProductSelect(index, val)} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p._id.toString()} value={p.name}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.size`}
                    render={({ field }) => {
                      const selProd = form.watch(`items.${index}.product`)
                      const sizes = products.find(p => p.name === selProd)?.sizes || []
                      return (
                        <FormItem>
                          <FormLabel className="sr-only">Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selProd}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {sizes.map(s => <SelectItem key={s.size} value={s.size}>{s.size} ({s.closingStock})</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>

                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Qty" 
                            {...field} 
                            onChange={(e) => { field.onChange(e); updateItemTotal(index); }} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Price" 
                            {...field} 
                            onChange={(e) => { field.onChange(e); updateItemTotal(index); }} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2 flex items-center px-2">
                  <span className="text-sm font-semibold">
                    {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(watchedItems[index]?.total || 0)}
                  </span>
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-primary/5 rounded-xl border border-primary/10">
          <div className="text-sm text-muted-foreground mb-2 md:mb-0">
            {watchedItems.length} items in this sale
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium">Grand Total:</span>
            <span className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(grandTotal)}
            </span>
          </div>
        </div>

        <Button type="submit" className="w-full text-lg h-12" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete & Save Sale"}
        </Button>
      </form>
    </Form>
  )
}
