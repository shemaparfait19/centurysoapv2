"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { IProduct } from "@/types"

const sizeSchema = z.object({
  size: z.string().min(1, "Size is required"),
  unit: z.string().min(1, "Unit is required"),
  openingStock: z.number().min(0),
  stockIn: z.number().min(0),
  stockSold: z.number().min(0),
  closingStock: z.number().min(0),
})

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sizes: z.array(sizeSchema).min(1, "At least one size is required"),
})

export function ProductsTable() {
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      sizes: [{ size: "500ml", unit: "Bottles", openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "sizes",
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!dialogOpen) {
      form.reset({
        name: "",
        sizes: [{ size: "500ml", unit: "Bottles", openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 }],
      })
      setEditingProduct(null)
    }
  }, [dialogOpen, form])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products.",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: any) => {
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct._id}` 
        : '/api/products'
      
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to save product")

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'added'} successfully.`,
      })
      
      setDialogOpen(false)
      fetchProducts()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product.",
      })
    }
  }

  const handleEdit = (product: IProduct) => {
    setEditingProduct(product)
    form.reset({
      name: product.name,
      sizes: product.sizes,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This will affect all sales history.")) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: "Deleted", description: "Product removed successfully." })
        fetchProducts()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete product." })
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                Define the product name and available sizes/units.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Multipurpose Liquid Detergent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Sizes & Units</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ size: "", unit: "", openingStock: 0, stockIn: 0, stockSold: 0, closingStock: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Size
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md">
                      <FormField
                        control={form.control as any}
                        name={`sizes.${index}.size`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="500ml, 5L, Box..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name={`sizes.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Bottles, Containers..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="submit">Save Product</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Available Sizes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No products found. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id.toString()}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map((size, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {size.size}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(product._id.toString())}
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
    </div>
  )
}
