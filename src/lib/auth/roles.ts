import type { UserRole } from "@/types/database";

// Rutas del panel y qué roles pueden acceder a cada una.
// El super_admin solo tiene acceso a /super-admin (y ve todo, sin operar el tenant).
export const ROUTE_ACCESS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/pedido", roles: ["admin", "mozo"] },
  { prefix: "/salon", roles: ["admin", "mozo"] },
  { prefix: "/cocina", roles: ["admin", "cocina"] },
  { prefix: "/caja", roles: ["admin", "caja"] },
  { prefix: "/carta", roles: ["admin"] },
  { prefix: "/reservas", roles: ["admin", "mozo", "caja"] },
  { prefix: "/reportes", roles: ["admin"] },
  { prefix: "/configuracion", roles: ["admin"] },
  { prefix: "/qr", roles: ["admin"] },
  { prefix: "/super-admin", roles: ["super_admin"] },
];

export function defaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "admin":
      return "/salon";
    case "mozo":
      return "/pedido";
    case "cocina":
      return "/cocina";
    case "caja":
      return "/caja";
    default:
      return "/login";
  }
}

export function canAccess(pathname: string, role: UserRole): boolean {
  const rule = ROUTE_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return true;
  return rule.roles.includes(role);
}
