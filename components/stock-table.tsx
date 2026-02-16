"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { IProduct, ProductSize } from "@/types"
import { Loader2, Save, Search } from "lucide-react"

export function StockTable() {
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [edits, setEdits] = useState<Record<string, ProductSize[]>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

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
        description: "Failed to load stock data.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStockChange = (productId: string, sizeIndex: number, field: 'openingStock' | 'stockIn', value: string) => {
    const numValue = parseInt(value) || 0
    
    setEdits(prev => {
      const productEdits = prev[productId] ? [...prev[productId]] : 
        [...products.find(p => p._id === productId)?.sizes || []]
      
      productEdits[sizeIndex] = {
        ...productEdits[sizeIndex],
        [field]: numValue
      }
      
      // Recalculate derived fields
      const size = productEdits[sizeIndex]
      const totalAvailable = (size.openingStock || 0) + (size.stockIn || 0)
      size.closingStock = totalAvailable - (size.stockSold || 0)

      return {
        ...prev,
        [productId]: productEdits
      }
    })
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      const promises = Object.entries(edits).map(([productId, sizes]) => 
        fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sizes })
        })
      )

      await Promise.all(promises)

      toast({
        title: "Success",
        description: "Stock updated successfully.",
      })
      
      setEdits({})
      fetchProducts()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save changes.",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDisplaySize = (product: IProduct, sizeIndex: number) => {
    if (edits[product._id as string]) {
      return edits[product._id as string][sizeIndex]
    }
    return product.sizes[sizeIndex]
  }

  const getRowColor = (closingStock: number) => {
    if (closingStock < 10) return "bg-red-50 hover:bg-red-100"
    if (closingStock < 20) return "bg-yellow-50 hover:bg-yellow-100"
    return ""
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {Object.keys(edits).length > 0 && (
          <Button onClick={saveChanges} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[120px]">Opening Stock</TableHead>
              <TableHead className="w-[120px]">Stock In</TableHead>
              <TableHead>Total Avail.</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Closing</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              product.sizes.map((originalSize, index) => {
                const size = getDisplaySize(product, index)
                const totalAvailable = (size.openingStock || 0) + (size.stockIn || 0)
                
                return (
                  <TableRow key={`${product._id}-${size.size}`} className={getRowColor(size.closingStock)}>
                    {index === 0 && (
                      <TableCell rowSpan={product.sizes.length} className="font-medium align-top border-r bg-white">
                        {product.name}
                      </TableCell>
                    )}
                    <TableCell>{size.size}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="h-8"
                        value={size.openingStock}
                        onChange={(e) => handleStockChange(product._id as string, index, 'openingStock', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="h-8"
                        value={size.stockIn}
                        onChange={(e) => handleStockChange(product._id as string, index, 'stockIn', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{totalAvailable}</TableCell>
                    <TableCell>{size.stockSold}</TableCell>
                    <TableCell className="font-bold">{size.closingStock}</TableCell>
                    <TableCell>
                      {size.closingStock < 10 ? (
                        <span className="text-red-600 font-bold text-xs">Low Stock</span>
                      ) : size.closingStock < 20 ? (
                        <span className="text-yellow-600 font-bold text-xs">Warning</span>
                      ) : (
                        <span className="text-green-600 font-bold text-xs">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
