# Comanda

SaaS multi-tenant para la gestión integral de restaurantes, bares, pizzerías,
heladerías y locales gastronómicos: POS, salón, cocina (KDS), caja, reservas,
reportes y una **carta digital con QR por mesa** para que los comensales
pidan desde el celular sin mozo.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend/DB**: Supabase (Postgres + Auth + Realtime + Row Level Security)
- **Pagos de suscripción**: Mercado Pago (preapproval / suscripciones recurrentes)
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)

## Estructura del proyecto

```
src/
  app/
    (app)/                  # Panel privado (requiere login), agrupado por módulo
      pedido/                Tomar pedido
      salon/                 Mapa de mesas
      cocina/                KDS (cocina) en tiempo real
      caja/                  Cobros y cierre de caja
      carta/                 CRUD de categorías/productos/adicionales
      qr/                    Generación y descarga de QR por mesa
      reservas/              Reservas
      reportes/              Reportes de ventas
      configuracion/         Datos del local, mesas/zonas, usuarios, suscripción
      super-admin/           Panel del dueño de la plataforma
    carta/[slug]/mesa/[token] Carta digital pública (sin login) vía QR
    api/mercadopago/webhook  Webhook de suscripciones de Mercado Pago
    login/                  Login
  components/               Componentes de UI por módulo
  lib/                      Helpers (Supabase, Mercado Pago, auth, formato)
  types/                    Tipos TypeScript del modelo de datos
supabase/
  migrations/               Migraciones SQL (esquema, RLS, RPC, realtime)
  seed/                     Seed de datos demo
```

## Cómo correr el proyecto localmente

### 1. Crear el proyecto en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutá en orden los archivos de `supabase/migrations/`
   (del `0001` al `0005`).
3. (Opcional) Ejecutá `supabase/seed/seed.sql` para cargar un restaurante
   demo con mesas, categorías y productos.
4. Creá los usuarios demo en **Authentication > Users > Add user** (uno por
   rol: admin, mozo, cocina, caja) y luego vinculá cada uno a un `profile`
   corriendo el `insert into profiles (...)` que está comentado al final de
   `seed.sql`, reemplazando los UUID por los reales generados. El primer
   usuario **super_admin** se crea de la misma forma pero con `tenant_id`
   en `null`.
5. Copiá `Project URL`, `anon public key` y `service_role key` desde
   **Project Settings > API**.

### 2. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx        # solo server-side, nunca exponer al cliente

MERCADOPAGO_ACCESS_TOKEN=xxxx         # access token de tu cuenta de Mercado Pago
MERCADOPAGO_WEBHOOK_SECRET=xxxx       # opcional, para validar la firma del webhook
NEXT_PUBLIC_MERCADOPAGO_PLAN_AMOUNT=50000

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Instalar dependencias y correr

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:3000`.

- Panel: `http://localhost:3000/login`
- Carta pública demo (después de correr el seed):
  `http://localhost:3000/carta/pizzeria-demo/mesa/<qr_token de la mesa>`
  (el `qr_token` de cada mesa se puede ver en la tabla `tables` de Supabase,
  o generando los QR desde el panel en **QR de mesas**).

### 4. Webhook de Mercado Pago (producción)

Configurá en tu aplicación de Mercado Pago la URL de notificaciones:

```
https://tu-dominio.com/api/mercadopago/webhook
```

Este endpoint procesa eventos `preapproval` (alta/estado de la suscripción)
y `payment` (cada cobro mensual), actualizando `subscriptions` y `payments`.
En desarrollo local podés exponerlo con una herramienta de túnel (ngrok,
Cloudflare Tunnel, etc.) para probarlo end-to-end.

## Roles

| Rol         | Acceso                                                   |
|-------------|-----------------------------------------------------------|
| super_admin | Panel `/super-admin`: todos los restaurantes y su suscripción |
| admin       | Todo el panel de su restaurante                           |
| mozo        | Tomar pedido, Salón, Reservas                             |
| cocina      | Cocina (KDS)                                              |
| caja        | Caja, Reservas                                             |
| comensal    | Sin login: carta digital pública vía QR de mesa            |

## Seguridad

- Row Level Security activado en todas las tablas de negocio, filtrando por
  `tenant_id` del usuario autenticado (con bypass para `super_admin`).
- El acceso público de la carta QR no usa sesión de usuario: se resuelve
  mediante funciones RPC `security definer` (`get_public_menu`,
  `submit_public_order`, `call_waiter`) que validan el `qr_token` de la
  mesa y no exponen el resto de las tablas del tenant.
- Si la suscripción de un restaurante está vencida/suspendida, se bloquea
  el acceso operativo del tenant (excepto para el super-admin).

## Deploy

- **Frontend**: conectá el repo a Vercel y configurá las mismas variables
  de entorno de `.env.example` en el proyecto de Vercel.
- **Backend**: Supabase Cloud (las migraciones de `supabase/migrations/`
  también se pueden aplicar con `supabase db push` si usás la Supabase CLI).
