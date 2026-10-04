-- =============================================================================
-- Vitrina · Esquema de base de datos para Supabase
--
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run.
-- Se puede volver a ejecutar sin perder datos (crea solo lo que falta).
--
-- Seguridad:
--   * Cualquiera puede LEER la configuracion, las categorias y los productos activos.
--   * Solo los usuarios de la tabla `admins` pueden MODIFICAR algo.
--   * Los clientes crean pedidos solo a traves de `create_order`, que recalcula
--     precios, envio y total en el servidor (el navegador no decide cuanto cuesta).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Administradores
-- -----------------------------------------------------------------------------

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

-- Una sola fila (id = 1) con toda la configuracion de la tienda: tema, campos, secciones, checkout.
create table if not exists public.store_config (
  id         smallint primary key default 1 check (id = 1),
  config     jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  description text,
  image       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  category_id text not null references public.categories (id) on update cascade on delete restrict,
  summary     text not null default '',
  description text not null default '',
  images      text[] not null default '{}',
  variants    jsonb not null,
  attributes  jsonb not null default '{}',
  badges      text[] not null default '{}',
  featured    boolean not null default false,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint products_variants_not_empty check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) > 0)
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_order_idx on public.products (sort_order, created_at desc);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  status         text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  customer       jsonb not null,
  delivery_id    text not null,
  delivery_label text not null,
  payment        text not null default '',
  items          jsonb not null,
  subtotal       numeric(14, 2) not null,
  delivery_fee   numeric(14, 2) not null default 0,
  total          numeric(14, 2) not null,
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- updated_at automatico
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists store_config_touch on public.store_config;
create trigger store_config_touch before update on public.store_config
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Seguridad por filas (RLS)
-- -----------------------------------------------------------------------------

alter table public.admins       enable row level security;
alter table public.store_config enable row level security;
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.orders       enable row level security;

-- Supabase puede dar todos los permisos a las tablas nuevas: se parte de cero.
revoke all on public.admins, public.store_config, public.categories, public.products, public.orders from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;

grant select on public.store_config, public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.store_config, public.categories, public.products to authenticated;
grant select, update, delete on public.orders to authenticated;
grant select on public.admins to authenticated;

-- admins: cada usuario solo puede ver su propia fila (para saber si es administrador)
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

-- store_config
drop policy if exists store_config_read on public.store_config;
create policy store_config_read on public.store_config for select to anon, authenticated using (true);
drop policy if exists store_config_write on public.store_config;
create policy store_config_write on public.store_config for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- products: el publico solo ve los activos; el administrador ve todos
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using (active or public.is_admin());
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders: solo el administrador los ve y los cambia. Nadie inserta directo (ver create_order).
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Crear pedido (lo llama la tienda publica)
-- -----------------------------------------------------------------------------

create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg       jsonb;
  item      jsonb;
  prod      public.products;
  variant   jsonb;
  qty       integer;
  lines     jsonb := '[]'::jsonb;
  subtotal  numeric := 0;
  delivery  jsonb;
  fee       numeric := 0;
  customer  jsonb := coalesce(payload -> 'customer', '{}'::jsonb);
  prefix    text;
  created   public.orders;
begin
  select config into cfg from public.store_config where id = 1;
  if cfg is null then
    raise exception 'La tienda todavía no está configurada.';
  end if;

  if jsonb_typeof(payload -> 'items') is distinct from 'array'
     or jsonb_array_length(payload -> 'items') = 0
     or jsonb_array_length(payload -> 'items') > 50 then
    raise exception 'El pedido está vacío o tiene demasiados productos.';
  end if;

  if length(trim(coalesce(customer ->> 'name', ''))) < 2 then
    raise exception 'Falta el nombre de quien pide.';
  end if;

  -- Precios tomados de la base de datos, nunca del navegador
  for item in select value from jsonb_array_elements(payload -> 'items') loop
    qty := greatest(1, least(99, coalesce((item ->> 'qty')::integer, 1)));

    select * into prod from public.products where id = item ->> 'productId' and active;
    if not found then
      raise exception 'Uno de los productos ya no está disponible.';
    end if;

    select value into variant
    from jsonb_array_elements(prod.variants)
    where value ->> 'id' = item ->> 'variantId';
    if variant is null then
      raise exception 'La opción elegida de "%" ya no está disponible.', prod.name;
    end if;

    subtotal := subtotal + (variant ->> 'price')::numeric * qty;
    lines := lines || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'productId',    prod.id,
      'variantId',    variant ->> 'id',
      'name',         prod.name,
      'variantLabel', variant ->> 'label',
      'price',        (variant ->> 'price')::numeric,
      'qty',          qty,
      'image',        prod.images[1]
    )));
  end loop;

  select value into delivery
  from jsonb_array_elements(cfg -> 'checkout' -> 'deliveryOptions')
  where value ->> 'id' = payload ->> 'deliveryId';
  if delivery is null then
    raise exception 'La forma de entrega no es válida.';
  end if;

  if coalesce((delivery ->> 'requiresAddress')::boolean, false)
     and length(trim(coalesce(customer ->> 'address', ''))) < 6 then
    raise exception 'Falta la dirección de entrega.';
  end if;

  fee := coalesce((delivery ->> 'fee')::numeric, 0);
  if (delivery ->> 'freeFrom') is not null and subtotal >= (delivery ->> 'freeFrom')::numeric then
    fee := 0;
  end if;

  prefix := coalesce(nullif(regexp_replace(cfg -> 'checkout' ->> 'orderPrefix', '[^A-Za-z0-9]', '', 'g'), ''), 'PED');

  insert into public.orders (number, customer, delivery_id, delivery_label, payment, items, subtotal, delivery_fee, total)
  values (
    prefix || '-' || nextval('public.order_number_seq'),
    jsonb_strip_nulls(jsonb_build_object(
      'name',    left(trim(customer ->> 'name'), 80),
      'phone',   nullif(left(trim(coalesce(customer ->> 'phone', '')), 30), ''),
      'address', case when coalesce((delivery ->> 'requiresAddress')::boolean, false)
                      then left(trim(customer ->> 'address'), 200) end,
      'notes',   nullif(left(trim(coalesce(customer ->> 'notes', '')), 300), '')
    )),
    delivery ->> 'id',
    delivery ->> 'label',
    left(coalesce(payload ->> 'payment', ''), 60),
    lines,
    subtotal,
    fee,
    subtotal + fee
  )
  returning * into created;

  return to_jsonb(created);
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Publicar o importar el catalogo completo (lo usa el panel)
-- Reemplaza configuracion, categorias y productos en una sola transaccion.
-- Los pedidos no se tocan.
-- -----------------------------------------------------------------------------

create or replace function public.replace_catalog(snapshot jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  insert into public.store_config (id, config)
  values (1, snapshot -> 'config')
  on conflict (id) do update set config = excluded.config;

  delete from public.products where true;
  delete from public.categories where true;

  insert into public.categories (id, slug, name, description, image, sort_order)
  select c.item ->> 'id', c.item ->> 'slug', c.item ->> 'name', c.item ->> 'description', c.item ->> 'image',
         coalesce((c.item ->> 'order')::integer, 0)
  from jsonb_array_elements(snapshot -> 'categories') as c(item);

  insert into public.products (
    id, slug, name, category_id, summary, description, images, variants, attributes, badges, featured, active, sort_order, created_at
  )
  select
    p.item ->> 'id',
    p.item ->> 'slug',
    p.item ->> 'name',
    p.item ->> 'categoryId',
    coalesce(p.item ->> 'summary', ''),
    coalesce(p.item ->> 'description', ''),
    array(select jsonb_array_elements_text(coalesce(p.item -> 'images', '[]'::jsonb))),
    p.item -> 'variants',
    coalesce(p.item -> 'attributes', '{}'::jsonb),
    array(select jsonb_array_elements_text(coalesce(p.item -> 'badges', '[]'::jsonb))),
    coalesce((p.item ->> 'featured')::boolean, false),
    coalesce((p.item ->> 'active')::boolean, true),
    p.position::integer,
    coalesce((p.item ->> 'createdAt')::timestamptz, now())
  from jsonb_array_elements(snapshot -> 'products') with ordinality as p(item, position);
end;
$$;

revoke all on function public.replace_catalog(jsonb) from public;
grant execute on function public.replace_catalog(jsonb) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Imagenes (Storage): lectura publica, escritura solo administradores
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif'])
on conflict (id) do update set public = true;

-- Las URL publicas no pasan por estas reglas. Leer la tabla sirve para listar y
-- borrar archivos, y eso es solo para administradores.
drop policy if exists media_admin_select on storage.objects;
create policy media_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Tiempo real: la tienda y el panel se actualizan solos
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['store_config', 'categories', 'products', 'orders'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
