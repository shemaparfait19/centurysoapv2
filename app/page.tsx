'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCard } from '@/components/dashboard-card';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  CreditCard,
  Banknote,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[350px] rounded-xl" />
          <Skeleton className="col-span-3 h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Sales Today"
          value={formatCurrency(stats?.todayTotalSales || 0)}
          icon={DollarSign}
          description="Daily revenue"
        />
        <DashboardCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          description="Active inventory items"
        />
        <DashboardCard
          title="Cash Payments"
          value={formatCurrency(stats?.todayCashSales || 0)}
          icon={Banknote}
          description="Received in cash today"
        />
        <DashboardCard
          title="MoMo Payments"
          value={formatCurrency(stats?.todayMoMoSales || 0)}
          icon={CreditCard}
          description="Received via MoMo today"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Selling Products */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.product}</p>
                      <p className="text-sm text-muted-foreground">{item.size}</p>
                    </div>
                    <div className="font-bold flex flex-col items-end">
                      <span>{item.quantity} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No sales data available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.product}</p>
                      <p className="text-sm text-muted-foreground">{item.size}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                        {item.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">All stock levels are healthy.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
