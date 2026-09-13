"use client";

import { useState, useTransition } from "react";
import type { Profile, UserRole } from "@/types/database";
import { createUser, toggleUserActive, updateUserRole } from "@/app/(app)/configuracion/actions";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Administrador",
  mozo: "Mozo",
  cocina: "Cocina",
  caja: "Caja",
};

export default function UsuariosManager({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Usuarios</h2>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 rounded-lg px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {p.full_name} {p.id === currentUserId && <span className="text-xs text-neutral-400">(vos)</span>}
              </span>
              <div className="flex items-center gap-3">
                <select
                  defaultValue={p.role}
                  disabled={p.id === currentUserId}
                  onChange={(e) => updateUserRole(p.id, e.target.value as UserRole)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                >
                  {(["admin", "mozo", "cocina", "caja"] as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  disabled={p.id === currentUserId}
                  onClick={() => toggleUserActive(p.id, !p.active)}
                  className="text-xs text-neutral-500 hover:underline disabled:opacity-40"
                >
                  {p.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Nuevo usuario</h2>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              try {
                await createUser(fd);
                (document.getElementById("new-user-form") as HTMLFormElement)?.reset();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error al crear el usuario");
              }
            });
          }}
          id="new-user-form"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            name="full_name"
            required
            placeholder="Nombre completo"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select name="role" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            {(["mozo", "cocina", "caja", "admin"] as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Contraseña provisoria"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <button
            disabled={pending}
            className="md:col-span-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium py-2"
          >
            {pending ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}
