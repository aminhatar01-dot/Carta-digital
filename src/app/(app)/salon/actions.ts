"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function requestTableClose(tableId: string) {
  const session = await getSessionContext();
  if (!session || !session.tenant || !["admin", "mozo"].includes(session.profile.role)) {
    throw new Error("No autorizado");
  }
  const supabase = createClient();
  await supabase
    .from("tables")
    .update({ status: "por_cobrar" })
    .eq("id", tableId)
    .eq("tenant_id", session.tenant.id);

  revalidatePath("/salon");
}
