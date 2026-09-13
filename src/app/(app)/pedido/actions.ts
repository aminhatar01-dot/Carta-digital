"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { OrderType } from "@/types/database";

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  notes: string;
  addons: CartAddon[];
}

export interface CreateOrderInput {
  order_type: OrderType;
  table_id: string | null;
  customer_name: string | null;
  notes: string | null;
  items: CartItem[];
}

async function requireOperator() {
  const session = await getSessionContext();
  if (!session || !session.tenant || !["admin", "mozo"].includes(session.profile.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function createOrder(input: CreateOrderInput) {
  const session = await requireOperator();
  const supabase = createClient();
  const tenantId = session.tenant!.id;

  if (input.items.length === 0) throw new Error("El pedido no tiene productos");
  if (input.order_type === "salon" && !input.table_id) throw new Error("Elegí una mesa");

  const total = input.items.reduce((sum, item) => {
    const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
    return sum + (item.unit_price + addonsTotal) * item.quantity;
  }, 0);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantId,
      table_id: input.table_id,
      order_type: input.order_type,
      source: "mozo",
      status: "pendiente",
      customer_name: input.customer_name,
      notes: input.notes,
      total,
    })
    .select()
    .single();

  if (error || !order) throw new Error("No se pudo crear el pedido");

  for (const item of input.items) {
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        tenant_id: tenantId,
        menu_item_id: item.menu_item_id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes || null,
      })
      .select()
      .single();

    if (itemError || !orderItem) continue;

    if (item.addons.length > 0) {
      await supabase.from("order_item_addons").insert(
        item.addons.map((a) => ({
          order_item_id: orderItem.id,
          tenant_id: tenantId,
          addon_name: a.name,
          price: a.price,
        }))
      );
    }
  }

  if (input.table_id) {
    const { data: table } = await supabase
      .from("tables")
      .select("opened_at")
      .eq("id", input.table_id)
      .single();

    await supabase
      .from("tables")
      .update({ status: "ocupada", opened_at: table?.opened_at ?? new Date().toISOString() })
      .eq("id", input.table_id)
      .eq("tenant_id", tenantId);
  }

  revalidatePath("/salon");
  revalidatePath("/cocina");

  return order.id as string;
}
