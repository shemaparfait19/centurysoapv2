'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, MapPin, Trash2, Edit, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ICustomer } from '@/types'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500']
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length]

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(8, 'Phone is required'),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<ICustomer | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', address: '', email: '' },
  })

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
      if (res.ok) setCustomers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const openDialog = (customer?: ICustomer) => {
    setSelected(customer || null)
    form.reset(
      customer
        ? { name: customer.name, phone: customer.phone, address: customer.address || '', email: customer.email || '' }
        : { name: '', phone: '', address: '', email: '' }
    )
    setDialogOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.ok) {
        toast({ title: 'Saved', description: `Customer ${selected ? 'updated' : 'added'}.` })
        setDialogOpen(false)
        fetchCustomers()
      } else {
        throw new Error()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save customer.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Customer removed.' })
        fetchCustomers()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete.' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} registered clients</p>
        </div>
        <button
          onClick={() => openDialog()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white border-slate-200 rounded-xl h-11"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-[72px] animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No customers found</p>
          <p className="text-slate-400 text-sm mt-1">
            {searchTerm ? 'Try a different search' : 'Add your first customer above'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div
              key={c._id as string}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100"
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg',
                  avatarColor(c.name)
                )}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />{c.phone}
                  </span>
                  {c.address && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{c.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openDialog(c)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(c._id as string)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="07XXXXXXXX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl><Input placeholder="john@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl><Input placeholder="Kigali, Rwanda" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selected ? 'Update Customer' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
