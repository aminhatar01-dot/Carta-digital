import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import CartaManager from "@/components/carta/carta-manager";
import type { MenuCategory, MenuItem, MenuItemAddon } from "@/types/database";

export default async function CartaPage() {
  const session = await getSessionContext();
  const supabase = createClient();
  const tenantId = session!.tenant!.id;

  const [{ data: categories }, { data: items }, { data: addons }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sort_order"),
    supabase.from("menu_items").select("*").eq("tenant_id", tenantId).order("sort_order"),
    supabase.from("menu_item_addons").select("*").eq("tenant_id", tenantId).order("sort_order"),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Carta</h1>
      <p className="text-neutral-500 mb-6 text-sm">
        Administrá categorías, productos y adicionales. Esta carta alimenta &ldquo;Tomar
        pedido&rdquo; y la carta digital pública por QR.
      </p>
      <CartaManager
        categories={(categories ?? []) as MenuCategory[]}
        items={(items ?? []) as MenuItem[]}
        addons={(addons ?? []) as MenuItemAddon[]}
      />
    </div>
  );
}
