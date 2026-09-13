"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import type { Period } from "@/app/(app)/reportes/page";

interface OrderItemRow {
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface PaymentRow {
  method: string;
  amount: number;
}

interface OrderRow {
  id: string;
  order_type: string;
  total: number;
  items: OrderItemRow[];
  payments: PaymentRow[];
}

interface MenuItemRef {
  id: string;
  name: string;
  category_id: string | null;
}

interface CategoryRef {
  id: string;
  name: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  dia: "Hoy",
  semana: "Esta semana",
  mes: "Este mes",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  salon: "Salón",
  mostrador: "Mostrador",
  delivery: "Delivery",
  retiro: "Retiro",
};

function sum(orders: OrderRow[]): number {
  return orders.reduce((s, o) => s + o.total, 0);
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = toCsv(rows);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportesDashboard({
  period,
  currentOrders,
  previousOrders,
  menuItems,
  categories,
  currency,
}: {
  period: Period;
  currentOrders: OrderRow[];
  previousOrders: OrderRow[];
  menuItems: MenuItemRef[];
  categories: CategoryRef[];
  currency: string;
}) {
  const router = useRouter();

  const menuItemById = useMemo(() => new Map(menuItems.map((m) => [m.id, m])), [menuItems]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const totalActual = sum(currentOrders);
  const totalAnterior = sum(previousOrders);

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; total: number }>();
    for (const order of currentOrders) {
      for (const item of order.items) {
        const existing = map.get(item.item_name) ?? { name: item.item_name, quantity: 0, total: 0 };
        existing.quantity += item.quantity;
        existing.total += item.unit_price * item.quantity;
        map.set(item.item_name, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [currentOrders]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of currentOrders) {
      for (const item of order.items) {
        const categoryName = item.menu_item_id
          ? categoryById.get(menuItemById.get(item.menu_item_id)?.category_id ?? "") ?? "Sin categoría"
          : "Sin categoría";
        map.set(categoryName, (map.get(categoryName) ?? 0) + item.unit_price * item.quantity);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [currentOrders, categoryById, menuItemById]);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of currentOrders) {
      for (const p of order.payments) {
        map.set(p.method, (map.get(p.method) ?? 0) + p.amount);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [currentOrders]);

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of currentOrders) {
      const existing = map.get(order.order_type) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += order.total;
      map.set(order.order_type, existing);
    }
    return Array.from(map.entries());
  }, [currentOrders]);

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Reporte de ventas", PERIOD_LABELS[period]],
      [],
      ["Total del período", totalActual],
      ["Total período anterior", totalAnterior],
      [],
      ["Producto", "Cantidad", "Total"],
      ...byProduct.map((p) => [p.name, p.quantity, p.total]),
      [],
      ["Categoría", "Total"],
      ...byCategory.map(([name, total]) => [name, total]),
      [],
      ["Medio de pago", "Total"],
      ...byMethod.map(([name, total]) => [name, total]),
      [],
      ["Tipo de pedido", "Pedidos", "Total"],
      ...byType.map(([name, v]) => [ORDER_TYPE_LABEL[name] ?? name, v.count, v.total]),
    ];
    downloadCsv(`reporte-ventas-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-neutral-900">Reportes de ventas</h1>
        <button
          onClick={exportCsv}
          className="bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Exportar CSV
        </button>
      </div>
      <p className="text-neutral-500 mb-4 text-sm">Comparación contra el período anterior.</p>

      <div className="flex gap-2 mb-6">
        {(["dia", "semana", "mes"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => router.push(`/reportes?periodo=${p}`)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              period === p
                ? "bg-orange-600 border-orange-600 text-white"
                : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Ventas ({PERIOD_LABELS[period]})</p>
          <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalActual, currency)}</p>
          <p className="text-xs text-neutral-400">{pctChange(totalActual, totalAnterior)} vs. período anterior</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Pedidos</p>
          <p className="text-lg font-bold text-neutral-900">{currentOrders.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Ticket promedio</p>
          <p className="text-lg font-bold text-neutral-900">
            {formatCurrency(currentOrders.length ? totalActual / currentOrders.length : 0, currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-semibold text-neutral-800 mb-2">Ranking de productos</h2>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {byProduct.slice(0, 10).map((p) => (
                  <tr key={p.name} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-neutral-500">{p.quantity}u</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.total, currency)}</td>
                  </tr>
                ))}
                {byProduct.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-400">Sin ventas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-800 mb-2">Por categoría</h2>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {byCategory.map(([name, total]) => (
                  <tr key={name} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(total, currency)}</td>
                  </tr>
                ))}
                {byCategory.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-400">Sin ventas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-800 mb-2">Por medio de pago</h2>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {byMethod.map(([name, total]) => (
                  <tr key={name} className="border-t border-neutral-100">
                    <td className="px-3 py-2 capitalize">{name}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(total, currency)}</td>
                  </tr>
                ))}
                {byMethod.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-400">Sin cobros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-neutral-800 mb-2">Por tipo de pedido</h2>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {byType.map(([name, v]) => (
                  <tr key={name} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{ORDER_TYPE_LABEL[name] ?? name}</td>
                    <td className="px-3 py-2 text-neutral-500">{v.count} pedidos</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(v.total, currency)}</td>
                  </tr>
                ))}
                {byType.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-400">Sin ventas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
