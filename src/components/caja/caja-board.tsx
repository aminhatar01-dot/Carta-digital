"use client";

import { useMemo, useState, useTransition } from "react";
import { formatCurrency } from "@/lib/format";
import { chargeOrder, chargeTable, closeCashRegister } from "@/app/(app)/caja/actions";
import type { CashClosure, OrderPayment, PaymentMethod } from "@/types/database";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  salon: "Salón",
  mostrador: "Mostrador",
  delivery: "Delivery",
  retiro: "Retiro",
};

interface PendingOrder {
  id: string;
  order_type: string;
  status: string;
  total: number;
  table_id: string | null;
  table: { number: number } | null;
  customer_name: string | null;
}

export default function CajaBoard({
  pendingOrders,
  openPayments,
  closures,
  currency,
}: {
  pendingOrders: PendingOrder[];
  openPayments: OrderPayment[];
  closures: CashClosure[];
  currency: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [methodByKey, setMethodByKey] = useState<Record<string, PaymentMethod>>({});

  const tableGroups = useMemo(() => {
    const map = new Map<string, { number: number; total: number; orderIds: string[] }>();
    for (const o of pendingOrders) {
      if (!o.table_id) continue;
      const existing = map.get(o.table_id) ?? {
        number: o.table?.number ?? 0,
        total: 0,
        orderIds: [],
      };
      existing.total += o.total;
      existing.orderIds.push(o.id);
      map.set(o.table_id, existing);
    }
    return Array.from(map.entries()).map(([tableId, v]) => ({ tableId, ...v }));
  }, [pendingOrders]);

  const standaloneOrders = pendingOrders.filter((o) => !o.table_id);

  const totalCobradoHoy = openPayments.reduce((s, p) => s + p.amount, 0);
  const cantidadPedidos = new Set(openPayments.map((p) => p.order_id)).size;
  const totalEfectivo = openPayments
    .filter((p) => p.method === "efectivo")
    .reduce((s, p) => s + p.amount, 0);
  const totalOtros = totalCobradoHoy - totalEfectivo;
  const entregadoSinCobrar = pendingOrders
    .filter((o) => o.status === "entregada")
    .reduce((s, o) => s + o.total, 0);

  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod, { count: number; total: number }>();
    for (const p of openPayments) {
      const existing = map.get(p.method) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += p.amount;
      map.set(p.method, existing);
    }
    return Array.from(map.entries());
  }, [openPayments]);

  function charge(key: string, action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cobrar");
      }
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Caja</h1>
        <p className="text-neutral-500 text-sm mb-4">Cobro de mesas, mostrador y delivery.</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-3">
          {tableGroups.map((g) => (
            <div
              key={g.tableId}
              className="flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-neutral-900">Mesa {g.number}</p>
                <p className="text-sm text-neutral-500">{formatCurrency(g.total, currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={methodByKey[g.tableId] ?? "efectivo"}
                  onChange={(e) =>
                    setMethodByKey((prev) => ({ ...prev, [g.tableId]: e.target.value as PaymentMethod }))
                  }
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                >
                  {Object.entries(METHOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  disabled={pending}
                  onClick={() =>
                    charge(g.tableId, () =>
                      chargeTable(g.tableId, methodByKey[g.tableId] ?? "efectivo")
                    )
                  }
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                >
                  Cobrar
                </button>
              </div>
            </div>
          ))}

          {standaloneOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-neutral-900">
                  {ORDER_TYPE_LABEL[o.order_type] ?? o.order_type}
                  {o.customer_name ? ` · ${o.customer_name}` : ""}
                </p>
                <p className="text-sm text-neutral-500">{formatCurrency(o.total, currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={methodByKey[o.id] ?? "efectivo"}
                  onChange={(e) =>
                    setMethodByKey((prev) => ({ ...prev, [o.id]: e.target.value as PaymentMethod }))
                  }
                  className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                >
                  {Object.entries(METHOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  disabled={pending}
                  onClick={() => charge(o.id, () => chargeOrder(o.id, methodByKey[o.id] ?? "efectivo"))}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                >
                  Cobrar
                </button>
              </div>
            </div>
          ))}

          {tableGroups.length === 0 && standaloneOrders.length === 0 && (
            <p className="text-sm text-neutral-400">No hay pedidos pendientes de cobro.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-3">Caja del día</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500">Total cobrado</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalCobradoHoy, currency)}</p>
            <p className="text-xs text-neutral-400">{cantidadPedidos} pedidos</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500">En efectivo</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalEfectivo, currency)}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500">Otros medios</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalOtros, currency)}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500">Entregado sin cobrar</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(entregadoSinCobrar, currency)}</p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-left">
              <tr>
                <th className="px-4 py-2">Medio de pago</th>
                <th className="px-4 py-2">Pedidos</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {byMethod.map(([method, v]) => (
                <tr key={method} className="border-t border-neutral-100">
                  <td className="px-4 py-2">{METHOD_LABELS[method]}</td>
                  <td className="px-4 py-2">{v.count}</td>
                  <td className="px-4 py-2">{formatCurrency(v.total, currency)}</td>
                </tr>
              ))}
              {byMethod.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-neutral-400">
                    Sin cobros todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          disabled={pending}
          onClick={() => charge("close", closeCashRegister)}
          className="bg-neutral-900 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          Cerrar caja
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-3">Historial de cierres</h2>
        <div className="space-y-2">
          {closures.map((c) => (
            <div key={c.id} className="bg-white border border-neutral-200 rounded-xl p-4 text-sm">
              <p className="font-medium text-neutral-900">
                {c.closed_at ? new Date(c.closed_at).toLocaleString("es-AR") : "-"}
              </p>
              <p className="text-neutral-500">
                Efectivo: {formatCurrency(c.total_efectivo, currency)} · Otros:{" "}
                {formatCurrency(c.total_otros, currency)} · Total:{" "}
                {formatCurrency(c.total_efectivo + c.total_otros, currency)}
              </p>
            </div>
          ))}
          {closures.length === 0 && <p className="text-sm text-neutral-400">Sin cierres todavía.</p>}
        </div>
      </div>
    </div>
  );
}
