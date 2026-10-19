# Poppy v12

- Sagas completas consultando la colección TMDB desde la ficha; estados Vista/Pendiente y añadir las restantes.
- Películas similares desde TMDB; excluye títulos ya guardados, pendientes, vistos y descartados.
- Recomendaciones Inicio con ponderación por géneros y, cuando están disponibles, coincidencias de directores y reparto de películas puntuadas.
- Cabeceras panorámicas en las fichas cuando TMDB tiene backdrop.
- Se elimina la edición de reseñas (las antiguas notas se conservan en Supabase y backups).
- Navegación móvil sin desplazamiento horizontal: seis apartados en una fila y Ajustes como engranaje; filtros visibles y botones de propuesta de hoy en disposición compacta.
- No se requiere migración SQL.

Verificación: sintaxis JavaScript y pruebas anteriores. Pendiente comprobación visual en iPhone real y APIs de producción.
