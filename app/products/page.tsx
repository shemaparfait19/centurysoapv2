import { ProductsTable } from "@/components/products-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            Add, edit, and manage your product inventory. Define product names and their available sizes/units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable />
        </CardContent>
      </Card>
    </div>
  );
}
