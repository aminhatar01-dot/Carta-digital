import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionContext, isSubscriptionBlocked } from "@/lib/auth/session";
import { canAccess, defaultRouteForRole } from "@/lib/auth/roles";
import Sidebar from "@/components/layout/sidebar";
import SuscripcionVencida from "@/components/layout/suscripcion-vencida";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  const pathname = headers().get("x-invoke-path") ?? headers().get("x-pathname") ?? "";

  const { profile, tenant, subscription } = session;

  if (profile.role !== "super_admin" && isSubscriptionBlocked(subscription)) {
    return (
      <SuscripcionVencida
        tenantName={tenant?.name ?? ""}
        status={subscription?.status ?? "suspended"}
        isAdmin={profile.role === "admin"}
      />
    );
  }

  if (pathname && !canAccess(pathname, profile.role)) {
    redirect(defaultRouteForRole(profile.role));
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar role={profile.role} tenantName={tenant?.name ?? "Super Admin"} userName={profile.full_name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
