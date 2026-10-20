# Poppy v13.6 — Filmografías

Se corrige el error HTTP 404 al pulsar fotografías de actores o directores. El atributo `data-person` aparecía tanto en el botón como en la imagen. La imagen tenía un valor vacío, que se convertía en el ID `0`, y TMDB respondía HTTP 404 al recibir `/person/0/movie_credits`.

La fotografía ahora lleva `data-person-photo` solo para gestionar errores de imagen. El clic se resuelve exclusivamente con el botón `button[data-person]`, validando que el ID sea positivo antes de consultar TMDB. Incluye nuevas pruebas específicas de la generación de fichas de Christopher Nolan y Anya Taylor-Joy.

No hay cambios de esquema SQL, configuración de Supabase ni credenciales.
