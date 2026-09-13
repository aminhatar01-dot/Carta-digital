import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import QrManager from "@/components/qr/qr-manager";
import type { RestaurantTable } from "@/types/database";

export default async function QrPage() {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("number");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <QrManager
      tables={(tables ?? []) as RestaurantTable[]}
      slug={session!.tenant!.slug}
      baseUrl={baseUrl}
    />
  );
}
