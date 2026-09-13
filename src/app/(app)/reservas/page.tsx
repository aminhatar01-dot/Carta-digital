import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import ReservasManager from "@/components/reservas/reservas-manager";
import type { Reservation, RestaurantTable } from "@/types/database";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();
  const date = searchParams.date || new Date().toISOString().slice(0, 10);

  const [{ data: reservations }, { data: tables }] = await Promise.all([
    supabase
      .from("reservations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("reservation_date", date)
      .order("reservation_time"),
    supabase.from("tables").select("*").eq("tenant_id", tenantId).order("number"),
  ]);

  return (
    <ReservasManager
      date={date}
      reservations={(reservations ?? []) as Reservation[]}
      tables={(tables ?? []) as RestaurantTable[]}
    />
  );
}
