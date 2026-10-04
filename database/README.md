# Base de datos (Supabase)

Todo el esquema está en [`schema.sql`](schema.sql). Se ejecuta completo en el **SQL Editor** de Supabase y se puede volver a ejecutar sin perder datos.

## Tablas

| Tabla | Contenido |
| --- | --- |
| `store_config` | Una sola fila (`id = 1`) con toda la configuración de la tienda en JSON: tema, campos, secciones, checkout, datos del negocio. |
| `categories` | Categorías con imagen y orden. |
| `products` | Productos. Variantes, atributos e imágenes van en columnas JSON/array, porque cada tienda define sus propios campos. |
| `orders` | Pedidos enviados por WhatsApp. El número sale de la secuencia `order_number_seq` con el prefijo de la tienda (`AMB-1001`). |
| `admins` | Usuarios de Supabase Auth que pueden administrar la tienda. |

## Seguridad

- **RLS activado en todas las tablas.**
- El público puede **leer** la configuración, las categorías y los productos **activos**.
- Solo quien está en `admins` puede **modificar** algo o ver los pedidos. La función `is_admin()` hace esa comprobación.
- Nadie inserta pedidos directamente. La tienda llama a `create_order(payload)`, que:
  - toma precios y nombres de la base de datos e **ignora** cualquier precio que envíe el navegador;
  - calcula el envío y el envío gratis con la configuración guardada;
  - valida nombre, dirección (si la entrega la pide), productos activos y variantes existentes;
  - limita a 50 líneas por pedido y 99 unidades por línea.
- `replace_catalog(snapshot)` publica o importa el catálogo completo en una transacción. Solo la pueden usar administradores.
- Imágenes en el bucket público `media`: cualquiera las ve, solo los administradores suben, cambian o borran.

## Tiempo real

`store_config`, `categories`, `products` y `orders` están en la publicación `supabase_realtime`. La tienda se actualiza sola cuando el dueño guarda cambios y los pedidos nuevos aparecen en el panel sin recargar. RLS también se aplica aquí: el público nunca recibe eventos de pedidos.

## Pruebas

```bash
npm run test:db
```

[`schema.test.mjs`](schema.test.mjs) levanta Postgres en WebAssembly ([PGlite](https://pglite.dev)), simula lo mínimo de Supabase (roles `anon` y `authenticated`, `auth.uid()`, `storage`, publicación de tiempo real), ejecuta el esquema dos veces y verifica 37 casos: permisos por rol, cálculo de pedidos en el servidor, validaciones, integridad referencial, imágenes y tiempo real.
