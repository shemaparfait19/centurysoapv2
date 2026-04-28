import { ProductsTable } from '@/components/products-table'

export default function ProductsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog and sizes</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <ProductsTable />
      </div>
    </div>
  )
}
