import { SalesForm } from "@/components/sales-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSalePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Transaction</CardTitle>
          <CardDescription>
            Enter the details of the new sale. Stock levels will be updated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesForm />
        </CardContent>
      </Card>
    </div>
  );
}
