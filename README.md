# Poppy v10

Mejoras:
- Añadir películas a cualquier colección desde su ficha.
- Duelo aleatorio: elegir dos pendientes al azar y enfrentarlas.
- Personalización de carpetas en panel desplegable.
- Sincronización de diseños sin retroceso silencioso al esquema antiguo. Si Supabase no tiene columnas `icon` y `banner`, se muestra un error claro en lugar de fingir que se guardaron en la nube.

**Importante:** ejecuta `poppy-folders.sql` en Supabase → SQL Editor → Run una sola vez si aún no ejecutaste el SQL de la v9. Conserva las carpetas existentes. Después redepliega esta versión e inicia sesión en ambos dispositivos.

Los banners se guardan comprimidos en la tabla `poppy_folders` (no necesitan bucket de Storage).

Pruebas: `npm test`.


## v10.1 — desplegable de carpetas
- El panel «Personalizar carpeta» conserva su estado abierto hasta que lo cierres.
- La sincronización automática no reconstruye el formulario mientras estás eligiendo un emoji o archivo.
- Las imágenes se recortan en el navegador a proporción horizontal 3:1 y se comprimen antes de guardarse.
- Al pulsar «Guardar estilo» se conserva abierto el desplegable.

## v10.2: reparación del guardado de personalización
Se ha corregido la referencia obsoleta de carpetas durante la sincronización: el botón Guardar estilo ahora busca la carpeta vigente por su ID antes de escribir, conserva el editor abierto e informa si la sincronización sigue pendiente o ha fallado. El banner se recorta automáticamente en formato 3:1. Para sincronizar diseños, deben existir las columnas `icon` y `banner` en `public.poppy_folders` (ver `poppy-folders.sql`).
