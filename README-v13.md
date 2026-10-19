# Poppy v13

Novedades:
- Cita a ciegas: pistas de género, año y sinopsis TMDB, revelación opcional y siguiente propuesta.
- Filmografías: acceso desde actores y directores en fichas a créditos de TMDB.
- Pendientes: indicador de prioridad y ordenación por prioritarias. Se guarda con cada registro en Supabase.
- Duelo en pareja: dos selecciones de la misma lista de pendientes y sorteo entre coincidencias (o unión si no las hay).
- Buscador universal: catálogo TMDB, películas propias y nombres de colecciones.
- Animaciones suaves, desactivadas en preferencias de movimiento reducido.

No necesita cambios SQL. La filmografía y la búsqueda en vivo requieren TMDB_READ_TOKEN configurado. El modo pareja es de selección compartida en el mismo dispositivo; no es un modo multicuenta.

Para desplegar, subir el contenido de esta carpeta a Vercel o GitHub del proyecto. Pruebas: `npm test`.
