# Instalar Vitrina para un cliente

Guía para montar la tienda de un negocio nuevo en unos 15 minutos, sin costo para ninguna de las dos partes.

Cada cliente tiene **su propio proyecto de Supabase en su propia cuenta**. Así el límite de proyectos gratuitos nunca es un problema y el negocio es dueño de sus datos. Tú lo configuras con acceso que te comparta, o con él al lado.

> Supabase y Cloudflare cambian sus pantallas de vez en cuando. Si un nombre de menú no coincide, busca la opción equivalente.

---

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) con la cuenta del cliente y crea un **New project**.
2. Nombre: el del negocio. Región: la más cercana (para Colombia, **South America (São Paulo)**).
3. Guarda la contraseña de la base de datos en un lugar seguro. La app no la necesita.

## 2. Crear las tablas

1. Abre **SQL Editor → New query**.
2. Pega todo el contenido de [`database/schema.sql`](../database/schema.sql) y pulsa **Run**.
3. Debe terminar sin errores. Se puede volver a ejecutar si algo falla a mitad de camino.

## 3. Crear la cuenta del dueño

1. **Authentication → Sign In / Providers**: deja activo el acceso con correo y **desactiva "Allow new users to sign up"**. Así nadie más puede registrarse.
2. **Authentication → Users → Add user → Create new user**: correo y contraseña del dueño. Marca **Auto Confirm User**.
3. Vuelve al **SQL Editor** y dale permisos de administrador (cambia el correo):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'dueno@negocio.com';
   ```

## 4. Copiar las llaves

En **Project Settings → API** (o **API Keys**) copia:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** (o **publishable**) → `VITE_SUPABASE_ANON_KEY`

Esta llave es pública por diseño: la seguridad está en las reglas RLS de la base. **Nunca** uses la llave `service_role` / `secret` en la tienda.

## 5. Publicar en Cloudflare Pages

Cloudflare Pages no cobra el tráfico en el plan gratuito y permite uso comercial. Lo ideal es usar la cuenta de Cloudflare del cliente.

1. En [dash.cloudflare.com](https://dash.cloudflare.com): **Workers & Pages → Create application → Pages → Import an existing Git repository**.
2. Conecta GitHub (dale acceso solo al repositorio de la tienda) y elígelo.
3. Configuración de la compilación:

   | Campo | Valor |
   | --- | --- |
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

4. En **Environment variables** agrega:

   | Variable | Valor |
   | --- | --- |
   | `VITE_SUPABASE_URL` | la Project URL |
   | `VITE_SUPABASE_ANON_KEY` | la llave anon/publishable |
   | `NODE_VERSION` | `22` |
   | `VITE_PLANTILLA` | opcional: `ambar`, `lumiere`... Es la plantilla que se ve antes del primer ingreso. |

5. **Save and Deploy**. Cada cambio que subas a GitHub se publica solo. Si cambias una variable, vuelve a desplegar desde **Deployments**.
6. Opcional: **Custom domains** para conectar el dominio del negocio.

Las rutas como `/admin` o `/catalogo` funcionan sin configurar nada: si no hay un `404.html`, Cloudflare responde con `index.html`.

## 6. Ajustar la autenticación

En Supabase, **Authentication → URL Configuration**:

- **Site URL**: `https://<la-tienda>.pages.dev/admin` (o el dominio propio + `/admin`).

Así los enlaces de recuperación de contraseña llevan directo al panel.

## 7. Primer ingreso

1. Abre `https://<la-tienda>/admin` e inicia sesión con la cuenta del paso 3.
2. Como la base está vacía, aparece **Bienvenido a tu tienda**: elige la plantilla del rubro y pulsa **Empezar con esta plantilla**.
3. Desde ahí todo se personaliza en el panel:
   - **Personalizar tienda**: colores, tipografías, logo, secciones, WhatsApp, entregas y pagos.
   - **Campos y filtros**: los datos que tendrá cada producto.
   - **Productos** y **Categorías**: reemplaza los ejemplos por los reales.

Listo. Los pedidos llegan al WhatsApp del negocio y quedan registrados en **Pedidos**.

---

## Mantenimiento

### Recuperar la contraseña del dueño

En Supabase, **Authentication → Users → (usuario) → Send password recovery**. El enlace abre el panel con la sesión iniciada; luego, en **Ajustes → Tu cuenta**, se elige una contraseña nueva.

### Agregar otro administrador

Crea el usuario como en el paso 3 y ejecuta el mismo `insert into public.admins` con su correo.

### Respaldos

**Ajustes → Descargar respaldo** baja un JSON con diseño, campos, categorías y productos. Sirve también para arrancar la tienda de otro cliente parecido: **Ajustes → Importar archivo**.

### Evitar que el proyecto gratuito se pause

Supabase pausa los proyectos gratuitos sin actividad durante varios días. Una tienda con visitas no llega a eso. Si el negocio tiene temporadas sin tráfico, agrega este flujo de GitHub Actions al repositorio (`.github/workflows/mantener-activo.yml`) y define los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub:

```yaml
name: Mantener Supabase activo
on:
  schedule:
    - cron: '0 12 * * *' # todos los dias a las 7 a. m. (Colombia)
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS "${{ secrets.SUPABASE_URL }}/rest/v1/store_config?select=id" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" > /dev/null
```

### Límites del plan gratuito

Revisa los valores actuales en la página de precios de Supabase. Para un catálogo suelen sobrar: las fotos se comprimen en el navegador (WebP, máximo 1200 px) antes de subirse.
