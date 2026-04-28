import Link from "next/link";
import { Boxes } from "lucide-react";
import { StockTable } from "@/components/stock-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
        <Link href="/batches">
          <Button variant="outline" className="gap-2">
            <Boxes className="h-4 w-4 text-blue-500" />
            View All Batches
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Click <strong>Restock</strong> on any size to record new stock. Use <strong>View batches</strong> on each product to see batch breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTable />
        </CardContent>
      </Card>
    </div>
  );
}
