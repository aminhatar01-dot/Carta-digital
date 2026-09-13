-- =========================================================
-- Comanda: habilitar Supabase Realtime en tablas operativas
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table order_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tables'
  ) then
    alter publication supabase_realtime add table tables;
  end if;
end $$;
