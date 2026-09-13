"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ReservationStatus } from "@/types/database";

async function requireOperator() {
  const session = await getSessionContext();
  if (!session || !session.tenant || !["admin", "mozo", "caja"].includes(session.profile.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function upsertReservation(formData: FormData) {
  const session = await requireOperator();
  const supabase = createClient();
  const id = String(formData.get("id") || "");

  const payload = {
    tenant_id: session.tenant!.id,
    customer_name: String(formData.get("customer_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    reservation_date: String(formData.get("reservation_date") || ""),
    reservation_time: String(formData.get("reservation_time") || ""),
    people_count: Number(formData.get("people_count") || 2),
    table_id: String(formData.get("table_id") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!payload.customer_name || !payload.reservation_date || !payload.reservation_time) {
    throw new Error("Faltan datos obligatorios");
  }

  if (id) {
    await supabase.from("reservations").update(payload).eq("id", id).eq("tenant_id", session.tenant!.id);
  } else {
    await supabase.from("reservations").insert(payload);
  }

  revalidatePath("/reservas");
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const session = await requireOperator();
  const supabase = createClient();
  await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);
  revalidatePath("/reservas");
}

export async function deleteReservation(id: string) {
  const session = await requireOperator();
  const supabase = createClient();
  await supabase.from("reservations").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/reservas");
}
