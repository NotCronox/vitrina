/**
 * Pruebas del esquema de Supabase sobre PGlite (Postgres en WebAssembly).
 * Simula lo minimo de Supabase (roles, auth.uid, storage, realtime) y verifica
 * permisos, calculo de pedidos en el servidor e integridad de datos.
 *
 *   npm run test:db
 */
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync } from 'node:fs'

const db = new PGlite({ extensions: { pgcrypto } })
const ADMIN = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'
let failures = 0

const ok = (cond, label, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  → ' + extra : ''}`)
  if (!cond) failures++
}

async function as(role, uid, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role;')
  }
}

async function expectError(promise, label, match) {
  try {
    await promise
    ok(false, label, 'no lanzó error')
  } catch (e) {
    ok(!match || String(e.message).includes(match), label, e.message)
  }
}

// --- Simulacion minima de lo que Supabase trae de fabrica ---
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create publication supabase_realtime;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  insert into auth.users values ('${ADMIN}', 'dueno@tienda.co'), ('${OTHER}', 'intruso@x.co');
`)

// --- Esquema real ---
const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
await db.exec(schema)
await db.exec(schema) // debe poder ejecutarse dos veces
ok(true, 'schema.sql se ejecuta (y se puede volver a ejecutar)')

await db.exec(`insert into public.admins (user_id) values ('${ADMIN}')`)
const { ambarTemplate: snapshot } = await import('../src/config/templates/ambar.ts')

// --- Publicar catalogo ---
await expectError(as('anon', null, () => db.query('select public.replace_catalog($1)', [snapshot])), 'anon no puede publicar el catálogo')
await expectError(as('authenticated', OTHER, () => db.query('select public.replace_catalog($1)', [snapshot])), 'usuario no admin no puede publicar', 'No autorizado')
await as('authenticated', ADMIN, () => db.query('select public.replace_catalog($1)', [snapshot]))
const counts = (await db.query('select (select count(*) from products)::int p, (select count(*) from categories)::int c')).rows[0]
ok(counts.p === 16 && counts.c === 4, 'admin publica la plantilla Ámbar', JSON.stringify(counts))
const order1 = (await db.query(`select id, sort_order from products order by sort_order limit 1`)).rows[0]
ok(order1.id === 'ambar-nocturno' && order1.sort_order === 1, 'se conserva el orden de los productos', JSON.stringify(order1))

// --- Lectura publica ---
await db.exec(`update products set active = false where id = 'cuero-salvaje'`)
const anonProducts = await as('anon', null, () => db.query('select count(*)::int n from products'))
ok(anonProducts.rows[0].n === 15, 'el público no ve productos ocultos', `ve ${anonProducts.rows[0].n}`)
const adminProducts = await as('authenticated', ADMIN, () => db.query('select count(*)::int n from products'))
ok(adminProducts.rows[0].n === 16, 'el admin ve todos los productos')
const cfg = await as('anon', null, () => db.query('select config->>\'id\' id from store_config'))
ok(cfg.rows[0]?.id === 'ambar', 'el público lee la configuración')

// --- Escrituras prohibidas ---
const anonUpdate = await as('anon', null, () => db.query(`update products set name = 'X' where id = 'oud-imperial'`).catch((e) => e))
ok(anonUpdate instanceof Error, 'anon no puede editar productos', anonUpdate.message ?? '')
const otherUpdate = await as('authenticated', OTHER, () => db.query(`update store_config set config = '{}'::jsonb`))
ok(otherUpdate.affectedRows === 0, 'usuario no admin no modifica la configuración', `filas: ${otherUpdate.affectedRows}`)
await expectError(as('anon', null, () => db.query(`insert into orders (number, customer, delivery_id, delivery_label, items, subtotal, total) values ('X-1', '{}', 'a', 'a', '[]', 0, 0)`)), 'anon no puede insertar pedidos directamente')

// --- Crear pedido (precios recalculados en el servidor) ---
const payload = {
  customer: { name: 'Cliente Prueba', phone: '3001234567', address: 'Calle 100 #10-20, Bogotá', notes: '' },
  deliveryId: 'bogota',
  payment: 'Transferencia o Nequi',
  items: [
    { productId: 'oud-imperial', variantId: 'ml50', qty: 1, price: 1 },
    { productId: 'neroli-del-caribe', variantId: 'd5', qty: 2 },
  ],
}
const created = (await as('anon', null, () => db.query('select public.create_order($1) o', [payload]))).rows[0].o
ok(created.number === 'AMB-1001', 'número de pedido con el prefijo de la tienda', created.number)
ok(Number(created.subtotal) === 540000 + 46000 * 2, 'el subtotal usa los precios de la base (ignora el precio enviado)', String(created.subtotal))
ok(Number(created.delivery_fee) === 0, 'envío gratis aplicado desde $300.000', String(created.delivery_fee))
ok(created.status === 'pending' && created.items.length === 2 && created.items[0].name === 'Oud Imperial', 'líneas del pedido armadas en el servidor')
ok(created.customer.notes === undefined, 'notas vacías no se guardan')

const small = (await as('anon', null, () => db.query('select public.create_order($1) o', [{ ...payload, items: [{ productId: 'neroli-del-caribe', variantId: 'd5', qty: 1 }] }]))).rows[0].o
ok(Number(small.delivery_fee) === 12000 && Number(small.total) === 46000 + 12000, 'cobra domicilio por debajo del mínimo', `${small.delivery_fee} / ${small.total}`)

const pickup = (await as('anon', null, () => db.query('select public.create_order($1) o', [{ ...payload, deliveryId: 'tienda' }]))).rows[0].o
ok(pickup.customer.address === undefined, 'recoger en tienda no guarda dirección')

await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, items: [{ productId: 'cuero-salvaje', variantId: 'ml50', qty: 1 }] }])), 'rechaza productos ocultos', 'ya no está disponible')
await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, items: [{ productId: 'oud-imperial', variantId: 'nope', qty: 1 }] }])), 'rechaza variantes inexistentes', 'no está disponible')
await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, deliveryId: 'marte' }])), 'rechaza entregas inexistentes', 'entrega')
await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, customer: { ...payload.customer, address: '' } }])), 'exige dirección para domicilio', 'dirección')
await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, customer: { name: 'A' } }])), 'exige nombre', 'nombre')
await expectError(as('anon', null, () => db.query('select public.create_order($1)', [{ ...payload, items: [] }])), 'rechaza pedidos vacíos', 'vacío')

const q = (await as('anon', null, () => db.query('select public.create_order($1) o', [{ ...payload, items: [{ productId: 'neroli-del-caribe', variantId: 'd5', qty: 500 }] }]))).rows[0].o
ok(q.items[0].qty === 99, 'limita la cantidad por línea a 99', String(q.items[0].qty))

// --- Pedidos: visibilidad y cambios ---
const anonOrders = await as('anon', null, () => db.query('select count(*)::int n from orders').catch((e) => e))
ok(anonOrders instanceof Error || anonOrders.rows[0].n === 0, 'el público no puede leer pedidos', anonOrders.message ?? `ve ${anonOrders.rows[0].n}`)
const otherOrders = await as('authenticated', OTHER, () => db.query('select count(*)::int n from orders'))
ok(otherOrders.rows[0].n === 0, 'usuario no admin no lee pedidos')
const adminOrders = await as('authenticated', ADMIN, () => db.query('select count(*)::int n from orders'))
ok(adminOrders.rows[0].n === 4, 'el admin ve los pedidos', `ve ${adminOrders.rows[0].n}`)
const upd = await as('authenticated', ADMIN, () => db.query(`update orders set status = 'confirmed' where number = 'AMB-1001' returning status`))
ok(upd.rows[0]?.status === 'confirmed', 'el admin cambia el estado de un pedido')
await expectError(as('authenticated', ADMIN, () => db.query(`update orders set status = 'enviado' where number = 'AMB-1001'`)), 'solo acepta estados válidos')

// --- is_admin ---
const isAdmin = await as('authenticated', ADMIN, () => db.query('select public.is_admin() v'))
const isNot = await as('authenticated', OTHER, () => db.query('select public.is_admin() v'))
ok(isAdmin.rows[0].v === true && isNot.rows[0].v === false, 'is_admin distingue al dueño')

// --- Integridad ---
await expectError(as('authenticated', ADMIN, () => db.query(`delete from categories where id = 'el'`)), 'no deja borrar categorías con productos')
await expectError(as('authenticated', ADMIN, () => db.query(`insert into products (id, slug, name, category_id, variants) values ('x', 'x', 'X', 'el', '[]')`)), 'exige al menos una variante')

// --- Storage ---
const bucket = (await db.query(`select public from storage.buckets where id = 'media'`)).rows[0]
ok(bucket?.public === true, 'bucket de imágenes público creado')
await expectError(as('authenticated', OTHER, () => db.query(`insert into storage.objects (bucket_id, name) values ('media', 'x.webp')`)), 'no admin no sube imágenes')
await as('authenticated', ADMIN, () => db.query(`insert into storage.objects (bucket_id, name) values ('media', 'x.webp')`))
ok(true, 'el admin sube imágenes')

// --- Tiempo real ---
const pub = (await db.query(`select string_agg(tablename, ',' order by tablename) t from pg_publication_tables where pubname = 'supabase_realtime'`)).rows[0].t
ok(pub === 'categories,orders,products,store_config', 'tablas publicadas para tiempo real', pub)

console.log(failures ? `\n${failures} prueba(s) fallaron` : '\nTodas las pruebas pasaron')
process.exit(failures ? 1 : 0)
