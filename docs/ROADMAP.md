# Hoja de ruta de SAETA MAPS

Los estados reflejan lo que está implementado y verificado en el repositorio, no una promesa de disponibilidad de transporte. Una fase se considera terminada cuando cumple sus criterios verificables, incluidas las pruebas pertinentes.

| Fase        | Alcance                              | Estado / criterio principal                                                                                                                    |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0           | Auditoría y planificación            | Completada: repositorio auditado y hoja de ruta definida.                                                                                      |
| 1           | Base técnica profesional             | Integrada en main: TypeScript, lint, formato, pruebas y build.                                                                                 |
| 2           | Diseño del producto y experiencia    | Integrada en main: navegación, formularios transparentes, estados accesibles y diseño adaptable.                                               |
| 3           | Mapa y geolocalización               | Integrada en main: cartografía base interactiva; ubicación solo por acción explícita.                                                          |
| 4           | Investigación de datos de SAETA      | Auditoría documentada; falta confirmar feed reutilizable y licencia con los responsables.                                                      |
| 5           | Preparación e inspección de GTFS     | Inspector local incorporado: parseo CSV, conteos, referencias, coordenadas, fechas y secuencias básicas. No conecta ni activa feeds.           |
| 6           | Vista previa local                   | Implementada en rama: líneas, paradas, filtros, relaciones, capas opcionales y limpieza. Fusión y CI remotos pendientes de confirmar.          |
| 7           | Exploración y búsqueda integrada     | Pendiente de aprobación y fusión de la Fase 6; reutilizar los datos procesados de la importación.                                              |
| 8           | Planificación sobre GTFS importado   | Condicionada a viajes, servicios y horarios suficientes. Sin caminatas, esperas o transbordos inventados.                                      |
| 9           | Mapa y experiencia visual            | Mejoras progresivas de capas, selección, teselas y rendimiento.                                                                                |
| 10          | Móvil, accesibilidad y rendimiento   | Pruebas desde 320 px y controles accesibles; PWA solo con comportamiento comprobado.                                                           |
| Posteriores | Fuentes reales y servicios avanzados | Fuentes autorizadas, actualización, posiciones recientes verificables, alertas, tarjeta/saldo/recargas y seguridad. Nunca simular operaciones. |

## Criterios globales

- `typecheck`, `lint`, `format:check`, `test` y `build` deben pasar en el entorno de verificación.
- No incluir secretos en el repositorio.
- Identificar procedencia y condición real/demo de los datos.
- Documentar fallos y limitaciones en lugar de ocultarlos.
- Un informe GTFS sin errores estructurales no confirma su exactitud, vigencia, licencia ni autorización.
- Distinguir la vista previa privada de archivos locales de una fuente conectada. Una integración pública requiere verificar procedencia y condiciones de reutilización.
- Actualizar esta hoja de ruta en cada fase.
