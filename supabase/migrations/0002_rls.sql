-- =========================================================
-- Comanda: RLS y funciones auxiliares
-- =========================================================

-- ---------- Helper functions ----------
create or replace function auth_tenant_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select tenant_id from profiles where id = auth.uid();
$$;

create or replace function auth_role()
returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_super_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from profiles where id = auth.uid()), false);
$$;

-- ---------- Enable RLS ----------
alter table tenants enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table profiles enable row level security;
alter table branches enable row level security;
alter table zones enable row level security;
alter table tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_item_addons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_addons enable row level security;
alter table order_payments enable row level security;
alter table cash_closures enable row level security;
alter table reservations enable row level security;

-- ---------- TENANTS ----------
create policy tenants_select on tenants for select
  using (is_super_admin() or id = auth_tenant_id());
create policy tenants_update on tenants for update
  using (is_super_admin() or (id = auth_tenant_id() and auth_role() = 'admin'));
create policy tenants_insert_super on tenants for insert
  with check (is_super_admin());
create policy tenants_delete_super on tenants for delete
  using (is_super_admin());

-- ---------- SUBSCRIPTIONS ----------
create policy subscriptions_select on subscriptions for select
  using (is_super_admin() or tenant_id = auth_tenant_id());
create policy subscriptions_write_super on subscriptions for all
  using (is_super_admin()) with check (is_super_admin());

-- ---------- PAYMENTS ----------
create policy payments_select on payments for select
  using (is_super_admin() or tenant_id = auth_tenant_id());
create policy payments_write_super on payments for all
  using (is_super_admin()) with check (is_super_admin());

-- ---------- PROFILES ----------
create policy profiles_select on profiles for select
  using (is_super_admin() or tenant_id = auth_tenant_id() or id = auth.uid());
create policy profiles_insert on profiles for insert
  with check (is_super_admin() or (tenant_id = auth_tenant_id() and auth_role() = 'admin'));
create policy profiles_update on profiles for update
  using (is_super_admin() or (tenant_id = auth_tenant_id() and auth_role() = 'admin') or id = auth.uid());
create policy profiles_delete on profiles for delete
  using (is_super_admin() or (tenant_id = auth_tenant_id() and auth_role() = 'admin'));

-- ---------- Generic tenant-scoped policy generator (branches, zones, tables, menu, orders, etc.) ----------
create policy branches_all on branches for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy zones_all on zones for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy tables_all on tables for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy menu_categories_all on menu_categories for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy menu_items_all on menu_items for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy menu_item_addons_all on menu_item_addons for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy orders_all on orders for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy order_items_all on order_items for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy order_item_addons_all on order_item_addons for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy order_payments_all on order_payments for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy cash_closures_all on cash_closures for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());

create policy reservations_all on reservations for all
  using (is_super_admin() or tenant_id = auth_tenant_id())
  with check (is_super_admin() or tenant_id = auth_tenant_id());
