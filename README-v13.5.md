# Poppy v13.5 — Filmografías

- Consulta primero `/person/{id}/movie_credits` en TMDB para obtener películas sin depender de la biografía.
- La biografía es opcional, y si el ID da problemas se intenta resolver por nombre.
- La filmografía de un director filtra los créditos con función Director.
- Mensajes de error técnicos más precisos.
- Prueba específica automatizada con Christopher Nolan (TMDB #525), incluida en `tests/people.test.js`.

No requiere cambios SQL, claves ni tablas nuevas. Subir estos archivos al mismo proyecto Vercel.
