"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatElapsed } from "@/lib/format";
import { updateOrderStatus, toggleDelayed } from "@/app/(app)/cocina/actions";
import type { OrderStatus } from "@/types/database";

interface KdsOrderItemAddon {
  id: string;
  addon_name: string;
}

interface KdsOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  notes: string | null;
  addons: KdsOrderItemAddon[];
}

interface KdsOrder {
  id: string;
  order_type: string;
  source: string;
  status: OrderStatus;
  notes: string | null;
  paid: boolean;
  delayed: boolean;
  created_at: string;
  table: { number: number } | null;
  items: KdsOrderItem[];
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  salon: "Salón",
  mostrador: "Mostrador",
  delivery: "Delivery",
  retiro: "Retiro",
};

function originLabel(order: KdsOrder): string {
  if (order.table) {
    return order.source === "qr" ? `Mesa ${order.table.number} · QR` : `Mesa ${order.table.number} · Salón`;
  }
  return ORDER_TYPE_LABEL[order.order_type] ?? order.order_type;
}

function printOrder(order: KdsOrder) {
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  const itemsHtml = order.items
    .map(
      (i) =>
        `<div style="margin-bottom:6px"><strong>${i.quantity}x ${i.item_name}</strong>${
          i.addons.length ? `<br/><small>+ ${i.addons.map((a) => a.addon_name).join(", ")}</small>` : ""
        }${i.notes ? `<br/><small>Nota: ${i.notes}</small>` : ""}</div>`
    )
    .join("");
  win.document.write(`
    <html><head><title>Comanda</title></head>
    <body style="font-family: monospace; padding: 16px;">
      <h2>${originLabel(order)}</h2>
      <p>${new Date(order.created_at).toLocaleString("es-AR")}</p>
      <hr/>
      ${itemsHtml}
      ${order.notes ? `<hr/><p><strong>Obs:</strong> ${order.notes}</p>` : ""}
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export default function KdsBoard({
  tenantId,
  initialOrders,
}: {
  tenantId: string;
  initialOrders: KdsOrder[];
}) {
  const router = useRouter();
  const [, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cocina-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `tenant_id=eq.${tenantId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const columns: { status: OrderStatus; label: string }[] = [
    { status: "pendiente", label: "Pendiente" },
    { status: "en_preparacion", label: "En preparación" },
    { status: "lista", label: "Lista" },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Cocina</h1>
      <p className="text-neutral-500 mb-6 text-sm">Comandas en tiempo real.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colOrders = initialOrders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <h2 className="font-semibold text-neutral-700 mb-3">
                {col.label} <span className="text-neutral-400 font-normal">({colOrders.length})</span>
              </h2>
              <div className="space-y-3">
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border-2 bg-white p-4 ${
                      order.delayed ? "border-red-400" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900">{originLabel(order)}</span>
                      <span className="text-xs text-neutral-500">{formatElapsed(order.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {order.paid && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Pagado
                        </span>
                      )}
                      {order.delayed && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Demorado
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium">
                            {item.quantity}x {item.item_name}
                          </span>
                          {item.addons.length > 0 && (
                            <p className="text-xs text-neutral-500 pl-4">
                              + {item.addons.map((a) => a.addon_name).join(", ")}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-neutral-500 pl-4">Nota: {item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-xs text-neutral-500 mb-3">Obs: {order.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {col.status === "pendiente" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "en_preparacion")}
                          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          Empezar
                        </button>
                      )}
                      {col.status === "en_preparacion" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "lista")}
                          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          Listo
                        </button>
                      )}
                      {col.status === "lista" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "entregada")}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          Entregar
                        </button>
                      )}
                      <button
                        onClick={() => toggleDelayed(order.id, !order.delayed)}
                        className="text-xs border border-neutral-300 px-3 py-1.5 rounded-lg"
                      >
                        {order.delayed ? "Quitar demora" : "Marcar demorado"}
                      </button>
                      <button
                        onClick={() => printOrder(order)}
                        className="text-xs border border-neutral-300 px-3 py-1.5 rounded-lg"
                      >
                        Imprimir
                      </button>
                    </div>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <p className="text-sm text-neutral-400">Sin comandas.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
