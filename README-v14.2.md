# Poppy v14.2 — Correcciones de sesión y carteleras

Se basa en v14.1. Conserva tus datos, las carpetas personales, puntuaciones y sincronización en Supabase. No requiere ejecutar SQL.

## Sesión perfecta

La búsqueda en **Todo el catálogo** aplica en la consulta de TMDB la plataforma por suscripción en España, el género y el límite de duración, y consulta hasta tres páginas de resultados. Ya no extrae unas pocas películas al azar para después buscar disponibilidad entre las primeras 35. Excluye tus pendientes, vistas y descartadas en búsqueda general. El resultado se conserva al actualizar Inicio. En **Mis pendientes** sí se comprueba la disponibilidad individual de las películas y se da prioridad a las marcadas 🔥. En ausencia de candidatos confirmados se informa sin inventar disponibilidad.

## Cartelera local

OCINE Premium Estepark, Sucre Vila-real y Cinesa La Salera muestran tarjetas en cuadrícula como Descubrir. Los títulos proceden de las páginas de cartelera: una nueva consulta a TMDB intenta encontrar el póster y la ficha de cada título. Si no hay una correspondencia suficientemente fiable, la tarjeta mantiene el título del cine y permite buscarlo en Poppy, pero no asocia una ficha equivocada.

**Próximos estrenos**: lee la zona «Próximamente» publicada por Sucre, y las fechas de estreno futuras cuando puedan verificarse en el listado. Se conserva separada la sección de los próximos estrenos generales en España de TMDB. No se confirma programación futura de una sala cuando ésta no la publica en una fuente legible.

Se incluyen `api/cinema-posters.js`, `api/cinemas.js` y las API existentes. En despliegues por GitHub o Vercel, sube el contenido completo del ZIP, incluyendo la carpeta `api/`.

## Limitaciones

Los listados de salas externas pueden cambiar o bloquear peticiones desde Vercel. TMDB puede no reconocer una película bajo el título empleado por la sala. En esos casos se muestra un enlace a la programación o un cartel de reserva, nunca un falso estreno o una sesión inventada. La conexión con los proveedores reales no ha podido probarse en este entorno sin tus credenciales de producción.

## Pruebas

`npm test` comprueba búsqueda de sesión con filtro TMDB, separado de disponibilidad local, extracción de estrenos próximos de Sucre, exclusión de encabezados de OCINE y asociación conservadora de pósteres.
