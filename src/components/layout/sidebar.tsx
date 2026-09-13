import Link from "next/link";
import type { UserRole } from "@/types/database";
import { logout } from "@/app/login/actions";

const NAV_ITEMS: { href: string; label: string; roles: UserRole[] }[] = [
  { href: "/pedido", label: "Tomar pedido", roles: ["admin", "mozo"] },
  { href: "/salon", label: "Salón", roles: ["admin", "mozo"] },
  { href: "/cocina", label: "Cocina", roles: ["admin", "cocina"] },
  { href: "/caja", label: "Caja", roles: ["admin", "caja"] },
  { href: "/carta", label: "Carta", roles: ["admin"] },
  { href: "/qr", label: "QR de mesas", roles: ["admin"] },
  { href: "/reservas", label: "Reservas", roles: ["admin", "mozo", "caja"] },
  { href: "/reportes", label: "Reportes", roles: ["admin"] },
  { href: "/configuracion", label: "Configuración", roles: ["admin"] },
  { href: "/super-admin", label: "Restaurantes", roles: ["super_admin"] },
];

export default function Sidebar({
  role,
  tenantName,
  userName,
}: {
  role: UserRole;
  tenantName: string;
  userName: string;
}) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-4 py-5 border-b border-neutral-200">
        <p className="font-bold text-neutral-900 truncate">{tenantName}</p>
        <p className="text-xs text-neutral-500 truncate">{userName}</p>
      </div>
      <nav className="flex-1 py-3 space-y-1 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-700 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="p-3 border-t border-neutral-200">
        <button
          type="submit"
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 transition"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
