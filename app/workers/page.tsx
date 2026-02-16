import { WorkersTable } from "@/components/workers-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Workers Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>
            Manage your sales representatives and staff members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkersTable />
        </CardContent>
      </Card>
    </div>
  );
}
