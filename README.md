# Cambios de interfaz en v3

- Estado visible al principio de la ficha: Pendiente, Vista y No me interesa, con guardado inmediato y selección visual.
- La nota personal aparece al marcar Vista, antes de las puntuaciones y reparto. Fecha y comentario desplegables.
- Sin número de pendientes en el menú. Contador en una palomita junto a «Para otro día», con el total de pendientes aunque filtres la lista.
- Aviso de conexión de MDBList con botón que abre las instrucciones en Ajustes.

**Actualización desde v2:** sustituye el contenido del repositorio por este paquete. Conserva las variables de Vercel. No vuelvas a ejecutar supabase.sql ni cambies las tablas del planner. No cambia el formato de datos.

Las 15 pruebas de lógica siguen pasando. La sintaxis está comprobada; no hay verificación visual en navegador disponible en este entorno.

---

# Poppy — versión 3

Cine personal en rojo cereza, mantequilla y blanco cálido. Esta carpeta es el proyecto completo para sustituir la versión anterior en GitHub/Vercel.

## 1. Actualizar tu Poppy

1. En tu app anterior, entra en Ajustes y descarga una copia de seguridad.
2. Descomprime el ZIP y sube **su contenido** al mismo repositorio de GitHub, sustituyendo los archivos anteriores y añadiendo los nuevos. No subas solo el ZIP ni anides los archivos en otra carpeta.
3. Conserva tu proyecto y dominio de Vercel. La variable `TMDB_READ_TOKEN` que ya has añadido sigue siendo válida.
4. Framework: Other. Root Directory: la raíz que contiene package.json. Build Command vacío. Output Directory: `.`.
5. Haz Deploy/Redeploy y recarga la app. En Ajustes → Comprobar conexión podrás ver si TMDB funciona.

En el mismo dominio y navegador, Poppy copia las listas de v1 a v2 automáticamente sin borrar el respaldo antiguo. Si cambias de dominio o dispositivo, importa la copia JSON desde Ajustes.

## 2. Activar las notas automáticas (MDBList)

1. Crea tu cuenta en https://mdblist.com/ y abre https://mdblist.com/preferences/.
2. Obtén tu API key.
3. En Vercel → tu proyecto → Settings → Environment Variables añade:
   - Nombre: `MDBLIST_API_KEY`
   - Valor: tu clave de MDBList
   - Entorno: Production (y Preview si lo utilizas).
4. Guarda y haz Deployments → Redeploy.
5. Abre una ficha en Poppy. Las notas disponibles aparecerán por separado: IMDb /10, Letterboxd /5, Rotten Tomatoes crítica y público en porcentaje.

No pegues claves en el código ni las subas a GitHub. `OMDB_API_KEY` sigue siendo una opción de respaldo para IMDb y Rotten Tomatoes, pero no hace falta si utilizas MDBList.

Las fichas se renuevan al abrirlas cuando han pasado 24 horas desde la última consulta. Hay caché de servidor de hasta una hora. La app indica la fecha de consulta al proveedor; NO afirma conocer la fecha en que cada web actualizó su puntuación. MDBList puede llevar retraso, no tener una nota o imponer límites de cuota. Las consultas fallidas se muestran y se conservan los últimos valores conocidos cuando existen.

**FilmAffinity no está integrado automáticamente.** Tiene una casilla explícita de conexión no disponible y un enlace a su búsqueda. No se inventa ninguna nota ni se pide que rellenes puntuaciones ajenas manualmente.

## 3. Activar sincronización entre móvil y ordenador (Supabase)

Es opcional: Poppy puede seguir guardando las listas solo en el navegador. Para sincronizar:

1. Crea un proyecto en https://supabase.com/dashboard. Guarda tu contraseña del proyecto; no se introduce en Poppy.
2. En Supabase abre **SQL Editor → New query**, pega el contenido de `supabase.sql` y pulsa **Run**.
3. Busca la **Project URL** en la información/conexión del proyecto y la **Publishable key** (o la clave legacy `anon`, pública) en API Keys.
4. En Vercel añade:

| Nombre exacto | Valor |
|---|---|
| `SUPABASE_URL` | La Project URL, por ejemplo https://tuproyecto.supabase.co, sin barra final |
| `SUPABASE_ANON_KEY` | Publishable key que empieza por sb_publishable_, o clave legacy anon |

**No uses Secret key ni service_role.** La app rechaza esas claves en su configuración pública.

5. En Supabase → Authentication → URL Configuration, establece Site URL en la URL de tu Poppy. Verifica que el proveedor Email esté activado.
6. Haz Redeploy en Vercel.
7. En Poppy → Ajustes crea tu cuenta con correo y contraseña (8 caracteres como mínimo). Si Supabase requiere confirmar el correo, confirma y vuelve a Poppy para pulsar Entrar.
8. Pulsa **«Añadir mis listas de este navegador»** una vez para copiar tu colección local a la cuenta. Las películas que ya estaban en la cuenta se conservan.
9. En el otro dispositivo abre la misma app e inicia sesión con la misma cuenta.

Sincroniza después de editar, al recuperar el foco, cada minuto mientras la app está visible y con el botón «Sincronizar ahora». Sin conexión los cambios quedan locales y se reintentan al volver. No hay sincronización con la aplicación completamente cerrada.

La tabla tiene seguridad RLS por usuario y la función opera con los permisos de la cuenta autenticada. Cada cuenta mantiene una copia local distinta. El cierre de sesión vuelve a la colección local. Las contraseñas se envían directamente a Supabase y no se guardan en Poppy; la sesión se conserva en el navegador.

Los conflictos se resuelven por la última edición de cada película. Una eliminación también se sincroniza para que no reaparezca desde otro dispositivo. Evita editar la misma ficha a la vez en dos dispositivos y mantén sus relojes correctos. Si editas simultáneamente la misma ficha, prevalece la versión más reciente, no se combinan sus campos.

## Qué incluye esta versión

- Nombre Poppy y diseño de palomitas.
- Catálogo TMDB con búsqueda, más resultados y fichas en español cuando existen.
- Carteles consultados por ID real; recuperación de alternativas si falla una imagen, actualización de fichas antiguas y sustituto legible si no hay imagen disponible.
- Fotos de dirección y de hasta 12 intérpretes, con nombres y personajes. Si una persona no tiene imagen se muestran sus iniciales. Enlaces a su ficha TMDB.
- Notas externas independientes; **una sola nota personal** de 0 a 10, con decimales y coma o punto (8,75 y 8.75).
- «La he terminado» prepara estado y fecha; tú confirmas guardando tu nota.
- Selección de varias películas vistas, incluso entre búsquedas. No inventa fechas de visionado.
- «Esta es la del finde»: conserva la elegida hasta verla o cambiar de plan.
- «Hoy no»: aplaza hasta la medianoche local siguiente. «No me interesa»: excluye hasta que tú la recuperes.
- Recomendaciones por géneros valorados: suma pesos positivos/negativos de tus notas y selecciona entre las mejores candidatas. «Sorpréndeme» hace una selección aleatoria. Las fichas similares a tus dos películas mejor puntuadas amplían el catálogo al conectar.
- Exclusión de vistas, descartadas y aplazadas; filtros de género, tiempo y pendientes.
- Diario con búsqueda, orden, filtro mensual, media personal y favoritas de 9 o más.
- Gestión de descartadas, copias JSON y compatibilidad con la versión anterior.
- Sincronización opcional con cuenta Supabase, preparada en el código y SQL.

No utiliza IA, no necesita OpenAI, no reproduce películas y no programa avisos. Los enlaces de JustWatch y YouTube son búsquedas; la app no afirma disponibilidad de una película sin comprobarla.

## Desarrollo

Node.js 20.6 o posterior. Sin dependencias npm:

```sh
npm start
```

Abre http://localhost:3000. Para probar conexiones, crea un `.env` local a partir de `.env.example` y ejecuta:

```sh
node --env-file=.env dev-server.js
```

No abras index.html con doble clic. GitHub Pages no ejecuta las funciones; el paquete está preparado para Vercel.

```sh
npm test
```

15 pruebas de lógica y API con respuestas simuladas: exclusiones, aplazamientos, decimales, preferencias, copias, conflictos y eliminaciones sincronizadas, escalas de puntuación, caducidad, fotos y protección de claves.

**Límites de verificación:** no se han probado las credenciales reales de tu Vercel, MDBList o Supabase. La base de datos no se ha creado por ti: debes ejecutar el SQL. No hubo navegador de pruebas disponible para revisión visual. La disponibilidad real de imágenes y datos depende de las fuentes.

## Fuentes y créditos

TMDB: https://developer.themoviedb.org/ — MDBList: https://docs.mdblist.com/docs/api — Supabase: https://supabase.com/docs/guides/auth — Vercel: https://vercel.com/docs/functions/runtimes/node-js

This product uses the TMDB API but is not endorsed or certified by TMDB.

Antes de difundir públicamente, añade a Créditos un logo oficial aprobado de TMDB obtenido en https://www.themoviedb.org/about/logos-attribution y revisa las condiciones de uso de los proveedores. El aviso y enlace de atribución ya están incluidos.
