"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ICustomer } from "@/types"

interface CustomerSearchProps {
  onSelect: (customer: { name: string; phone: string; id?: string }) => void
  defaultValue?: string
}

export function CustomerSearch({ onSelect, defaultValue }: CustomerSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(defaultValue || "")
  const [phone, setPhone] = useState("")
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setCustomers([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setCustomers(data)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSelect = (customer: ICustomer) => {
    setQuery(customer.name)
    setPhone(customer.phone)
    onSelect({ name: customer.name, phone: customer.phone, id: customer._id as string })
    setOpen(false)
  }

  const handleNewCustomer = () => {
    if (query && phone) {
      onSelect({ name: query, phone: phone })
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {query || "Select or Type Customer Name..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex flex-col p-2 gap-2">
            <div className="flex items-center border rounded-md px-3 bg-slate-50">
              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                placeholder="Search name..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 px-0 h-9 bg-transparent"
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto">
              {loading && <div className="p-2 text-sm text-center">Loading...</div>}
              {!loading && customers.length === 0 && query.length >= 2 && (
                <div className="p-2 text-sm text-center text-muted-foreground font-italic">
                  No existing customer found.
                </div>
              )}
              {customers.map((customer) => (
                <button
                  key={customer._id as any}
                  className="flex flex-col w-full text-left p-2 hover:bg-slate-100 rounded-md transition-colors"
                  onClick={() => handleSelect(customer)}
                >
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">{customer.phone}</span>
                </button>
              ))}
            </div>

            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">NEW CUSTOMER INFO</p>
              <Input 
                placeholder="Phone Number" 
                value={phone} 
                onChange={(e) => {
                  setPhone(e.target.value)
                  onSelect({ name: query, phone: e.target.value })
                }}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
