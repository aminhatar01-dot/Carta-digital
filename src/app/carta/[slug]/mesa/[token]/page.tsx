import { createClient } from "@/lib/supabase/server";
import type { PublicMenuResponse } from "@/types/public-menu";
import CartaPublica from "@/components/carta-publica/carta-publica";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CartaPublicaPage({
  params,
}: {
  params: { slug: string; token: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_menu", { p_qr_token: params.token });

  if (error || !data) {
    notFound();
  }

  const menu = data as PublicMenuResponse;

  return <CartaPublica menu={menu} />;
}
