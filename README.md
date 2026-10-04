# Vitrina

Motor de catalogos digitales marca blanca con pedidos por WhatsApp, desarrollado para el portafolio de Rasec Dev.

Vitrina no es una tienda: es la base para montar la tienda de **cualquier negocio** sin tocar codigo. Todo lo que hace distinta a una tienda de otra (colores, tipografias, campos de producto, filtros, secciones del inicio, opciones de entrega y textos) vive en una configuracion que el motor lee y pinta.

La demo incluye dos negocios ficticios construidos con el mismo codigo:

- **Ámbar**: perfumeria de nicho en Bogota. Tema oscuro y editorial, piramide olfativa, intensidad, duracion y estela.
- **Lumière**: maquillaje consciente en Medellin. Tema claro, selector de tonos con muestras de color, acabado, cobertura y tipo de piel.

Con el selector flotante **Plantilla** se cambia de un negocio al otro en vivo.

## Tecnologias

- React 19 + TypeScript
- Vite
- Tailwind CSS v4 conectado a variables CSS (el tema cambia en tiempo de ejecucion)
- React Router (filtros del catalogo guardados en la URL)
- TanStack Query (capa de datos asincrona con cache e invalidacion)
- Zustand (bolsa de compras persistente por tienda)
- Zod (validacion del formulario de pedido)
- Motion (animaciones y transiciones)
- Supabase: Postgres con RLS, funciones SQL, Auth, Storage y Realtime (se carga solo si esta configurado)
- Modo demo con `localStorage`, sin backend
- PGlite para probar el esquema SQL sin servidor

## Como abrirlo

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5530`.

Otros comandos:

- `npm run build`: compila para produccion en `dist/`.
- `npm run typecheck`: revisa los tipos.
- `npm run test:db`: prueba el esquema de Supabase (permisos, pedidos, integridad) sobre Postgres en WebAssembly.

## Demo o tienda de cliente

El mismo codigo funciona en dos modos, segun la variable `VITE_PLANTILLA` (ver `.env.example`):

| Modo | `VITE_PLANTILLA` | Comportamiento |
| --- | --- | --- |
| **Demo de portafolio** | vacia | Todas las plantillas, selector flotante y enlaces directos: `/?plantilla=ambar`, `/?plantilla=lumiere`. |
| **Tienda de cliente** | `ambar`, `lumiere`... | Fija en esa plantilla. Sin selector, sin enlaces de plantilla y sin textos de "proyecto de demostracion". |

Asi el portafolio puede enlazar cada negocio por separado sin duplicar el proyecto, y montar la tienda de un cliente es publicar el mismo repositorio con una variable distinta.

## Datos: demo o Supabase

Toda la app habla con un **repositorio** (`src/data/repository.ts`) que tiene dos implementaciones con el mismo contrato:

| | Demo (`localStorage`) | Supabase |
| --- | --- | --- |
| Se activa | sin variables | con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |
| Datos | en el navegador | Postgres, con RLS |
| Pedidos | numerados en el navegador | `create_order` recalcula precios y envío en el servidor |
| Imágenes | data URL comprimida | Supabase Storage (bucket `media`) |
| Acceso al panel | cualquier correo | Supabase Auth + tabla `admins` |
| Sincronización | `BroadcastChannel` entre pestañas | Realtime entre dispositivos |

Con Supabase conectado, la instalación queda en modo cliente. Si la base está vacía, el primer ingreso al panel ofrece elegir la plantilla del rubro y publicarla. La librería de Supabase va en un archivo aparte que la demo nunca descarga.

- Guía paso a paso: [docs/INSTALAR-CLIENTE.md](docs/INSTALAR-CLIENTE.md)
- Esquema y seguridad: [database/README.md](database/README.md)

## Como funciona la personalizacion

| Que se personaliza | Donde vive |
| --- | --- |
| Colores, tipografias, bordes, estilo de tarjetas, grano, logo | `config.theme` |
| Campos de producto (texto, lista, multiple, etiquetas, escala, si/no) | `config.catalog.attributes` |
| Como se agrupan en la ficha (niveles, medidores, chips, lista) | `config.catalog.groups` |
| Filtros del catalogo | atributos con `filterable: true` |
| Secciones del inicio y su orden | `config.sections` |
| Entregas, costos, envio gratis, metodos de pago, mensaje de WhatsApp | `config.checkout` |
| Datos del negocio y avisos superiores | `config.business`, `config.announcements` |

Los filtros, la ficha del producto y los formularios se **generan a partir del esquema de atributos**. Por eso una perfumeria y una tienda de maquillaje funcionan con los mismos componentes.

### Sumar un rubro nuevo

1. Copia `src/config/templates/ambar.ts` con otro nombre.
2. Cambia tema, atributos, categorias y productos.
3. Registralo en `src/config/templates/index.ts`.

## Flujo de compra

1. El cliente agrega productos a la bolsa (con variante: tamaño, tono, talla...).
2. Completa sus datos y elige entrega y pago. El envio gratis se calcula solo.
3. El pedido queda registrado con un numero (`AMB-1041`) y se abre WhatsApp con el mensaje listo para enviar.
4. Se muestra una vista previa de como llega el mensaje al negocio.

## Panel de administracion

Se entra desde `/admin` o desde el selector flotante **Plantilla → Abrir el panel**. En modo demo los datos de acceso ya vienen completos. El panel se carga en un archivo aparte, asi que quien solo visita la tienda nunca lo descarga.

| Seccion | Que permite |
| --- | --- |
| **Resumen** | Ventas, pedidos, ticket promedio, grafico de los ultimos 7 dias, ultimos pedidos, productos mas pedidos e inventario bajo. |
| **Pedidos** | Filtrar por estado, buscar, ver el detalle, confirmar, marcar entregado, cancelar o reabrir, y escribirle al cliente por WhatsApp. |
| **Productos** | Crear, editar, duplicar, ocultar, destacar y eliminar. Galeria con subida de fotos (se comprimen en el navegador), variantes con precio, precio anterior, inventario y muestra de color, y campos generados desde el esquema de la tienda. |
| **Categorias** | Crear y editar con imagen, y reordenar arrastrando. |
| **Campos y filtros** | Crear campos de cualquiera de los 6 tipos, con opciones y colores. Decidir si filtran, si salen en la tarjeta y en que grupo de la ficha van. Editar grupos, etiquetas y los nombres que usa la tienda ("fragancia", "Tono"...). |
| **Personalizar tienda** | Editor visual con **vista previa en vivo** de la tienda real (escritorio o celular): paletas, colores con aviso de contraste, tipografias, formas, logo, secciones del inicio (agregar, ordenar arrastrando, ocultar, duplicar y editar), datos del negocio, avisos, entregas, pagos y mensaje de WhatsApp. |
| **Ajustes** | Descargar e importar un respaldo en JSON (validado con Zod), ver el espacio usado y restaurar la demo. |

Los cambios de configuracion se trabajan como borrador: se ven en la vista previa y solo se publican al pulsar **Guardar**. Si sales con cambios sin guardar, el panel te avisa. La tienda y el panel abiertos en pestañas distintas se sincronizan solos.

## Estructura

```
src/
  app/            rutas (el panel se carga aparte)
  admin/          panel: paginas, editores, componentes de formulario
  config/         plantillas de negocio (Ámbar, Lumière)
  types/          modelo de datos (StoreConfig, Product, Order...)
  theme/          motor de temas y catalogo de tipografias
  data/           repositorio de datos (localStorage o Supabase) y autenticacion
  state/          bolsa, interfaz y plantilla activa
  lib/            catalogo, filtros, checkout, WhatsApp, formato
  components/     layout, secciones, catalogo, producto, bolsa, demo
  pages/          inicio, catalogo, producto, 404
database/        esquema SQL de Supabase y sus pruebas
docs/            guia de instalacion para clientes
```

## Estado

- [x] Motor de temas y plantillas Ámbar y Lumière
- [x] Inicio por secciones, catalogo con filtros dinamicos, ficha de producto
- [x] Bolsa, checkout y pedido por WhatsApp
- [x] Panel de administracion con editor visual y vista previa en vivo
- [x] Conexion a Supabase: base de datos, imagenes, autenticacion y tiempo real
- [x] Guia para instalar un cliente nuevo

## Imagenes

Las fotos de la demo son imagenes libres de Unsplash y se cargan desde su CDN con el tamaño justo para cada componente.

## Nota de portafolio

Ámbar y Lumière no son clientes reales. Son negocios ficticios creados para mostrar las capacidades de diseño y desarrollo de Rasec Dev.
