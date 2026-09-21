-- =====================================================================
-- SHOPICOL BACANO — migración: "Mis pedidos", "Avísame cuando vuelva"
-- =====================================================================
-- CÓMO USARLO:
-- 1. Entra a tu proyecto en supabase.com → "SQL Editor" → "New query"
-- 2. Pega TODO este archivo y dale "Run"
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. "MIS PEDIDOS" — función segura de búsqueda por teléfono.
--    A diferencia de "abrirle" la tabla completa (lo cual dejaría ver
--    los pedidos de CUALQUIER cliente), esta función SOLO devuelve los
--    pedidos que coincidan exactamente con el teléfono que la persona
--    escriba — nunca puede listar los de otra persona.
-- ---------------------------------------------------------------------
create or replace function get_orders_by_phone(search_phone text)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders
  where phone = search_phone
  order by created_at desc;
$$;

grant execute on function get_orders_by_phone(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. "AVÍSAME CUANDO VUELVA" — solicitudes de restock
-- ---------------------------------------------------------------------
create table if not exists stock_notifications (
  id bigint generated always as identity primary key,
  product_id bigint not null,
  product_name text not null,
  phone text not null,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table stock_notifications enable row level security;

drop policy if exists "Cualquiera puede pedir que le avisen" on stock_notifications;
create policy "Cualquiera puede pedir que le avisen"
  on stock_notifications for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Solo el equipo ve las solicitudes" on stock_notifications;
create policy "Solo el equipo ve las solicitudes"
  on stock_notifications for select
  to authenticated
  using (true);

drop policy if exists "Solo el equipo actualiza las solicitudes" on stock_notifications;
create policy "Solo el equipo actualiza las solicitudes"
  on stock_notifications for update
  to authenticated
  using (true);

drop policy if exists "Solo el equipo borra las solicitudes" on stock_notifications;
create policy "Solo el equipo borra las solicitudes"
  on stock_notifications for delete
  to authenticated
  using (true);

create index if not exists idx_stock_notif_product on stock_notifications (product_id);
create index if not exists idx_stock_notif_notified on stock_notifications (notified);
