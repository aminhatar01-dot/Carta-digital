import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import CajaBoard from "@/components/caja/caja-board";

export default async function CajaPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const [{ data: pendingOrders }, { data: openPayments }, { data: closures }] = await Promise.all([
    supabase
      .from("orders")
      .select(`*, table:tables(number)`)
      .eq("tenant_id", tenantId)
      .eq("paid", false)
      .neq("status", "cancelada")
      .order("created_at", { ascending: true }),
    supabase
      .from("order_payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("cash_closure_id", null),
    supabase
      .from("cash_closures")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("closed_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <CajaBoard
      pendingOrders={pendingOrders ?? []}
      openPayments={openPayments ?? []}
      closures={closures ?? []}
      currency={session!.tenant!.currency}
    />
  );
}
