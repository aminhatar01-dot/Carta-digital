"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/database";

async function requireAdminTenant() {
  const session = await getSessionContext();
  if (!session || !session.tenant || session.profile.role !== "admin") {
    throw new Error("No autorizado");
  }
  return session;
}

// ---------- Datos del local ----------
export async function updateTenantSettings(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();

  await supabase
    .from("tenants")
    .update({
      name: String(formData.get("name") || "").trim(),
      address: String(formData.get("address") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      currency: String(formData.get("currency") || "ARS"),
      opening_hours: String(formData.get("opening_hours") || "").trim() || null,
      logo_url: String(formData.get("logo_url") || "").trim() || null,
      cover_url: String(formData.get("cover_url") || "").trim() || null,
      primary_color: String(formData.get("primary_color") || "#EA580C"),
      waiter_call_enabled: formData.get("waiter_call_enabled") === "on",
    })
    .eq("id", session.tenant!.id);

  revalidatePath("/configuracion");
}

// ---------- Zonas ----------
export async function upsertZone(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("El nombre es obligatorio");

  if (id) {
    await supabase.from("zones").update({ name }).eq("id", id).eq("tenant_id", session.tenant!.id);
  } else {
    await supabase.from("zones").insert({ tenant_id: session.tenant!.id, name });
  }
  revalidatePath("/configuracion/mesas");
}

export async function deleteZone(id: string) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase.from("zones").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/configuracion/mesas");
}

// ---------- Mesas ----------
export async function upsertTable(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const number = Number(formData.get("number") || 0);
  const capacity = Number(formData.get("capacity") || 2);
  const zone_id = String(formData.get("zone_id") || "") || null;

  if (!number) throw new Error("El número de mesa es obligatorio");

  if (id) {
    await supabase
      .from("tables")
      .update({ number, capacity, zone_id })
      .eq("id", id)
      .eq("tenant_id", session.tenant!.id);
  } else {
    await supabase.from("tables").insert({
      tenant_id: session.tenant!.id,
      number,
      capacity,
      zone_id,
    });
  }
  revalidatePath("/configuracion/mesas");
  revalidatePath("/salon");
}

export async function deleteTable(id: string) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase.from("tables").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/configuracion/mesas");
  revalidatePath("/salon");
}

// ---------- Usuarios ----------
export async function createUser(formData: FormData) {
  const session = await requireAdminTenant();
  const admin = createAdminClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "mozo") as UserRole;

  if (!email || !password || !full_name) throw new Error("Datos incompletos");
  if (role === "super_admin") throw new Error("Rol no permitido");

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(error?.message || "No se pudo crear el usuario");

  await admin.from("profiles").insert({
    id: created.user.id,
    tenant_id: session.tenant!.id,
    full_name,
    role,
    active: true,
  });

  revalidatePath("/configuracion/usuarios");
}

export async function toggleUserActive(id: string, active: boolean) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ active })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);
  revalidatePath("/configuracion/usuarios");
}

export async function updateUserRole(id: string, role: UserRole) {
  const session = await requireAdminTenant();
  if (role === "super_admin") throw new Error("Rol no permitido");
  const supabase = createClient();
  await supabase.from("profiles").update({ role }).eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/configuracion/usuarios");
}
