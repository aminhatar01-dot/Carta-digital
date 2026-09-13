import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { defaultRouteForRole } from "@/lib/auth/roles";

export default async function HomePage() {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  redirect(defaultRouteForRole(session.profile.role));
}
