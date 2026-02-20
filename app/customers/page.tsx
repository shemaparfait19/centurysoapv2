"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Search, UserPlus, Phone, Mail, MapPin, Edit, Trash2, Loader2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ICustomer } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
      if (res.ok) {
        setCustomers(await res.json())
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load customers" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> New Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Customers</CardTitle>
          <CardDescription>View and manage your client database for faster sales recording.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6 max-w-sm border rounded-md px-3 bg-white">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input 
              placeholder="Filter by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 px-0 h-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No customers found.</TableCell></TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer._id as any}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.address || "No address provided"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(customer.createdAt), "PP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
