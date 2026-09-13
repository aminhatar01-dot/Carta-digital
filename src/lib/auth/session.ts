import { createClient } from "@/lib/supabase/server";
import type { Profile, Subscription, Tenant } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
  tenant: Tenant | null;
  subscription: Subscription | null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  let tenant: Tenant | null = null;
  let subscription: Subscription | null = null;

  if (profile.tenant_id) {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();
    tenant = tenantData ?? null;

    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    subscription = subData ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
    tenant,
    subscription,
  };
}

export function isSubscriptionBlocked(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === "suspended" || subscription.status === "canceled";
}
