import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import TomarPedido from "@/components/pedido/tomar-pedido";
import type { MenuCategory, MenuItem, MenuItemAddon, RestaurantTable } from "@/types/database";

export default async function PedidoPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const [{ data: categories }, { data: items }, { data: addons }, { data: tables }] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("sort_order"),
      supabase.from("menu_items").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("menu_item_addons").select("*").eq("tenant_id", tenantId),
      supabase.from("tables").select("*").eq("tenant_id", tenantId).order("number"),
    ]);

  return (
    <TomarPedido
      categories={(categories ?? []) as MenuCategory[]}
      items={(items ?? []) as MenuItem[]}
      addons={(addons ?? []) as MenuItemAddon[]}
      tables={(tables ?? []) as RestaurantTable[]}
      currency={session!.tenant!.currency}
    />
  );
}
