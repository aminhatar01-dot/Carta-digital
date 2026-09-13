import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment, getPreapproval, mapPreapprovalStatus } from "@/lib/mercadopago";

// Mercado Pago envía notificaciones para "preapproval" (alta/estado de la
// suscripción) y "payment" (cada cobro individual dentro del plan).
export async function POST(request: NextRequest) {
  let body: { type?: string; action?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const type = body.type || (request.nextUrl.searchParams.get("type") ?? "");
  const dataId = body.data?.id || request.nextUrl.searchParams.get("id");

  if (!dataId) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  try {
    if (type === "preapproval" || type === "subscription_preapproval") {
      const preapproval = await getPreapproval(dataId);
      const tenantId = preapproval.external_reference as string;
      if (!tenantId) return NextResponse.json({ ok: true });

      const status = mapPreapprovalStatus(preapproval.status);

      await admin
        .from("subscriptions")
        .update({
          status,
          mp_preapproval_id: preapproval.id,
          current_period_end:
            status === "active"
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId);
    }

    if (type === "payment") {
      const payment = await getPayment(dataId);
      const tenantId = payment.external_reference as string | undefined;
      if (!tenantId) return NextResponse.json({ ok: true });

      const { data: subscription } = await admin
        .from("subscriptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      await admin.from("payments").insert({
        tenant_id: tenantId,
        subscription_id: subscription?.id ?? null,
        amount: payment.transaction_amount,
        status: payment.status,
        mp_payment_id: String(payment.id),
        paid_at: payment.status === "approved" ? new Date().toISOString() : null,
      });

      if (payment.status === "approved") {
        await admin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);
      }
    }
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago", error);
    return NextResponse.json({ error: "processing_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
