import { getSessionContext } from "@/lib/auth/session";
import ConfiguracionTabs from "@/components/configuracion/tabs";
import { updateTenantSettings } from "./actions";

export default async function ConfiguracionPage() {
  const session = await getSessionContext();
  const tenant = session!.tenant!;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Configuración</h1>
      <p className="text-neutral-500 mb-4 text-sm">Datos generales del restaurante.</p>
      <ConfiguracionTabs />

      <form action={updateTenantSettings} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del local</label>
          <input
            name="name"
            defaultValue={tenant.name}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
            <input
              name="address"
              defaultValue={tenant.address ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
            <input
              name="phone"
              defaultValue={tenant.phone ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Moneda</label>
            <input
              name="currency"
              defaultValue={tenant.currency}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Horarios</label>
            <input
              name="opening_hours"
              defaultValue={tenant.opening_hours ?? ""}
              placeholder="Lun a Dom 12 a 00hs"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Logo (URL)</label>
            <input
              name="logo_url"
              defaultValue={tenant.logo_url ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Foto de portada (URL)</label>
            <input
              name="cover_url"
              defaultValue={tenant.cover_url ?? ""}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Color principal</label>
            <input
              name="primary_color"
              type="color"
              defaultValue={tenant.primary_color ?? "#EA580C"}
              className="h-9 w-16 rounded border border-neutral-300"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 mt-5">
            <input
              type="checkbox"
              name="waiter_call_enabled"
              defaultChecked={tenant.waiter_call_enabled}
            />
            Habilitar botón &ldquo;Llamar al mozo&rdquo; en la carta digital
          </label>
        </div>

        <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
