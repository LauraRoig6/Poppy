# Poppy v14 · Sesiones, sagas y descubrimiento

Versión basada en Poppy v13.6, conservando el diseño, el icono de palomitas, los registros, las carpetas personalizadas, las filmografías, el buscador, el duelo original y la sincronización con Supabase.

## Cambios

1. **Mi sesión perfecta (Inicio)**: selecciona duración, género y, opcionalmente, una de las cuatro plataformas (Netflix, Prime Video, Disney+ y Crunchyroll). Elige entre **Pendientes** y da prioridad a las películas marcadas 🔥. Para una plataforma concreta solo incluye títulos con disponibilidad por suscripción confirmada en España por TMDB/JustWatch.
2. **Sagas**: barra de progreso vista/total, porcentaje y acceso a la siguiente entrega no vista en la ficha.
3. **Radar de estrenos (Inicio)**: consulta a demanda estrenos futuros de los próximos seis meses, ajustando por géneros preferidos y, cuando estén registrados, un actor o director de tus películas muy bien valoradas. La información procede de TMDB y no garantiza programación de cines específicos.
4. **Colecciones automáticas (Colecciones)**: agrupaciones que se calculan a partir de tus registros (mis dieces, terror pendiente, cine de los 90, prioritarias y, cuando existen valoraciones altas, favoritas de un director). No duplican películas ni requieren columnas nuevas.
5. **Acciones rápidas en pósters**: botón de tres puntos para marcar Pendiente, ir a Vista para puntuar, activar prioridad o añadir a una carpeta.
6. **Pendientes por plataforma**: nuevo desplegable que muestra películas con disponibilidad por suscripción confirmada en España; la información puede variar con el tiempo y según el plan.
7. **Conexiones entre películas**: sección dentro de la ficha con motivo explícito cuando hay coincidencias de saga, director, reparto o al menos dos géneros. Conserva la sección de películas similares de TMDB.
8. **Rendimiento**: caché del índice de películas y actualización de metadatos antiguos en segundo plano (máximo ocho al abrir); las consultas de streaming y radar se realizan bajo demanda.

## Cómo desplegar

Sube los archivos del ZIP a tu repositorio de Poppy o despliega la carpeta en Vercel como en las versiones anteriores. **No ejecutes SQL nuevo**; sigue usando tus tablas actuales `poppy_records` y `poppy_folders`. No cambies las claves de Vercel. Se incluye un módulo nuevo: `v14.js`, necesario tanto en navegador como en el endpoint de películas.

La disponibilidad de streaming utiliza las fuentes de **JustWatch vía TMDB**. No significa que una película esté incluida en todos los planes, ni sustituye a la consulta de las plataformas oficiales. Las fichas, estrenos y filmografías requieren que `TMDB_READ_TOKEN` siga configurado en Vercel. Las puntuaciones utilizan tu configuración actual de MDBList.

## Pruebas y límites

`npm test` → 30 pruebas automáticas superadas, entre ellas la detección de plataformas, el endpoint de filtros, las vistas automáticas, los progresos de sagas y las conexiones entre películas. Prueba visual con navegador de escritorio e iPhone simulado sin conexión real a TMDB ni Supabase. **No se ha probado con las credenciales reales del usuario ni con un iPhone físico**; verifica esas integraciones después de desplegar.
