# Hoja de ruta de SAETA MAPS

Los estados reflejan lo que está implementado y verificado en el repositorio, no una promesa de disponibilidad de transporte. Una fase se considera terminada cuando cumple sus criterios verificables, incluidas las pruebas pertinentes.

| Fase | Alcance                           | Estado / criterio principal                                                                                                          |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | Auditoría y planificación         | Completada: repositorio auditado y hoja de ruta definida.                                                                            |
| 1    | Base técnica profesional          | Integrada en main: TypeScript, lint, formato, pruebas y build.                                                                       |
| 2    | Diseño del producto y experiencia | Integrada en main: navegación, formularios transparentes, estados accesibles y diseño adaptable.                                     |
| 3    | Mapa y geolocalización            | Integrada en main: cartografía base interactiva; ubicación solo por acción explícita.                                                |
| 4    | Investigación de datos de SAETA   | Auditoría documentada; falta confirmar feed reutilizable y licencia con los responsables.                                            |
| 5    | Preparación e inspección de GTFS  | Inspector local incorporado: parseo CSV, conteos, referencias, coordenadas, fechas y secuencias básicas. No conecta ni activa feeds. |
| 6    | Búsqueda y planificación          | Pendiente de catálogo de transporte verificable; itinerarios comprobables, caminatas y transbordos.                                  |
| 7    | GPS y seguimiento                 | Condicionada a una fuente autorizada, válida y reciente.                                                                             |
| 8    | Horarios y llegadas               | Condicionada a datos suficientes; distinguir horario publicado de predicción.                                                        |
| 9    | Alertas y accesibilidad           | Pendiente: avisos verificables y pruebas de accesibilidad.                                                                           |
| 10   | Tarjeta, saldo y recargas         | Condicionada a autorización e integración; nunca simular acreditaciones.                                                             |
| 11   | Backend y seguridad               | Evaluar según necesidades reales de integración; no añadir servicios innecesarios.                                                   |
| 12   | Rendimiento y confiabilidad       | Pendiente: medir antes de optimizar; probar redes lentas y dispositivos modestos.                                                    |
| 13   | PWA y preparación móvil           | Pendiente hasta estabilizar la experiencia web.                                                                                      |
| 14   | Pruebas integrales y lanzamiento  | Pendiente: accesibilidad, seguridad, licencias, build y limitaciones documentadas.                                                   |

## Criterios globales

- `typecheck`, `lint`, `format:check`, `test` y `build` deben pasar en el entorno de verificación.
- No incluir secretos en el repositorio.
- Identificar procedencia y condición real/demo de los datos.
- Documentar fallos y limitaciones en lugar de ocultarlos.
- Un informe GTFS sin errores estructurales no confirma su exactitud, vigencia, licencia ni autorización.
- No activar un conjunto de transporte en la aplicación sin validar sus condiciones de reutilización.
- Actualizar esta hoja de ruta en cada fase.
