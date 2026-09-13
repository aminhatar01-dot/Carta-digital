"use server";

import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPreapproval } from "@/lib/mercadopago";

export async function startCheckout() {
  const session = await getSessionContext();
  if (!session || !session.tenant || session.profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", session.tenant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const result = await createPreapproval({
    tenantId: session.tenant.id,
    tenantName: session.tenant.name,
    payerEmail: session.email || "",
    amount: subscription?.amount ?? 50000,
    backUrl: `${appUrl}/configuracion/suscripcion`,
  });

  await supabase
    .from("subscriptions")
    .update({ mp_preapproval_id: result.id })
    .eq("tenant_id", session.tenant.id);

  return result.init_point;
}
