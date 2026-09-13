-- =========================================================
-- Comanda: seed de datos demo
-- Ejecutar DESPUÉS de crear en Supabase Auth los usuarios demo
-- (ver README para el paso de creación de usuarios).
-- Reemplazar los UUID de auth abajo por los reales generados.
-- =========================================================

-- 1) Tenant demo
insert into tenants (id, name, slug, primary_color, address, phone, currency)
values ('00000000-0000-0000-0000-000000000001', 'Pizzería Demo', 'pizzeria-demo', '#EA580C', 'Av. Siempre Viva 123, CABA', '+54 9 11 0000-0000', 'ARS')
on conflict (id) do nothing;

-- La suscripción y el branch "Principal" se crean automáticamente por trigger.
-- Forzamos current_period_end largo para pruebas:
update subscriptions set current_period_end = now() + interval '365 days', status = 'active'
where tenant_id = '00000000-0000-0000-0000-000000000001';

-- 2) Zonas y mesas
insert into zones (id, tenant_id, name)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Salón principal')
on conflict (id) do nothing;

insert into tables (tenant_id, zone_id, number, capacity)
select '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', n, case when n % 3 = 0 then 6 else 4 end
from generate_series(1, 8) as n
on conflict (tenant_id, number) do nothing;

-- 3) Categorías
insert into menu_categories (id, tenant_id, name, sort_order) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Pizzas', 1),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Empanadas', 2),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Bebidas', 3),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Postres', 4)
on conflict (id) do nothing;

-- 4) Productos
insert into menu_items (id, tenant_id, category_id, name, description, price, sort_order) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Muzzarella', 'Salsa, muzzarella y aceitunas', 8500, 1),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Napolitana', 'Muzzarella, tomate y ajo', 9500, 2),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Fugazzeta', 'Muzzarella y cebolla', 9800, 3),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Carne', 'Docena de empanadas de carne', 6500, 1),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Jamón y queso', 'Docena de empanadas de jamón y queso', 6500, 2),
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'Coca-Cola 500ml', null, 2000, 1),
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'Agua con gas', null, 1800, 2),
  ('00000000-0000-0000-0000-000000000231', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000104', 'Flan casero', 'Con dulce de leche y crema', 3500, 1)
on conflict (id) do nothing;

-- 5) Adicionales
insert into menu_item_addons (tenant_id, menu_item_id, name, price, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'Extra muzzarella', 1500, 1),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'Aceitunas extra', 800, 2),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', 'Extra ajo', 500, 1)
on conflict do nothing;

-- =========================================================
-- 6) Usuarios de ejemplo
-- IMPORTANTE: crear primero estos usuarios en Supabase Auth
-- (Dashboard > Authentication > Users > Add user), luego
-- reemplazar los UUID de ejemplo por los reales y correr:
--
-- insert into profiles (id, tenant_id, full_name, role) values
--   ('<uuid-admin>', '00000000-0000-0000-0000-000000000001', 'Admin Demo', 'admin'),
--   ('<uuid-mozo>', '00000000-0000-0000-0000-000000000001', 'Mozo Demo', 'mozo'),
--   ('<uuid-cocina>', '00000000-0000-0000-0000-000000000001', 'Cocina Demo', 'cocina'),
--   ('<uuid-caja>', '00000000-0000-0000-0000-000000000001', 'Caja Demo', 'caja'),
--   ('<uuid-superadmin>', null, 'Super Admin', 'super_admin');
-- =========================================================
