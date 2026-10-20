# Poppy v14.1 — Sesión perfecta, carteleras locales y estrenos

Se basa en Poppy v14 y conserva las cuentas, películas, puntuaciones, carpetas personalizadas, ficheros de imagen, Duelo y sincronización con Supabase. **No requiere SQL adicional.**

## Cambios

- **Mi sesión perfecta**: selector entre `Mis pendientes` y `Todo el catálogo`, respetando duración, género y plataforma cuando TMDB/JustWatch tienen disponibilidad. Para los pendientes, se da prioridad a los marcados con 🔥. El resultado permanece visible al volver a renderizar Inicio por sincronización u otros cambios, hasta que elijas otra película.
- **Colecciones automáticas**: retiradas de la interfaz y del código. Las carpetas personalizadas se mantienen intactas.
- **Mejor valoradas (1990+)**: filtro de género que se envía a TMDB.
- **En cartelera**: se consulta el listado público de cada establecimiento: OCINE Estepark de Castellón (cartelera semanal de Estepark), Sucre Vila-real (web del cine), Cinesa La Salera (ficha específica de SensaCine). Cada cine muestra sus títulos y un enlace para comprobar la cartelera o los horarios de compra. Si una fuente no puede leerse, se indica y se deja el enlace; no se reemplaza por un listado nacional.
- **Próximos estrenos**: títulos venideros publicados por salas (cuando existen); por separado, películas con estreno en cines de España registrado en TMDB; lanzamientos digitales anunciados en TMDB con tipo de distribución digital; y novedades recientes incluidas por suscripción en Netflix, Prime Video, Disney+ o Crunchyroll según TMDB/JustWatch para España. No se atribuye una película futura a una plataforma concreta sin una fuente que lo confirme. Enlaces a las plataformas oficiales.
- **Actualización**: la cartelera se consulta al abrir Descubrir y se vuelve a comprobar cada hora mientras la sección esté abierta. La respuesta del servidor se cachea hasta 1 hora; no requiere nuevas variables ni tareas programadas.

## Límites conocidos

Las webs de cines pueden cambiar su HTML, bloquear consultas automáticas o publicar horarios con retraso. Esta integración utiliza las fuentes públicas y puede no recuperar todos los títulos. En esos casos muestra las webs de cada cine para consulta directa. La disponibilidad digital de TMDB/JustWatch tampoco garantiza programación futura por plataforma ni inclusión en todos los planes de suscripción. Los estrenos digitales se diferencian explícitamente de la oferta actual de plataformas.

## Pruebas

`npm test` ejecuta pruebas de las funciones existentes, la separación de estrenos españoles de sala/digitales, el filtro de género en el ranking, y parsers con HTML de ejemplo de las tres carteleras. La app no se ha verificado con claves reales de Vercel ni conectando directamente a los tres proveedores en producción. Se mantiene `api/cinemas.js` como nuevo endpoint para los cines.
