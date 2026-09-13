import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import ConfiguracionTabs from "@/components/configuracion/tabs";
import UsuariosManager from "@/components/configuracion/usuarios-manager";
import type { Profile } from "@/types/database";

export default async function UsuariosPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at");

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Configuración</h1>
      <p className="text-neutral-500 mb-4 text-sm">Usuarios y roles del restaurante.</p>
      <ConfiguracionTabs />
      <UsuariosManager
        profiles={(profiles ?? []) as Profile[]}
        currentUserId={session!.userId}
      />
    </div>
  );
}
