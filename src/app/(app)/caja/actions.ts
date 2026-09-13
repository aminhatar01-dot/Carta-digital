"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@/types/database";

async function requireCashier() {
  const session = await getSessionContext();
  if (!session || !session.tenant || !["admin", "caja"].includes(session.profile.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function chargeOrder(orderId: string, method: PaymentMethod) {
  const session = await requireCashier();
  const supabase = createClient();
  const tenantId = session.tenant!.id;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .single();

  if (!order) throw new Error("Pedido no encontrado");
  if (order.paid) throw new Error("El pedido ya fue cobrado");

  await supabase.from("order_payments").insert({
    tenant_id: tenantId,
    order_id: order.id,
    amount: order.total,
    method,
    created_by: session.userId,
  });

  await supabase.from("orders").update({ paid: true }).eq("id", order.id);

  if (order.table_id) {
    const { data: pending } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", order.table_id)
      .eq("paid", false)
      .neq("status", "cancelada");

    if (!pending || pending.length === 0) {
      await supabase
        .from("tables")
        .update({ status: "libre", opened_at: null })
        .eq("id", order.table_id)
        .eq("tenant_id", tenantId);
    }
  }

  revalidatePath("/caja");
  revalidatePath("/salon");
}

export async function chargeTable(tableId: string, method: PaymentMethod) {
  const session = await requireCashier();
  const supabase = createClient();
  const tenantId = session.tenant!.id;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total")
    .eq("tenant_id", tenantId)
    .eq("table_id", tableId)
    .eq("paid", false)
    .neq("status", "cancelada");

  if (!orders || orders.length === 0) throw new Error("No hay pedidos pendientes de cobro");

  await supabase.from("order_payments").insert(
    orders.map((o) => ({
      tenant_id: tenantId,
      order_id: o.id,
      amount: o.total,
      method,
      created_by: session.userId,
    }))
  );

  await supabase
    .from("orders")
    .update({ paid: true })
    .in(
      "id",
      orders.map((o) => o.id)
    );

  await supabase
    .from("tables")
    .update({ status: "libre", opened_at: null })
    .eq("id", tableId)
    .eq("tenant_id", tenantId);

  revalidatePath("/caja");
  revalidatePath("/salon");
}

export async function closeCashRegister() {
  const session = await requireCashier();
  const supabase = createClient();
  const tenantId = session.tenant!.id;

  const { data: payments } = await supabase
    .from("order_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("cash_closure_id", null);

  const totalsByMethod: Record<string, number> = {};
  let totalEfectivo = 0;
  let totalOtros = 0;

  for (const p of payments ?? []) {
    totalsByMethod[p.method] = (totalsByMethod[p.method] ?? 0) + p.amount;
    if (p.method === "efectivo") totalEfectivo += p.amount;
    else totalOtros += p.amount;
  }

  const { data: closure, error } = await supabase
    .from("cash_closures")
    .insert({
      tenant_id: tenantId,
      closed_at: new Date().toISOString(),
      total_efectivo: totalEfectivo,
      total_otros: totalOtros,
      totals_by_method: totalsByMethod,
      closed_by: session.userId,
    })
    .select()
    .single();

  if (error || !closure) throw new Error("No se pudo cerrar la caja");

  if (payments && payments.length > 0) {
    await supabase
      .from("order_payments")
      .update({ cash_closure_id: closure.id })
      .in(
        "id",
        payments.map((p) => p.id)
      );
  }

  revalidatePath("/caja");
}
