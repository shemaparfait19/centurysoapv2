'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package2,
  Boxes,
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const sections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'New Sale', icon: ShoppingCart, href: '/sales/new' },
      { label: 'Sales History', icon: FileText, href: '/sales' },
      { label: 'Credit Tracking', icon: CreditCard, href: '/credits' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Stock Management', icon: Package2, href: '/stock' },
      { label: 'Batch Tracking', icon: Boxes, href: '/batches' },
      { label: 'Products', icon: Package2, href: '/products' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Customers', icon: Users, href: '/customers' },
      { label: 'Workers', icon: UserCheck, href: '/workers' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Daily Reports', icon: FileText, href: '/reports/daily' },
      { label: 'Custom Reports', icon: TrendingUp, href: '/reports/custom' },
    ],
  },
];

function NavItem({ href, icon: Icon, label, active, onClick }: {
  href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0 transition-colors', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
      <span className="flex-1 truncate">{label}</span>
      {active && <ChevronRight className="h-3 w-3 text-emerald-400/60" />}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">C</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-none">Century</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Cleaning Agency</p>
          </div>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">© 2026 Century Cleaning Agency</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 hover:text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">{sidebar}</div>
        </>
      )}
    </>
  );
}
