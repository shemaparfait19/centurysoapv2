'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Banknote,
  Smartphone,
  ShoppingCart,
  Package2,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  CreditCard,
  Boxes,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats } from '@/types';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className={`relative bg-white rounded-2xl border p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow overflow-hidden group`}>
      {/* accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accent} rounded-t-2xl`} />
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`p-2 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors`}>
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {href && (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
          View details <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">{today}</p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Sale
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(stats?.todayTotalSales || 0)}
            sub={`${stats?.todayTransactions || 0} transactions`}
            icon={TrendingUp}
            accent="bg-emerald-500"
            href="/sales"
          />
          <StatCard
            label="Cash Received"
            value={formatCurrency(stats?.todayCashSales || 0)}
            sub="Today"
            icon={Banknote}
            accent="bg-blue-500"
          />
          <StatCard
            label="MoMo Received"
            value={formatCurrency(stats?.todayMoMoSales || 0)}
            sub="Today"
            icon={Smartphone}
            accent="bg-violet-500"
          />
          <StatCard
            label="Credit Outstanding"
            value={formatCurrency(stats?.totalOutstandingCredit || 0)}
            sub="Across all customers"
            icon={CreditCard}
            accent="bg-rose-500"
            href="/credits"
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top selling — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Top Selling Products</span>
            </div>
            <span className="text-xs text-slate-400">All time</span>
          </div>
          <div className="divide-y">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-5 w-full" /></div>
              ))
            ) : !stats?.topProducts?.length ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">No sales recorded yet.</div>
            ) : (
              stats.topProducts.map((item, i) => {
                const max = stats.topProducts[0]?.quantity || 1;
                const pct = Math.round((item.quantity / max) * 100);
                return (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-200 w-6 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-slate-700 truncate block">{item.product}</span>
                          <span className="text-xs text-slate-400">{item.size}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 ml-4 flex-shrink-0">{item.quantity} units</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low stock alerts — 1/3 width */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span className="font-semibold text-slate-800">Low Stock</span>
            </div>
            {(stats?.lowStockAlerts?.length || 0) > 0 && (
              <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                {stats!.lowStockAlerts.length}
              </span>
            )}
          </div>
          <div className="divide-y">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-5 w-full" /></div>
              ))
            ) : !stats?.lowStockAlerts?.length ? (
              <div className="px-6 py-12 text-center">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package2 className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm text-slate-400">All stock levels are healthy</p>
              </div>
            ) : (
              stats.lowStockAlerts.map((item, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.product}</p>
                    <p className="text-xs text-slate-400">{item.size}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                    item.stock === 0
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.stock === 0 ? 'Out' : `${item.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
          {(stats?.lowStockAlerts?.length || 0) > 0 && (
            <div className="px-6 py-3 border-t">
              <Link href="/stock" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Go to Stock Management <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Sale', icon: ShoppingCart, href: '/sales/new', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
            { label: 'Restock', icon: Boxes, href: '/stock', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { label: 'Credits', icon: CreditCard, href: '/credits', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
            { label: 'Customers', icon: Users, href: '/customers', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
          ].map(({ label, icon: Icon, href, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${color} transition-colors font-medium text-sm`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
