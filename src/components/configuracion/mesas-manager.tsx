"use client";

import type { RestaurantTable, Zone } from "@/types/database";
import { upsertZone, deleteZone, upsertTable, deleteTable } from "@/app/(app)/configuracion/actions";

export default function MesasManager({
  zones,
  tables,
}: {
  zones: Zone[];
  tables: RestaurantTable[];
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Zonas</h2>
        <div className="space-y-2 mb-3">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between text-sm">
              <span>{z.name}</span>
              <button onClick={() => deleteZone(z.id)} className="text-red-500 text-xs hover:underline">
                Eliminar
              </button>
            </div>
          ))}
          {zones.length === 0 && <p className="text-sm text-neutral-400">Sin zonas aún.</p>}
        </div>
        <form action={upsertZone} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="Ej: Terraza"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button className="bg-neutral-800 text-white px-4 rounded-lg text-sm">Agregar</button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Mesas</h2>
        <div className="space-y-2 mb-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-sm border border-neutral-100 rounded-lg px-3 py-2"
            >
              <span>
                Mesa {t.number} · {t.capacity} personas ·{" "}
                {zones.find((z) => z.id === t.zone_id)?.name ?? "Sin zona"} · estado: {t.status}
              </span>
              <button onClick={() => deleteTable(t.id)} className="text-red-500 text-xs hover:underline">
                Eliminar
              </button>
            </div>
          ))}
          {tables.length === 0 && <p className="text-sm text-neutral-400">Sin mesas aún.</p>}
        </div>
        <form action={upsertTable} className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            name="number"
            type="number"
            required
            placeholder="N° mesa"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="capacity"
            type="number"
            defaultValue={4}
            placeholder="Capacidad"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select name="zone_id" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin zona</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <button className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">
            Agregar mesa
          </button>
        </form>
      </div>
    </div>
  );
}
