-- =========================================================
-- Comanda: RPC públicas para carta digital vía QR
-- Estas funciones son SECURITY DEFINER: se ejecutan con
-- privilegios elevados pero validan explícitamente el
-- qr_token de la mesa, sin exponer el resto de las tablas.
-- El rol "anon" solo puede ejecutar estas funciones.
-- =========================================================

-- ---------- Leer la carta pública de una mesa ----------
create or replace function get_public_menu(p_qr_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table tables%rowtype;
  v_tenant tenants%rowtype;
  v_result jsonb;
begin
  select * into v_table from tables where qr_token = p_qr_token;
  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  select * into v_tenant from tenants where id = v_table.tenant_id;

  -- bloquear acceso si la suscripción del tenant no está activa
  if exists (
    select 1 from subscriptions
    where tenant_id = v_tenant.id
      and status in ('suspended', 'canceled')
  ) then
    raise exception 'Restaurante no disponible';
  end if;

  select jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'name', v_tenant.name,
      'slug', v_tenant.slug,
      'logo_url', v_tenant.logo_url,
      'cover_url', v_tenant.cover_url,
      'primary_color', v_tenant.primary_color,
      'currency', v_tenant.currency,
      'waiter_call_enabled', v_tenant.waiter_call_enabled
    ),
    'table', jsonb_build_object(
      'id', v_table.id,
      'number', v_table.number,
      'qr_token', v_table.qr_token
    ),
    'categories', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'sort_order', c.sort_order,
          'items', (
            select coalesce(jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'description', i.description,
                'price', i.price,
                'image_url', i.image_url,
                'available', i.available,
                'addons', (
                  select coalesce(jsonb_agg(
                    jsonb_build_object('id', a.id, 'name', a.name, 'price', a.price)
                    order by a.sort_order
                  ), '[]'::jsonb)
                  from menu_item_addons a
                  where a.menu_item_id = i.id
                )
              )
              order by i.sort_order
            ), '[]'::jsonb)
            from menu_items i
            where i.category_id = c.id and i.tenant_id = v_tenant.id
          )
        )
        order by c.sort_order
      ), '[]'::jsonb)
      from menu_categories c
      where c.tenant_id = v_tenant.id and c.active = true
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ---------- Insertar un pedido desde la carta pública ----------
-- p_items: [{ "menu_item_id": uuid, "quantity": int, "notes": text, "addon_ids": [uuid, ...] }]
create or replace function submit_public_order(
  p_qr_token uuid,
  p_customer_name text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table tables%rowtype;
  v_order_id uuid;
  v_item jsonb;
  v_addon jsonb;
  v_order_item_id uuid;
  v_menu_item menu_items%rowtype;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_total numeric(12,2) := 0;
  v_addon_id uuid;
  v_addon_price numeric(12,2);
begin
  select * into v_table from tables where qr_token = p_qr_token;
  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if exists (
    select 1 from subscriptions
    where tenant_id = v_table.tenant_id
      and status in ('suspended', 'canceled')
  ) then
    raise exception 'Restaurante no disponible';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene items';
  end if;

  insert into orders (tenant_id, table_id, order_type, source, status, customer_name, notes, total)
  values (v_table.tenant_id, v_table.id, 'salon', 'qr', 'pendiente', p_customer_name, p_notes, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from menu_items
      where id = (v_item->>'menu_item_id')::uuid
        and tenant_id = v_table.tenant_id
        and available = true;
    if not found then
      raise exception 'Producto no disponible';
    end if;

    v_unit_price := v_menu_item.price;
    v_line_total := v_unit_price * coalesce((v_item->>'quantity')::int, 1);

    insert into order_items (order_id, tenant_id, menu_item_id, item_name, quantity, unit_price, notes)
    values (
      v_order_id, v_table.tenant_id, v_menu_item.id, v_menu_item.name,
      coalesce((v_item->>'quantity')::int, 1), v_unit_price, v_item->>'notes'
    )
    returning id into v_order_item_id;

    if v_item ? 'addon_ids' then
      for v_addon_id in select jsonb_array_elements_text(v_item->'addon_ids')::uuid
      loop
        select a.price into v_addon_price
        from menu_item_addons a
        where a.id = v_addon_id and a.menu_item_id = v_menu_item.id;

        if not found then
          continue;
        end if;

        insert into order_item_addons (order_item_id, tenant_id, addon_name, price)
        select v_order_item_id, v_table.tenant_id, a.name, a.price
        from menu_item_addons a
        where a.id = v_addon_id;

        v_line_total := v_line_total + v_addon_price * coalesce((v_item->>'quantity')::int, 1);
      end loop;
    end if;

    v_total := v_total + v_line_total;
  end loop;

  update orders set total = v_total where id = v_order_id;
  update tables set status = 'ocupada', opened_at = coalesce(opened_at, now()) where id = v_table.id;

  return v_order_id;
end;
$$;

-- ---------- Llamar al mozo (opcional, dejado preparado) ----------
create or replace function call_waiter(p_qr_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table tables%rowtype;
begin
  select * into v_table from tables where qr_token = p_qr_token;
  if not found then
    raise exception 'Mesa no encontrada';
  end if;
  perform pg_notify('waiter_calls', json_build_object('tenant_id', v_table.tenant_id, 'table_id', v_table.id, 'table_number', v_table.number)::text);
end;
$$;

grant execute on function get_public_menu(uuid) to anon, authenticated;
grant execute on function submit_public_order(uuid, text, text, jsonb) to anon, authenticated;
grant execute on function call_waiter(uuid) to anon, authenticated;
