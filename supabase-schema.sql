-- =====================================================================
-- SHOPICOL BACANO — esquema de base de datos para Supabase
-- =====================================================================
-- CÓMO USAR ESTE ARCHIVO:
-- 1. Entra a tu proyecto en supabase.com
-- 2. En el menú lateral, ve a "SQL Editor"
-- 3. Haz clic en "New query"
-- 4. Pega TODO el contenido de este archivo
-- 5. Haz clic en "Run" (o Ctrl+Enter)
-- Esto crea la tabla de productos, activa la seguridad, y crea el
-- espacio para guardar las imágenes que suban desde el panel.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla principal de productos
-- ---------------------------------------------------------------------
create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text not null,
  brand       text not null default 'Shopicol',
  category    text not null default 'Otros',
  ref         text default '',
  mayor       numeric(10,2) default 0,
  detal       numeric(10,2) default 0,
  avail       boolean default true,
  offer       numeric(10,2),          -- precio especial "Ahora" (opcional)
  image       text default '',        -- URL pública de la imagen
  note        text default '',        -- notas internas del equipo (opcional)
  featured    boolean default false,  -- aparece en el carrusel de destacados
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Si la tabla ya existía de una instalación anterior, agrega la columna nueva
alter table products add column if not exists featured boolean default false;

comment on table products is 'Catálogo de productos Shopicol Bacano — editable desde el panel de administración';

-- Refresca automáticamente "updated_at" cada vez que se edita una fila
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Seguridad (Row Level Security)
--    - Cualquier visitante de la web puede LEER el catálogo (público)
--    - Solo usuarios logueados (tu equipo) pueden CREAR/EDITAR/BORRAR
-- ---------------------------------------------------------------------
alter table products enable row level security;

drop policy if exists "Lectura pública del catálogo" on products;
create policy "Lectura pública del catálogo"
  on products for select
  to anon, authenticated
  using (true);

drop policy if exists "Equipo puede insertar productos" on products;
create policy "Equipo puede insertar productos"
  on products for insert
  to authenticated
  with check (true);

drop policy if exists "Equipo puede editar productos" on products;
create policy "Equipo puede editar productos"
  on products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Equipo puede borrar productos" on products;
create policy "Equipo puede borrar productos"
  on products for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 3. Índices para que el buscador y los filtros sean rápidos
-- ---------------------------------------------------------------------
create index if not exists idx_products_category on products (category);
create index if not exists idx_products_brand on products (brand);
create index if not exists idx_products_avail on products (avail);

-- ---------------------------------------------------------------------
-- 4. Espacio de almacenamiento para las fotos de producto que se
--    suban desde el panel de administración
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Lectura pública de imágenes" on storage.objects;
create policy "Lectura pública de imágenes"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Equipo puede subir imágenes" on storage.objects;
create policy "Equipo puede subir imágenes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Equipo puede reemplazar imágenes" on storage.objects;
create policy "Equipo puede reemplazar imágenes"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Equipo puede borrar imágenes" on storage.objects;
create policy "Equipo puede borrar imágenes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- =====================================================================
-- 5. PEDIDOS (carrito de compras)
--    Cualquier visitante puede CREAR un pedido (checkout público), pero
--    solo tu equipo logueado puede VER y ACTUALIZAR los pedidos — así
--    los datos de tus clientes quedan privados, visibles solo en el panel.
-- =====================================================================
create table if not exists orders (
  id              bigint generated always as identity primary key,
  customer_name   text not null,
  phone           text not null,
  city            text not null,
  payment_method  text not null,     -- "Pago móvil" | "Efectivo en Caracas" | "Binance" | "Zelle"
  delivery_method text not null,     -- "Delivery" | "Pickup en Caracas" | "Envío nacional"
  address         text default '',  -- dirección de entrega (si Delivery)
  note            text default '',  -- nota adicional (ej. datos de envío nacional)
  items           jsonb not null,    -- [{id, name, qty, price}, ...]
  total           numeric(10,2) not null default 0,
  price_mode      text default 'detal', -- "detal" | "mayor" — con qué precio se armó el pedido
  status          text not null default 'nuevo', -- "nuevo" | "tomado" | "entregado" | "cancelado"
  created_at      timestamptz default now()
);

alter table orders enable row level security;

drop policy if exists "Cualquiera puede crear un pedido" on orders;
create policy "Cualquiera puede crear un pedido"
  on orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Solo el equipo puede ver los pedidos" on orders;
create policy "Solo el equipo puede ver los pedidos"
  on orders for select
  to authenticated
  using (true);

drop policy if exists "Solo el equipo puede actualizar pedidos" on orders;
create policy "Solo el equipo puede actualizar pedidos"
  on orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Solo el equipo puede borrar pedidos" on orders;
create policy "Solo el equipo puede borrar pedidos"
  on orders for delete
  to authenticated
  using (true);

create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_created on orders (created_at desc);

-- =====================================================================
-- 6. BANNERS (slides promocionales del inicio del sitio)
-- =====================================================================
create table if not exists banners (
  id          bigint generated always as identity primary key,
  title       text not null,
  subtitle    text default '',
  image       text default '',
  button_text text default '',
  button_link text default '',
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table banners enable row level security;

drop policy if exists "Lectura pública de banners" on banners;
create policy "Lectura pública de banners"
  on banners for select
  to anon, authenticated
  using (true);

drop policy if exists "Equipo administra banners - insert" on banners;
create policy "Equipo administra banners - insert"
  on banners for insert
  to authenticated
  with check (true);

drop policy if exists "Equipo administra banners - update" on banners;
create policy "Equipo administra banners - update"
  on banners for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Equipo administra banners - delete" on banners;
create policy "Equipo administra banners - delete"
  on banners for delete
  to authenticated
  using (true);

-- =====================================================================
-- 7. AJUSTES DEL SITIO (logo, colores, textos, contacto)
--    Es una tabla de una sola fila (id=1) que controla la apariencia
--    y los datos de contacto del sitio público, editable desde el
--    panel de administración → pestaña "Ajustes".
-- =====================================================================
create table if not exists site_settings (
  id              int primary key default 1,
  store_name      text default 'Shopicol',
  store_tagline   text default 'Bacano',
  meta_description text default 'Catálogo Shopicol Bacano: maquillaje, capilares y cuidado personal colombiano al por mayor y detal.',
  eyebrow_text    text default '✦ Catálogo completo · edición web ✦',
  hero_title      text default 'Lo más bacano para ti.',
  hero_accent_word text default 'bacano',
  hero_subtitle   text default 'Maquillaje, capilares y cuidado personal colombiano, directo del catálogo Shopicol. Compra al detal sin mínimo, o accede a precio mayorista desde $50 en tu compra.',
  hero_note_text  text default '¿Cómo comprar? El precio Detal es por unidad, sin monto mínimo. El precio Mayor se activa al acumular $50 o más en tu pedido — no es por cantidad de piezas, sino por el monto total. ¡Gracias por preferirnos! 💗',
  footer_description text default 'Productos colombianos de buena calidad, a un buen precio. ¡Llegaste al lugar indicado!',
  footer_bottom_text text default 'Catálogo generado a partir del PDF original de Shopicol Bacano · Gracias por preferirnos ✦',
  contact_title   text default '✦ Contáctanos ✦',
  contact_subtitle text default '¿Tienes dudas sobre un producto o tu pedido? Escríbenos por cualquiera de estos medios.',
  logo_url        text default '',
  primary_color   text default '#D6336C',
  accent_color    text default '#E8A33D',
  contact_email   text default '',
  instagram_url   text default '',
  tiktok_url      text default '',
  facebook_url    text default '',
  updated_at      timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

-- Si la tabla ya existía de una instalación anterior, agrega las columnas nuevas
alter table site_settings add column if not exists meta_description text default 'Catálogo Shopicol Bacano: maquillaje, capilares y cuidado personal colombiano al por mayor y detal.';
alter table site_settings add column if not exists eyebrow_text text default '✦ Catálogo completo · edición web ✦';
alter table site_settings add column if not exists hero_note_text text default '¿Cómo comprar? El precio Detal es por unidad, sin monto mínimo. El precio Mayor se activa al acumular $50 o más en tu pedido — no es por cantidad de piezas, sino por el monto total. ¡Gracias por preferirnos! 💗';
alter table site_settings add column if not exists footer_description text default 'Productos colombianos de buena calidad, a un buen precio. ¡Llegaste al lugar indicado!';
alter table site_settings add column if not exists footer_bottom_text text default 'Catálogo generado a partir del PDF original de Shopicol Bacano · Gracias por preferirnos ✦';
alter table site_settings add column if not exists contact_title text default '✦ Contáctanos ✦';
alter table site_settings add column if not exists contact_subtitle text default '¿Tienes dudas sobre un producto o tu pedido? Escríbenos por cualquiera de estos medios.';

alter table site_settings enable row level security;

drop policy if exists "Lectura pública de ajustes" on site_settings;
create policy "Lectura pública de ajustes"
  on site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Equipo puede actualizar ajustes" on site_settings;
create policy "Equipo puede actualizar ajustes"
  on site_settings for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Equipo puede insertar ajustes" on site_settings;
create policy "Equipo puede insertar ajustes"
  on site_settings for insert
  to authenticated
  with check (true);

-- =====================================================================
-- Fin del esquema. Después de correr esto:
--   1. Ve a "Authentication" → "Users" → "Add user" para crear el
--      acceso de cada persona de tu equipo (correo + contraseña).
--   2. Ve a "Table Editor" y confirma que la tabla "products" existe.
--   3. Vuelve al panel de administración e importa el catálogo inicial
--      con el botón "Importar catálogo inicial" (una sola vez).
-- =====================================================================
