'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, FileText, Package2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/sales', icon: FileText, label: 'Sales' },
  { href: '/sales/new', icon: Plus, label: 'New Sale', primary: true },
  { href: '/stock', icon: Package2, label: 'Stock' },
  { href: '/credits', icon: CreditCard, label: 'Credits' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, icon: Icon, label, primary }) => {
          const active = pathname === href;
          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 active:scale-95 transition-transform"
            >
              <Icon
                className={cn('h-5 w-5 transition-colors', active ? 'text-emerald-400' : 'text-slate-500')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-emerald-400' : 'text-slate-500')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
