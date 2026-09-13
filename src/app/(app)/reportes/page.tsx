import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import ReportesDashboard from "@/components/reportes/reportes-dashboard";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";

export type Period = "dia" | "semana" | "mes";

function getRange(period: Period): { current: [Date, Date]; previous: [Date, Date] } {
  const now = new Date();
  if (period === "dia") {
    return {
      current: [startOfDay(now), endOfDay(now)],
      previous: [startOfDay(subDays(now, 1)), endOfDay(subDays(now, 1))],
    };
  }
  if (period === "semana") {
    return {
      current: [startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })],
      previous: [
        startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      ],
    };
  }
  return {
    current: [startOfMonth(now), endOfMonth(now)],
    previous: [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))],
  };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const session = await getSessionContext();
  const tenantId = session!.tenant!.id;
  const supabase = createClient();
  const period = (searchParams.periodo as Period) || "dia";
  const { current, previous } = getRange(period);

  async function fetchOrdersInRange(range: [Date, Date]) {
    const { data } = await supabase
      .from("orders")
      .select(`*, items:order_items(*), payments:order_payments(*)`)
      .eq("tenant_id", tenantId)
      .eq("paid", true)
      .gte("created_at", range[0].toISOString())
      .lte("created_at", range[1].toISOString());
    return data ?? [];
  }

  const [currentOrders, previousOrders, { data: menuItems }] = await Promise.all([
    fetchOrdersInRange(current),
    fetchOrdersInRange(previous),
    supabase.from("menu_items").select("id, name, category_id").eq("tenant_id", tenantId),
  ]);

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("tenant_id", tenantId);

  return (
    <ReportesDashboard
      period={period}
      currentOrders={currentOrders}
      previousOrders={previousOrders}
      menuItems={menuItems ?? []}
      categories={categories ?? []}
      currency={session!.tenant!.currency}
    />
  );
}
