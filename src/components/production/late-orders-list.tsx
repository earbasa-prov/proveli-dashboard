"use client";

import { useProductionData } from "@/lib/production/production-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";

function UrgencyBadge({ days }: { days: number }) {
  if (days > 7) return <Badge className="font-mono bg-rose-500 text-white hover:bg-rose-600">{days} days</Badge>;
  if (days >= 1) return <Badge className="font-mono bg-amber-400 text-amber-950">{days} days</Badge>;
  return null;
}

export function LateOrdersList() {
  const { stats } = useProductionData();
  if (!stats) return null;

  const lateOrders = stats.lateOrders;
  const displayOrders = lateOrders.slice(0, 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Critical Late Orders
        </CardTitle>
        <p className="text-sm text-muted-foreground">Orders past Ship By Date with Ageing Old Days — sorted by urgency</p>
      </CardHeader>
      <CardContent>
        {lateOrders.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No late orders in the selected period</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Ship By Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ageing Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayOrders.map((order) => (
                <TableRow key={order.orderNo}>
                  <TableCell className="font-mono font-medium">{order.orderNo}</TableCell>
                  <TableCell>{order.channel}</TableCell>
                  <TableCell>{format(parseISO(order.shipByDate), "MMM d, yyyy")}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">{order.status}</Badge></TableCell>
                  <TableCell className="text-right"><UrgencyBadge days={order.ageingDays ?? 0} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {lateOrders.length > 50 && (
          <p className="mt-2 text-sm text-muted-foreground">Showing 50 of {lateOrders.length} late orders</p>
        )}
      </CardContent>
    </Card>
  );
}
