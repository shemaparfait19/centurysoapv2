import { StockTable } from "@/components/stock-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Manage product stock levels. Update opening stock and stock in values to recalculate closing stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTable />
        </CardContent>
      </Card>
    </div>
  );
}
