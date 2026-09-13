import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import KdsBoard from "@/components/cocina/kds-board";

export default async function CocinaPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `*, table:tables(number), items:order_items(*, addons:order_item_addons(*))`
    )
    .eq("tenant_id", tenantId)
    .in("status", ["pendiente", "en_preparacion", "lista"])
    .order("created_at", { ascending: true });

  return <KdsBoard tenantId={tenantId} initialOrders={orders ?? []} />;
}
