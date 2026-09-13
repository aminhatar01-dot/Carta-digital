"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/configuracion", label: "Datos del local" },
  { href: "/configuracion/mesas", label: "Mesas y zonas" },
  { href: "/configuracion/usuarios", label: "Usuarios" },
  { href: "/configuracion/suscripcion", label: "Suscripción" },
];

export default function ConfiguracionTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-neutral-200 mb-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              active
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
