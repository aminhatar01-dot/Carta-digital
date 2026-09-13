-- =========================================================
-- Comanda: triggers auxiliares
-- =========================================================

-- Al crear un tenant, crear automáticamente su branch principal y su suscripción inicial
create or replace function handle_new_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into branches (tenant_id, name) values (new.id, 'Principal');
  insert into subscriptions (tenant_id, status, amount, current_period_end)
  values (new.id, 'active', 50000, now() + interval '30 days');
  return new;
end;
$$;

drop trigger if exists trg_new_tenant on tenants;
create trigger trg_new_tenant
  after insert on tenants
  for each row execute function handle_new_tenant();

-- Función para que el super-admin cree un nuevo restaurante + su usuario admin
-- (el usuario en auth.users se crea desde el backend con la service_role key;
-- esta función solo vincula el profile una vez creado el usuario)
create or replace function create_tenant_admin_profile(
  p_user_id uuid,
  p_tenant_id uuid,
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'No autorizado';
  end if;
  insert into profiles (id, tenant_id, full_name, role, active)
  values (p_user_id, p_tenant_id, p_full_name, 'admin', true)
  on conflict (id) do update set tenant_id = excluded.tenant_id, role = 'admin';
end;
$$;

grant execute on function create_tenant_admin_profile(uuid, uuid, text) to authenticated;
