import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { supabase } from "@/lib/supabase";
import type { Shipment } from "@/types/shipment";

export default async function DashboardPage() {
  const { data: shipments } = await supabase.from("shipments").select("*");
  // TODO: validate data shape before passing to table

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and track all active logistics shipments.
        </p>
      </div>
      <DataTable columns={columns} data={(shipments ?? []) as Shipment[]} />
    </div>
  );
}
