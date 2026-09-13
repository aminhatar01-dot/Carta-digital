"use client";

import { useRouter } from "next/navigation";
import type { Reservation, ReservationStatus, RestaurantTable } from "@/types/database";
import { upsertReservation, updateReservationStatus, deleteReservation } from "@/app/(app)/reservas/actions";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  no_show: "No-show",
  completada: "Completada",
};

export default function ReservasManager({
  date,
  reservations,
  tables,
}: {
  date: string;
  reservations: Reservation[];
  tables: RestaurantTable[];
}) {
  const router = useRouter();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Reservas</h1>
      <p className="text-neutral-500 mb-4 text-sm">Reservas del restaurante por día.</p>

      <input
        type="date"
        value={date}
        onChange={(e) => router.push(`/reservas?date=${e.target.value}`)}
        className="mb-6 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-3 py-2">Hora</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Tel.</th>
              <th className="px-3 py-2">Personas</th>
              <th className="px-3 py-2">Mesa</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">{r.reservation_time.slice(0, 5)}</td>
                <td className="px-3 py-2">{r.customer_name}</td>
                <td className="px-3 py-2">{r.phone ?? "-"}</td>
                <td className="px-3 py-2">{r.people_count}</td>
                <td className="px-3 py-2">
                  {tables.find((t) => t.id === r.table_id)?.number ?? "-"}
                </td>
                <td className="px-3 py-2">
                  <select
                    defaultValue={r.status}
                    onChange={(e) => updateReservationStatus(r.id, e.target.value as ReservationStatus)}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs"
                  >
                    {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => deleteReservation(r.id)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-neutral-400">
                  Sin reservas para este día.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Nueva reserva</h2>
        <form action={upsertReservation} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="hidden" name="reservation_date" value={date} />
          <input
            name="customer_name"
            required
            placeholder="Nombre del cliente"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Teléfono"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="reservation_time"
            type="time"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="people_count"
            type="number"
            defaultValue={2}
            min={1}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select name="table_id" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin mesa asignada</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa {t.number}
              </option>
            ))}
          </select>
          <input
            name="notes"
            placeholder="Notas"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button className="md:col-span-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium py-2">
            Crear reserva
          </button>
        </form>
      </div>
    </div>
  );
}
