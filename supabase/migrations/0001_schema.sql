-- =========================================================
-- Comanda: esquema inicial multi-tenant
-- =========================================================
create extension if not exists "pgcrypto";

-- ---------- ENUM TYPES ----------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'mozo', 'cocina', 'caja');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'past_due', 'suspended', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type table_status as enum ('libre', 'ocupada', 'por_cobrar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('salon', 'mostrador', 'delivery', 'retiro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_source as enum ('mozo', 'qr');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pendiente', 'en_preparacion', 'lista', 'entregada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('efectivo', 'tarjeta', 'mercadopago', 'transferencia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('confirmada', 'cancelada', 'no_show', 'completada');
exception when duplicate_object then null; end $$;

-- ---------- TENANTS ----------
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  cover_url text,
  primary_color text default '#EA580C',
  address text,
  phone text,
  currency text default 'ARS',
  timezone text default 'America/Argentina/Buenos_Aires',
  opening_hours text,
  waiter_call_enabled boolean default false,
  created_at timestamptz not null default now()
);

-- ---------- SUBSCRIPTIONS ----------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  status subscription_status not null default 'active',
  mp_preapproval_id text,
  amount numeric(12,2) not null default 50000,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_tenant on subscriptions(tenant_id);

-- ---------- PAYMENTS (suscripción) ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  mp_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_tenant on payments(tenant_id);

-- ---------- PROFILES ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'mozo',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_tenant on profiles(tenant_id);

-- ---------- BRANCHES ----------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null default 'Principal',
  address text,
  created_at timestamptz not null default now()
);
create index if not exists idx_branches_tenant on branches(tenant_id);

-- ---------- ZONES ----------
create table if not exists zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_zones_tenant on zones(tenant_id);

-- ---------- TABLES ----------
create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  zone_id uuid references zones(id) on delete set null,
  number int not null,
  capacity int not null default 2,
  status table_status not null default 'libre',
  qr_token uuid not null default gen_random_uuid() unique,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique(tenant_id, number)
);
create index if not exists idx_tables_tenant on tables(tenant_id);
create index if not exists idx_tables_qr_token on tables(qr_token);

-- ---------- MENU CATEGORIES ----------
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_menu_categories_tenant on menu_categories(tenant_id);

-- ---------- MENU ITEMS ----------
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  image_url text,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_menu_items_tenant on menu_items(tenant_id);
create index if not exists idx_menu_items_category on menu_items(category_id);

-- ---------- MENU ITEM ADDONS ----------
create table if not exists menu_item_addons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_addons_item on menu_item_addons(menu_item_id);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  table_id uuid references tables(id) on delete set null,
  order_type order_type not null default 'salon',
  source order_source not null default 'mozo',
  status order_status not null default 'pendiente',
  customer_name text,
  notes text,
  total numeric(12,2) not null default 0,
  paid boolean not null default false,
  delayed boolean not null default false,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz
);
create index if not exists idx_orders_tenant on orders(tenant_id);
create index if not exists idx_orders_table on orders(table_id);
create index if not exists idx_orders_status on orders(tenant_id, status);
create index if not exists idx_orders_created on orders(tenant_id, created_at);

-- ---------- ORDER ITEMS ----------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  item_name text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_tenant on order_items(tenant_id);

-- ---------- ORDER ITEM ADDONS ----------
create table if not exists order_item_addons (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  addon_name text not null,
  price numeric(12,2) not null default 0
);
create index if not exists idx_order_item_addons_item on order_item_addons(order_item_id);

-- ---------- ORDER PAYMENTS (cobros de pedidos, para Caja) ----------
create table if not exists order_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(12,2) not null,
  method payment_method not null,
  cash_closure_id uuid,
  paid_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null
);
create index if not exists idx_order_payments_tenant on order_payments(tenant_id);
create index if not exists idx_order_payments_order on order_payments(order_id);
create index if not exists idx_order_payments_closure on order_payments(cash_closure_id);

-- ---------- CASH CLOSURES ----------
create table if not exists cash_closures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  total_efectivo numeric(12,2) not null default 0,
  total_otros numeric(12,2) not null default 0,
  totals_by_method jsonb not null default '{}'::jsonb,
  closed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cash_closures_tenant on cash_closures(tenant_id);

alter table order_payments
  add constraint fk_order_payments_closure
  foreign key (cash_closure_id) references cash_closures(id) on delete set null;

-- ---------- RESERVATIONS ----------
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_name text not null,
  phone text,
  reservation_date date not null,
  reservation_time time not null,
  people_count int not null default 2,
  table_id uuid references tables(id) on delete set null,
  status reservation_status not null default 'confirmada',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reservations_tenant on reservations(tenant_id, reservation_date);
