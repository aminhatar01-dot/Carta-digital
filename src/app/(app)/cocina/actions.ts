"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/types/database";

async function requireKitchen() {
  const session = await getSessionContext();
  if (!session || !session.tenant || !["admin", "cocina"].includes(session.profile.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

const TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  en_preparacion: "started_at",
  lista: "ready_at",
  entregada: "delivered_at",
};

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireKitchen();
  const supabase = createClient();

  const patch: Record<string, unknown> = { status };
  const field = TIMESTAMP_FIELD[status];
  if (field) patch[field] = new Date().toISOString();

  await supabase.from("orders").update(patch).eq("id", orderId).eq("tenant_id", session.tenant!.id);

  if (status === "entregada") {
    const { data: order } = await supabase
      .from("orders")
      .select("table_id")
      .eq("id", orderId)
      .single();
    if (order?.table_id) {
      revalidatePath("/salon");
    }
  }

  revalidatePath("/cocina");
}

export async function toggleDelayed(orderId: string, delayed: boolean) {
  const session = await requireKitchen();
  const supabase = createClient();
  await supabase
    .from("orders")
    .update({ delayed })
    .eq("id", orderId)
    .eq("tenant_id", session.tenant!.id);
  revalidatePath("/cocina");
}
