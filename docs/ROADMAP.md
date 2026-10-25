# Hoja de ruta de SAETA MAPS

Los estados reflejan lo que está implementado y verificado en el repositorio, no una promesa de disponibilidad de transporte. Una fase se considera terminada cuando cumple sus criterios verificables, incluidas las pruebas pertinentes.

| Fase        | Alcance                              | Estado / criterio principal                                                                                                                       |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0           | Auditoría y planificación            | Completada: repositorio auditado y hoja de ruta definida.                                                                                         |
| 1           | Base técnica profesional             | Integrada en main: TypeScript, lint, formato, pruebas y build.                                                                                    |
| 2           | Diseño del producto y experiencia    | Integrada en main: navegación, formularios transparentes, estados accesibles y diseño adaptable.                                                  |
| 3           | Mapa y geolocalización               | Integrada en main: cartografía base interactiva; ubicación solo por acción explícita.                                                             |
| 4           | Investigación de datos de SAETA      | Auditoría documentada; falta confirmar feed reutilizable y licencia con los responsables.                                                         |
| 5           | Preparación e inspección de GTFS     | Inspector local incorporado: parseo CSV, conteos, referencias, coordenadas, fechas y secuencias básicas. No conecta ni activa feeds.              |
| 6           | Vista previa local                   | Integrada mediante PR #6; CI y publicación aprobados para 43d1e68.                                                                                |
| 7           | Exploración y búsqueda integrada     | Integrada mediante PR #7; búsqueda conjunta, detalles y mapa opcional con CI y publicación aprobados.                                             |
| 8           | Planificación sobre GTFS importado   | Integrada mediante PR #8 con CI aprobado: viajes directos, calendarios y horarios publicados; sin estimaciones.                                   |
| 9           | Mapa y experiencia visual            | Integrada mediante PR #9 con CI y publicación aprobados: capas, agrupación, teclado, detalle y reintento.                                         |
| 10          | Móvil, accesibilidad y rendimiento   | Integrada mediante PR #10 con CI aprobado: Worker, límites de memoria, contraste, foco y controles táctiles. Pruebas desde 320 px; PWA pospuesta. |
| Posteriores | Fuentes reales y servicios avanzados | Fuentes autorizadas, actualización, posiciones recientes verificables, alertas, tarjeta/saldo/recargas y seguridad. Nunca simular operaciones.    |

## Criterios globales

- `typecheck`, `lint`, `format:check`, `test` y `build` deben pasar en el entorno de verificación.
- No incluir secretos en el repositorio.
- Identificar procedencia y condición real/demo de los datos.
- Documentar fallos y limitaciones en lugar de ocultarlos.
- Un informe GTFS sin errores estructurales no confirma su exactitud, vigencia, licencia ni autorización.
- Distinguir la vista previa privada de archivos locales de una fuente conectada. Una integración pública requiere verificar procedencia y condiciones de reutilización.
- Actualizar esta hoja de ruta en cada fase.
