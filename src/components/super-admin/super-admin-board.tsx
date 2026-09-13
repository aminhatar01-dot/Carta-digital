"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Subscription, SubscriptionStatus, Tenant } from "@/types/database";
import { createTenant, updateSubscriptionStatus } from "@/app/(app)/super-admin/actions";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
  canceled: "bg-neutral-200 text-neutral-600",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Activo",
  past_due: "Vencido",
  suspended: "Suspendido",
  canceled: "Cancelado",
};

export default function SuperAdminBoard({
  tenants,
  subscriptionByTenant,
}: {
  tenants: Tenant[];
  subscriptionByTenant: Record<string, Subscription>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Restaurantes</h1>
        <p className="text-neutral-500 mb-4 text-sm">
          Todos los tenants dados de alta en Comanda y el estado de su suscripción.
        </p>

        <div className="space-y-2">
          {tenants.map((t) => {
            const sub = subscriptionByTenant[t.id];
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl p-4"
              >
                <div>
                  <Link href={`/super-admin/${t.id}`} className="font-semibold text-neutral-900 hover:underline">
                    {t.name}
                  </Link>
                  <p className="text-xs text-neutral-500">/{t.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sub && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[sub.status]}`}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  )}
                  <select
                    defaultValue={sub?.status ?? "active"}
                    onChange={(e) => updateSubscriptionStatus(t.id, e.target.value as SubscriptionStatus)}
                    className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs"
                  >
                    {(Object.keys(STATUS_LABELS) as SubscriptionStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          {tenants.length === 0 && <p className="text-sm text-neutral-400">Sin restaurantes todavía.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-3">Alta manual de restaurante</h2>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              try {
                await createTenant(fd);
                (document.getElementById("new-tenant-form") as HTMLFormElement)?.reset();
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo crear el restaurante");
              }
            });
          }}
          id="new-tenant-form"
          className="bg-white border border-neutral-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            name="name"
            required
            placeholder="Nombre del restaurante"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="admin_name"
            required
            placeholder="Nombre del administrador"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="admin_email"
            type="email"
            required
            placeholder="Email del administrador"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="admin_password"
            type="password"
            required
            minLength={6}
            placeholder="Contraseña provisoria"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
          />
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <button
            disabled={pending}
            className="md:col-span-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium py-2"
          >
            {pending ? "Creando..." : "Crear restaurante"}
          </button>
        </form>
      </div>
    </div>
  );
}
