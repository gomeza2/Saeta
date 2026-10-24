# Hoja de ruta de SAETA MAPS

Los estados reflejan el repositorio y no una promesa de disponibilidad. Una fase se considera terminada cuando cumple sus criterios verificables, incluidas las pruebas pertinentes.

| Fase | Alcance                           | Estado / criterio principal                                                                                                          |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | Auditoría y planificación         | Completada: repositorio auditado y hoja de ruta definida.                                                                            |
| 1    | Base técnica profesional          | Completada: TypeScript, ESLint, Prettier, pruebas y build pasan en GitHub Actions.                                                   |
| 2    | Diseño del producto y experiencia | Implementada en la rama de fase 2; navegación, formularios honestos, estados accesibles y diseño adaptable. CI aprobado.             |
| 3    | Mapa y geolocalización            | Implementada en la rama de fase 3; mapa interactivo, ubicación por acción explícita y ausencia de datos de transporte declarada. CI verde. |
| 4    | Investigación de datos de SAETA   | Auditoría pública inicial documentada; no se confirmó un feed reutilizable ni licencia. Falta confirmación formal de los responsables. |
| 5    | Líneas, paradas y recorridos      | Pendiente: exploración y selección basadas en datos trazables y autorizados.                                                          |
| 6    | Búsqueda y planificación          | Pendiente: itinerarios comprobables, caminatas y transbordos según datos disponibles.                                                |
| 7    | GPS y seguimiento                 | Condicionada a una fuente autorizada, válida y reciente.                                                                             |
| 8    | Horarios y llegadas               | Condicionada a datos suficientes; distinguir horario publicado de predicción.                                                        |
| 9    | Alertas y accesibilidad           | Pendiente: avisos verificables y pruebas de accesibilidad.                                                                           |
| 10   | Tarjeta, saldo y recargas         | Condicionada a autorización e integración; nunca simular acreditaciones.                                                             |
| 11   | Backend y seguridad               | Se evalúa según necesidades reales de integración.                                                                                   |
| 12   | Rendimiento y confiabilidad       | Pendiente: medir antes de optimizar; probar redes lentas y dispositivos modestos.                                                    |
| 13   | PWA y preparación móvil           | Pendiente hasta estabilizar la experiencia web.                                                                                      |
| 14   | Pruebas integrales y lanzamiento  | Pendiente: accesibilidad, seguridad, licencias, build y limitaciones documentadas.                                                   |

## Criterios globales

- typecheck, lint, format:check, test y build deben pasar en un entorno de verificación.
- No incluir secretos en el repositorio.
- Identificar la procedencia y la condición real/demo de los datos.
- Documentar fallos y limitaciones en lugar de ocultarlos.
- Actualizar esta hoja de ruta en cada fase.
