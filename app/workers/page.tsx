import { WorkersTable } from '@/components/workers-table'

export default function WorkersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Workers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your sales team and staff</p>
      </div>
      <WorkersTable />
    </div>
  )
}
