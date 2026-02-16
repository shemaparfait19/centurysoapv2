import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {description} {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
