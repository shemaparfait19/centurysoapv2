'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus, Pencil, Trash2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { IWorker } from '@/types'
import { cn } from '@/lib/utils'

const COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500']
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length]

const workerSchema = z.object({
  name: z.string().min(2, 'Name requires at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.string().min(2, 'Role is required'),
  active: z.boolean(),
})
type WorkerForm = z.infer<typeof workerSchema>

export function WorkersTable() {
  const { toast } = useToast()
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IWorker | null>(null)

  const form = useForm<WorkerForm>({
    resolver: zodResolver(workerSchema) as any,
    defaultValues: { name: '', phone: '', role: 'Sales Representative', active: true },
  })

  useEffect(() => { fetchWorkers() }, [])

  useEffect(() => {
    if (!dialogOpen) {
      form.reset({ name: '', phone: '', role: 'Sales Representative', active: true })
      setEditing(null)
    }
  }, [dialogOpen])

  async function fetchWorkers() {
    try {
      const res = await fetch('/api/workers')
      if (res.ok) setWorkers(await res.json())
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load workers.' })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: WorkerForm) => {
    try {
      const url = editing ? `/api/workers/${editing._id}` : '/api/workers'
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Saved', description: `Worker ${editing ? 'updated' : 'added'}.` })
      setDialogOpen(false)
      fetchWorkers()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save worker.' })
    }
  }

  const handleEdit = (worker: IWorker) => {
    setEditing(worker)
    form.reset({ name: worker.name, phone: worker.phone, role: worker.role, active: worker.active })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this worker?')) return
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Worker removed.' })
        fetchWorkers()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete worker.' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-[72px] animate-pulse border border-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Add Worker
        </button>
      </div>

      {/* Worker cards */}
      {workers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No workers yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first team member above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <div
              key={worker._id.toString()}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100"
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg',
                  avatarColor(worker.name)
                )}
              >
                {worker.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{worker.name}</p>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      worker.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {worker.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-slate-500">{worker.role}</span>
                  <span className="text-xs text-slate-400">{worker.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(worker)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(worker._id.toString())}
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
            <DialogTitle>{editing ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control as any} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="078..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl><Input placeholder="Sales Representative" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="active" render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription className="text-xs text-slate-400">
                      This worker can be selected when recording sales.
                    </FormDescription>
                  </div>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                  Save Worker
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
