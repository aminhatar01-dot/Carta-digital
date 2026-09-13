import { createClient } from "@/lib/supabase/server";
import SuperAdminBoard from "@/components/super-admin/super-admin-board";
import type { Subscription, Tenant } from "@/types/database";

export default async function SuperAdminPage() {
  const supabase = createClient();

  const [{ data: tenants }, { data: subscriptions }] = await Promise.all([
    supabase.from("tenants").select("*").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
  ]);

  const latestSubByTenant = new Map<string, Subscription>();
  for (const sub of (subscriptions ?? []) as Subscription[]) {
    if (!latestSubByTenant.has(sub.tenant_id)) latestSubByTenant.set(sub.tenant_id, sub);
  }

  return (
    <SuperAdminBoard
      tenants={(tenants ?? []) as Tenant[]}
      subscriptionByTenant={Object.fromEntries(latestSubByTenant)}
    />
  );
}
