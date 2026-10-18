# Poppy Cinema 🍿 — prototipo v1

Tu cine personal de fin de semana. Diseño rojo cereza, mantequilla y blanco cálido; logo vectorial de palomitas incluido. Responsive, sin dependencias de interfaz.

## Subir a GitHub y Vercel

1. Descomprime el ZIP. Sube **el contenido de esta carpeta** a la raíz de un nuevo repositorio de GitHub: `index.html`, `app.js`, `api/`, etc. No subas solamente el ZIP.
2. En Vercel: Add New → Project → importa ese repositorio.
3. Framework Preset: **Other**. Root Directory: la carpeta que contiene package.json (raíz si has seguido el paso 1). No hace falta Build Command. Output Directory: `.`.
4. Despliega. Sin claves funciona el modo de muestra con ocho películas.
5. Para activar el catálogo completo, añade estas variables en Settings → Environment Variables, para Production (y Preview si quieres). Después haz Redeploy:

| Variable | Necesaria | Contenido |
|---|---|---|
| `TMDB_READ_TOKEN` | Para catálogo completo | API Read Access Token de TMDB (token largo; no la API key corta). |
| `OMDB_API_KEY` | Opcional | API key de OMDb para IMDb y Rotten Tomatoes cuando existan. |

Solicita las credenciales en https://www.themoviedb.org/settings/api y https://www.omdbapi.com/apikey.aspx. Nunca las subas a GitHub ni las pegues en app.js. Las peticiones salen de api/movies.js y las claves permanecen en el servidor.

GitHub almacena el código. **GitHub Pages no ejecuta la API**: allí solo funcionará la muestra. El destino recomendado del paquete es Vercel.

## Probar en tu ordenador

Instala Node.js 20 o posterior y ejecuta desde la carpeta:

```sh
npm start
```

Abre http://localhost:3000. No abras index.html con doble clic: los módulos requieren servidor HTTP. Para probar claves localmente crea `.env` siguiendo `.env.example` y ejecuta `node --env-file=.env dev-server.js` con Node 20.6+.

## Incluido

- Recomendación aleatoria entre películas cargadas, con filtro de género, duración y pendientes.
- Exclusión de vistas y descartadas. No vuelve a elegir la misma si hay otras candidatas.
- Búsqueda por título: muestra local o búsqueda TMDB real cuando se configura.
- Carteles, título, año, sinopsis y géneros; dirección, reparto y duración se completan al abrir la ficha en modo conectado.
- Pendientes, diario de vistas, fecha, nota propia, comentario, resumen de películas y favoritas.
- Puntuación TMDB y, con OMDb, IMDb y Rotten Tomatoes cuando estén disponibles. No se inventan valores ausentes.
- Letterboxd y FilmAffinity: entrada manual claramente diferenciada.
- Enlaces a búsqueda de tráiler y a JustWatch España (no se afirma disponibilidad de streaming sin verificar).
- Copia JSON exportable e importable; validación de copia; mensajes de error.

## Datos: ¿hace falta base de datos?

**No para este prototipo.** Usa localStorage del navegador. Los datos persisten al recargar y cerrar el navegador, pero son propios de ese navegador y dominio. Cambiar de dominio, usar otro dispositivo o borrar los datos rompe esa continuidad. Haz copias desde Ajustes.

Para sincronizar móvil y ordenador, el siguiente paso es incorporar una base online y autenticación. No está implementado ni se necesita configurar para probar esta versión. No hay cuentas ni sincronización silenciosa. La app desplegada no debe contener datos personales precargados: tus datos solo se escriben localmente.

## Límites del prototipo

- La selección no usa IA ni aprende todavía de las notas. Usa filtros y azar entre el catálogo cargado (inicialmente populares de TMDB); las búsquedas amplían ese catálogo durante la sesión. Las fichas guardadas sí permanecen.
- No conoce películas que hayas visto hasta que las marques.
- Las duraciones desconocidas se excluyen cuando pides un tiempo máximo. Abre la ficha para completar la duración.
- La búsqueda presenta la primera página de resultados.
- No incluye calendario, recordatorios, reproducción de películas ni importación de cuentas externas.
- Las API pueden imponer límites o costes según el plan contratado; no se incluye una suscripción ni credenciales.
- Antes de publicar para terceros, completa los créditos con un **logo oficial aprobado de TMDB**, descargado de https://www.themoviedb.org/about/logos-attribution, además del aviso ya incluido. Respeta las condiciones de TMDB y OMDb.
- Los carteles y las fuentes requieren internet; hay sustitutos de texto y fuentes del sistema si fallan.

## Verificación

`npm test`: pruebas de exclusión de vistas/descartadas, filtros, validación de copias y normalización de la API con respuestas simuladas. Sintaxis JS revisada. No se ha probado en un navegador visual ni con credenciales reales; comprueba la búsqueda tras configurar Vercel.

Referencias: https://developer.themoviedb.org/reference/movie-details · https://developer.themoviedb.org/docs/faq · https://www.omdbapi.com/ · https://vercel.com/docs/functions/runtimes/node-js
