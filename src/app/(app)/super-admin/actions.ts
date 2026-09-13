"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@/types/database";

async function requireSuperAdmin() {
  const session = await getSessionContext();
  if (!session || session.profile.role !== "super_admin") {
    throw new Error("No autorizado");
  }
  return session;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTenant(formData: FormData) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const name = String(formData.get("name") || "").trim();
  const adminEmail = String(formData.get("admin_email") || "").trim();
  const adminPassword = String(formData.get("admin_password") || "");
  const adminName = String(formData.get("admin_name") || "").trim();

  if (!name || !adminEmail || !adminPassword || !adminName) {
    throw new Error("Datos incompletos");
  }

  let slug = slugify(name);
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", slug);
  if (existing && existing.length > 0) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ name, slug })
    .select()
    .single();

  if (tenantError || !tenant) throw new Error("No se pudo crear el restaurante");

  const { data: userResult, error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (userError || !userResult.user) {
    throw new Error(userError?.message || "No se pudo crear el usuario admin");
  }

  await admin.from("profiles").insert({
    id: userResult.user.id,
    tenant_id: tenant.id,
    full_name: adminName,
    role: "admin",
    active: true,
  });

  revalidatePath("/super-admin");
}

export async function updateSubscriptionStatus(tenantId: string, status: SubscriptionStatus) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  await admin
    .from("subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);

  revalidatePath("/super-admin");
}
