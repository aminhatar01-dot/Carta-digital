import { logout } from "@/app/login/actions";

export default function SuscripcionVencida({
  tenantName,
  status,
  isAdmin,
}: {
  tenantName: string;
  status: string;
  isAdmin: boolean;
}) {
  const label =
    status === "suspended" ? "suspendida" : status === "canceled" ? "cancelada" : "vencida";

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          !
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Suscripción {label}</h1>
        <p className="text-sm text-neutral-600 mb-6">
          La suscripción de <strong>{tenantName}</strong> a Comanda está {label}. El acceso
          operativo está bloqueado hasta regularizar el pago.
        </p>

        {isAdmin ? (
          <a
            href="/configuracion/suscripcion"
            className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg py-2 text-sm transition mb-3"
          >
            Regularizar el pago
          </a>
        ) : (
          <p className="text-sm text-neutral-500 mb-3">
            Pedile al administrador del restaurante que regularice el pago.
          </p>
        )}

        <form action={logout}>
          <button type="submit" className="text-sm text-neutral-500 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
