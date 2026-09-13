import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import SalonBoard from "@/components/salon/salon-board";
import type { Order, RestaurantTable, Zone } from "@/types/database";

export default async function SalonPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const [{ data: tables }, { data: zones }, { data: orders }] = await Promise.all([
    supabase.from("tables").select("*").eq("tenant_id", tenantId).order("number"),
    supabase.from("zones").select("*").eq("tenant_id", tenantId),
    supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelada")
      .not("table_id", "is", null),
  ]);

  return (
    <SalonBoard
      tenantId={tenantId}
      tables={(tables ?? []) as RestaurantTable[]}
      zones={(zones ?? []) as Zone[]}
      orders={(orders ?? []) as Order[]}
      currency={session!.tenant!.currency}
    />
  );
}
