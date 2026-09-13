"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/format";
import { startCheckout } from "@/app/(app)/configuracion/suscripcion/actions";
import type { Payment, Subscription, SubscriptionStatus } from "@/types/database";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Activa",
  past_due: "Vencida",
  suspended: "Suspendida",
  canceled: "Cancelada",
};

export default function SuscripcionPanel({
  subscription,
  payments,
  currency,
}: {
  subscription: Subscription | null;
  payments: Payment[];
  currency: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      try {
        const initPoint = await startCheckout();
        window.location.href = initPoint;
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar el pago");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <p className="text-sm text-neutral-500 mb-1">Estado de la suscripción</p>
        <p className="text-lg font-bold text-neutral-900 mb-1">
          {subscription ? STATUS_LABELS[subscription.status] : "Sin datos"}
        </p>
        {subscription?.current_period_end && (
          <p className="text-sm text-neutral-500 mb-4">
            Próximo vencimiento: {new Date(subscription.current_period_end).toLocaleDateString("es-AR")}
          </p>
        )}
        <p className="text-sm text-neutral-600 mb-4">
          Plan mensual: {formatCurrency(subscription?.amount ?? 50000, currency)} / mes
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={handleCheckout}
          disabled={pending}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium rounded-lg px-5 py-2 text-sm"
        >
          {pending ? "Redirigiendo..." : "Pagar / regularizar con Mercado Pago"}
        </button>
      </div>

      <div>
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
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-AR") : "-"}
                  </td>
                  <td className="px-3 py-2">{formatCurrency(p.amount, currency)}</td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>
                </tr>
              ))}
              {payments.length === 0 && (
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
    </div>
  );
}
