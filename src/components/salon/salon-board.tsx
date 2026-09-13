"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Order, RestaurantTable, Zone } from "@/types/database";
import { formatCurrency, formatElapsed } from "@/lib/format";
import { requestTableClose } from "@/app/(app)/salon/actions";

const STATUS_STYLES: Record<string, string> = {
  libre: "bg-white border-neutral-200",
  ocupada: "bg-amber-50 border-amber-300",
  por_cobrar: "bg-red-50 border-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  por_cobrar: "Por cobrar",
};

export default function SalonBoard({
  tenantId,
  tables,
  zones,
  orders,
  currency,
}: {
  tenantId: string;
  tables: RestaurantTable[];
  zones: Zone[];
  orders: Order[];
  currency: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`salon-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables", filter: `tenant_id=eq.${tenantId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  const consumptionByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      if (!order.table_id || order.paid) continue;
      map.set(order.table_id, (map.get(order.table_id) ?? 0) + order.total);
    }
    return map;
  }, [orders]);

  const zonesById = useMemo(() => new Map(zones.map((z) => [z.id, z.name])), [zones]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Salón</h1>
      <p className="text-neutral-500 mb-6 text-sm">Mapa de mesas en tiempo real.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => {
          const consumo = consumptionByTable.get(table.id) ?? 0;
          return (
            <div
              key={table.id}
              className={`rounded-xl border-2 p-4 ${STATUS_STYLES[table.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-neutral-900">Mesa {table.number}</span>
                <span className="text-xs font-medium text-neutral-500">
                  {STATUS_LABELS[table.status]}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-1">
                {table.capacity} personas
                {table.zone_id && ` · ${zonesById.get(table.zone_id) ?? ""}`}
              </p>
              {table.status !== "libre" && (
                <>
                  <p className="text-sm font-semibold text-neutral-800 mt-2">
                    {formatCurrency(consumo, currency)}
                  </p>
                  {table.opened_at && (
                    <p className="text-xs text-neutral-500">
                      Abierta hace {formatElapsed(table.opened_at)}
                    </p>
                  )}
                </>
              )}

              {table.status === "ocupada" && (
                <button
                  onClick={() => requestTableClose(table.id)}
                  className="mt-3 w-full bg-neutral-900 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg py-2"
                >
                  Cerrar y cobrar
                </button>
              )}
              {table.status === "por_cobrar" && (
                <Link
                  href={`/caja?table=${table.id}`}
                  className="mt-3 block text-center w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg py-2"
                >
                  Ir a cobrar
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
