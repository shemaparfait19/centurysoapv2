"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
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

const formSchema = z.object({
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  workerName: z.string({
    required_error: "Please select a worker.",
  }),
  product: z.string({
    required_error: "Please select a product.",
  }),
  size: z.string({
    required_error: "Please select a size.",
  }),
  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
  unitPrice: z.coerce.number().min(1, {
    message: "Unit price must be at least 1.",
  }),
  paymentMethod: z.enum(["Cash", "MoMo"], {
    required_error: "Please select a payment method.",
  }),
  date: z.date({
    required_error: "A date of sale is required.",
  }),
})

export function SalesForm() {
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableSizes, setAvailableSizes] = useState<ProductSize[]>([])

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      quantity: 1,
      unitPrice: 0,
      date: new Date(),
    },
  })

  // Watch product selection to update sizes
  const selectedProduct = form.watch("product")
  const quantity = form.watch("quantity")
  const unitPrice = form.watch("unitPrice")
  const total = (quantity || 0) * (unitPrice || 0)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, workersRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/workers')
        ])
        
        if (productsRes.ok && workersRes.ok) {
          const productsData = await productsRes.json()
          const workersData = await workersRes.json()
          setProducts(productsData)
          setWorkers(workersData)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "Could not load products or workers.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.name === selectedProduct)
      if (product) {
        setAvailableSizes(product.sizes)
        form.setValue("size", "") // Reset size when product changes
      }
    } else {
      setAvailableSizes([])
    }
  }, [selectedProduct, products, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          total: values.quantity * values.unitPrice
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API (e.g., insufficient stock)
        throw new Error(data.error || 'Failed to submit sale')
      }

      toast({
        title: "Sale recorded successfully",
        description: `Total: ${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(values.quantity * values.unitPrice)}`,
      })

      // Refresh products data to update available stock counts
      const productsRes = await fetch('/api/products')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      form.reset({
        clientName: "",
        quantity: 1,
        unitPrice: 0,
        date: new Date(),
        product: "",
        workerName: "",
        size: "",
        paymentMethod: undefined,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save sale. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Sale</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                <FormLabel>Worker</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker._id as string} value={worker.name}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id as string} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size / Unit</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  value={field.value}
                  disabled={!selectedProduct}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProduct ? "Select size" : "Select product first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableSizes.map((size) => (
                      <SelectItem key={size.size} value={size.size}>
                        {size.size} ({size.closingStock} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="MoMo">MoMo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price (RWF)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
          <span className="font-medium text-lg">Total Amount:</span>
          <span className="font-bold text-2xl text-primary">
            {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(total)}
          </span>
        </div>

        <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Sale
        </Button>
      </form>
    </Form>
  )
}
