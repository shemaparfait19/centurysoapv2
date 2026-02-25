"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, Search, Loader2, UserPlus } from "lucide-react"
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
    onSelect({ name: customer.name, phone: customer.phone, id: customer._id as any })
    setOpen(false)
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    // When typing a new name, we notify the parent so it's captured as potential new customer
    onSelect({ name: val, phone: phone })
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 bg-white border-slate-200 hover:border-primary transition-all duration-200"
          >
            <div className="flex flex-col items-start text-left truncate">
              <span className="font-semibold text-sm text-slate-700">{query || "Search or Add Customer..."}</span>
              {phone && query && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full mt-0.5 font-bold uppercase tracking-wider">{phone}</span>}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 shadow-2xl border-slate-200 overflow-hidden rounded-xl" align="start">
          <div className="bg-gradient-to-br from-slate-50 to-white p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Name / Search</label>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Search className="h-4 w-4 mr-2 text-slate-400" />
                <Input 
                  placeholder="Type name or phone number..." 
                  value={query} 
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="border-0 focus-visible:ring-0 px-0 h-10 text-sm bg-transparent"
                />
              </div>
            </div>
            
            <div className="max-h-[180px] overflow-y-auto pr-1">
              {customers.length > 0 && (
                <div className="py-1">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matching Database Records</p>
                  </div>
                  <div className="space-y-1">
                    {customers.map((customer) => (
                      <button
                        key={customer._id as any}
                        className="flex flex-col w-full text-left p-3 hover:bg-white hover:shadow-md hover:border-primary border border-transparent rounded-xl transition-all group relative overflow-hidden"
                        onClick={() => handleSelect(customer)}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                        <span className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{customer.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{customer.phone}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!loading && customers.length === 0 && query.length >= 2 && (
                <div className="p-4 text-center bg-orange-50 rounded-xl border border-orange-100">
                  <UserPlus className="h-5 w-5 mx-auto text-orange-400 mb-1" />
                  <p className="text-xs font-bold text-orange-700">New Customer Found</p>
                  <p className="text-[10px] text-orange-600 mt-0.5">Will be registered upon checkout</p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Phone Number Setup</span>
                  </div>
                  {phone && <Check className="h-3 h-3 text-emerald-500" />}
                </div>
                <div className="space-y-1.5">
                  <Input 
                    placeholder="Enter phone..." 
                    value={phone} 
                    onChange={(e) => {
                      setPhone(e.target.value)
                      onSelect({ name: query, phone: e.target.value })
                    }}
                    className="h-10 text-sm bg-white border-slate-200 focus:border-primary shadow-sm rounded-lg font-mono tracking-tight"
                  />
                  <p className="text-[9px] text-slate-400 font-medium px-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    Required to finalize new registration
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full h-10 font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all rounded-lg" 
              onClick={() => setOpen(false)}
              disabled={!query}
            >
              Confirm Selection
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
