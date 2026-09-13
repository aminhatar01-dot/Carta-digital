import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import ConfiguracionTabs from "@/components/configuracion/tabs";
import MesasManager from "@/components/configuracion/mesas-manager";
import type { RestaurantTable, Zone } from "@/types/database";

export default async function MesasPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const [{ data: zones }, { data: tables }] = await Promise.all([
    supabase.from("zones").select("*").eq("tenant_id", tenantId).order("name"),
    supabase.from("tables").select("*").eq("tenant_id", tenantId).order("number"),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Configuración</h1>
      <p className="text-neutral-500 mb-4 text-sm">Gestión de mesas y zonas del salón.</p>
      <ConfiguracionTabs />
      <MesasManager zones={(zones ?? []) as Zone[]} tables={(tables ?? []) as RestaurantTable[]} />
    </div>
  );
}
