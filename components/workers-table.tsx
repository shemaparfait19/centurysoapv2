"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { IWorker } from "@/types"

const workerSchema = z.object({
  name: z.string().min(2, "Name involves at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.string().min(2, "Role is required"),
  active: z.boolean(),
})

export function WorkersTable() {
  const { toast } = useToast()
  const [workers, setWorkers] = useState<IWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<IWorker | null>(null)

  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      role: "Sales Representative",
      active: true,
    },
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    if (!dialogOpen) {
      form.reset({
        name: "",
        phone: "",
        role: "Sales Representative",
        active: true,
      })
      setEditingWorker(null)
    }
  }, [dialogOpen, form])

  async function fetchWorkers() {
    try {
      const res = await fetch('/api/workers')
      if (res.ok) {
        const data = await res.json()
        setWorkers(data)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workers.",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: any) => {
    try {
      const url = editingWorker 
        ? `/api/workers/${editingWorker._id}` 
        : '/api/workers'
      
      const method = editingWorker ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to save worker")

      toast({
        title: "Success",
        description: `Worker ${editingWorker ? 'updated' : 'added'} successfully.`,
      })
      
      setDialogOpen(false)
      fetchWorkers()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save worker details.",
      })
    }
  }

  const handleEdit = (worker: IWorker) => {
    setEditingWorker(worker)
    form.reset({
      name: worker.name,
      phone: worker.phone,
      role: worker.role,
      active: worker.active,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return

    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: "Deleted", description: "Worker removed successfully." })
        fetchWorkers()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete worker." })
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
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
              <DialogDescription>
                Enter the details of the worker here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="078..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales Representative" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active Status
                        </FormLabel>
                        <FormDescription>
                          This worker can be selected for new sales.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
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
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No workers found. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              workers.map((worker) => (
                <TableRow key={worker._id.toString()}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.role}</TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        worker.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {worker.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(worker)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(worker._id.toString())}
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
