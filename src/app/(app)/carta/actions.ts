"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

async function requireAdminTenant() {
  const session = await getSessionContext();
  if (!session || !session.tenant || session.profile.role !== "admin") {
    throw new Error("No autorizado");
  }
  return session;
}

// ---------- Categorías ----------
export async function upsertCategory(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const sort_order = Number(formData.get("sort_order") || 0);
  if (!name) throw new Error("El nombre es obligatorio");

  if (id) {
    await supabase
      .from("menu_categories")
      .update({ name, sort_order })
      .eq("id", id)
      .eq("tenant_id", session.tenant!.id);
  } else {
    await supabase
      .from("menu_categories")
      .insert({ tenant_id: session.tenant!.id, name, sort_order });
  }
  revalidatePath("/carta");
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase
    .from("menu_categories")
    .update({ active })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);
  revalidatePath("/carta");
}

export async function deleteCategory(id: string) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase.from("menu_categories").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/carta");
}

// ---------- Productos ----------
export async function upsertMenuItem(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const category_id = String(formData.get("category_id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  const image_url = String(formData.get("image_url") || "").trim() || null;
  const sort_order = Number(formData.get("sort_order") || 0);

  if (!name) throw new Error("El nombre es obligatorio");

  if (id) {
    await supabase
      .from("menu_items")
      .update({ category_id, name, description, price, image_url, sort_order })
      .eq("id", id)
      .eq("tenant_id", session.tenant!.id);
  } else {
    await supabase.from("menu_items").insert({
      tenant_id: session.tenant!.id,
      category_id,
      name,
      description,
      price,
      image_url,
      sort_order,
    });
  }
  revalidatePath("/carta");
}

export async function toggleMenuItemAvailability(id: string, available: boolean) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);
  revalidatePath("/carta");
}

export async function deleteMenuItem(id: string) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase.from("menu_items").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/carta");
}

// ---------- Adicionales ----------
export async function upsertAddon(formData: FormData) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const menu_item_id = String(formData.get("menu_item_id") || "");
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);

  if (!name || !menu_item_id) throw new Error("Datos incompletos");

  if (id) {
    await supabase
      .from("menu_item_addons")
      .update({ name, price })
      .eq("id", id)
      .eq("tenant_id", session.tenant!.id);
  } else {
    await supabase.from("menu_item_addons").insert({
      tenant_id: session.tenant!.id,
      menu_item_id,
      name,
      price,
    });
  }
  revalidatePath("/carta");
}

export async function deleteAddon(id: string) {
  const session = await requireAdminTenant();
  const supabase = createClient();
  await supabase.from("menu_item_addons").delete().eq("id", id).eq("tenant_id", session.tenant!.id);
  revalidatePath("/carta");
}
