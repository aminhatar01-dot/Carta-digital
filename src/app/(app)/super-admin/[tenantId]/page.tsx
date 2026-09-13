import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { notFound } from "next/navigation";

export default async function TenantDetailPage({ params }: { params: { tenantId: string } }) {
  const supabase = createClient();

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", params.tenantId).single();
  if (!tenant) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("tenant_id", params.tenantId)
    .order("created_at", { ascending: false });

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", params.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/super-admin" className="text-sm text-orange-600 hover:underline">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-1">{tenant.name}</h1>
      <p className="text-neutral-500 mb-6 text-sm">/{tenant.slug}</p>

      <h2 className="font-semibold text-neutral-800 mb-2">Suscripciones</h2>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Vence</th>
              <th className="px-3 py-2">Creada</th>
            </tr>
          </thead>
          <tbody>
            {(subscriptions ?? []).map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 capitalize">{s.status}</td>
                <td className="px-3 py-2">{formatCurrency(s.amount, tenant.currency)}</td>
                <td className="px-3 py-2">
                  {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("es-AR") : "-"}
                </td>
                <td className="px-3 py-2">{new Date(s.created_at).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-semibold text-neutral-800 mb-2">Historial de pagos</h2>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p) => (
              <tr key={p.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-AR") : "-"}
                </td>
                <td className="px-3 py-2">{formatCurrency(p.amount, tenant.currency)}</td>
                <td className="px-3 py-2 capitalize">{p.status}</td>
              </tr>
            ))}
            {(!payments || payments.length === 0) && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-neutral-400">
                  Sin pagos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
