'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    color: 'text-sky-500',
  },
  {
    label: 'Sales Entry',
    icon: ShoppingCart,
    href: '/sales/new',
    color: 'text-violet-500',
  },
  {
    label: 'Sales History',
    icon: FileText,
    href: '/sales',
    color: 'text-pink-700',
  },
  {
    label: 'Stock Management',
    icon: Package,
    href: '/stock',
    color: 'text-orange-700',
  },
  {
    label: 'Products',
    icon: Package,
    href: '/products',
    color: 'text-purple-600',
  },
  {
    label: 'Workers',
    icon: Users,
    href: '/workers',
    color: 'text-emerald-500',
  },
  {
    label: 'Daily Reports',
    icon: FileText,
    href: '/reports/daily',
    color: 'text-green-700',
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-6 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-white">Century products</span>
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-800">
            <div className="text-xs text-zinc-500 text-center">
              ©century products developed by shemaparfait
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
