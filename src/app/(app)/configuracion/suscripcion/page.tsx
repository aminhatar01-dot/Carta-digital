import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import ConfiguracionTabs from "@/components/configuracion/tabs";
import SuscripcionPanel from "@/components/configuracion/suscripcion-panel";

export default async function SuscripcionPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const [{ data: subscription }, { data: payments }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Configuración</h1>
      <p className="text-neutral-500 mb-4 text-sm">Suscripción a Comanda.</p>
      <ConfiguracionTabs />
      <SuscripcionPanel
        subscription={subscription}
        payments={payments ?? []}
        currency={session!.tenant!.currency}
      />
    </div>
  );
}
