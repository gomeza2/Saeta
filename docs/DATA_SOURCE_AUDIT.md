# Auditoría de fuentes de datos de transporte — Fase 4

**Fecha de revisión:** 24 de octubre de 2026  
**Proyecto:** SAETA MAPS, proyecto independiente y no oficial.  
**Alcance:** páginas y catálogos públicos accesibles durante esta revisión. No se probaron credenciales, endpoints privados ni servicios internos.

## Resultado ejecutivo

En las páginas públicas revisadas se confirmó que SAETA publica información para pasajeros sobre corredores, mapas de paradas y horarios, y que su planificador presenta líneas, combinaciones y horarios estimativos. Sin embargo, **no se pudo verificar una descarga pública actual de GTFS, un endpoint API documentado para reutilización externa ni una licencia/permisión explícita que autorice a SAETA MAPS a consumir esos datos**.

Por eso, esta fase no incorpora líneas, paradas, horarios, ubicaciones de vehículos ni alertas inventadas. La cartografía base de la fase 3 continúa siendo independiente de los datos de transporte. La ausencia de un feed confirmado en esta revisión no demuestra que no exista por canales no identificados; deja la integración pendiente de confirmación con los responsables.

## Registro de fuentes revisadas

| Fuente | Evidencia pública observada | Evaluación para integración |
| --- | --- | --- |
| [Sitio oficial de SAETA](https://saetasalta.ar/) | Publica el acceso a **Corredores**, descrito como mapas, paradas y horarios; también enlaza el planificador de viaje y SAETA APP. | Fuente oficial útil para consulta humana. En la página revisada no se identificó una descarga de datos crudos ni una especificación de API para terceros. |
| [Preguntas frecuentes de SAETA](https://saetasalta.com.ar/saetaw/faq) | Explica que el planificador ofrece líneas, paradas, transbordos, horarios estimativos y una ruta recomendada. Indica que las paradas se muestran en los mapas de los corredores. | Confirma que la información existe en la experiencia oficial para pasajeros, no que pueda reutilizarse técnicamente. |
| [Información institucional de SAETA](https://saetasalta.ar/web/empresa) | Describe la integración de recorridos urbanos y metropolitanos con Google Maps y señala que SAETA APP permite consultar posiciones de coches en tiempo real. | La función de tiempo real dentro de una app oficial no demuestra que haya un feed abierto o una API autorizada para aplicaciones independientes. |
| [Portal provincial de datos abiertos](https://datospublicos.salta.gob.ar/dataset) | La página consultada durante esta revisión devolvió que no se encontraron resultados. El portal utiliza contenido dinámico, por lo que la observación puede depender de la búsqueda o del estado del catálogo. | No se confirmó un dataset de transporte reutilizable desde esta consulta. No debe interpretarse como prueba de inexistencia de datos por cualquier otra vía. |
| [Catálogo de datos abiertos de IDEMSa](https://idemsa.municipalidadsalta.gob.ar/datos-abiertos.php) | El catálogo contempla exportaciones por capa en CSV, GeoJSON y KML, pero la vista pública consultada no permitió identificar con certeza una capa de líneas/paradas de SAETA ni confirmar su licencia. | Pista para seguimiento con el municipio; hace falta identificar la capa exacta, su fecha, cobertura, licencia y responsable. |
| [Índice histórico de datos de transporte de Salta](https://ar-cities.survey.okfn.org/entry/salta/transport.html) | Una ficha histórica, modificada en 2018, menciona un portal municipal de recorridos y formatos CSV/GML, con licencia desconocida. | Pista antigua, no evidencia de disponibilidad actual ni autorización para reutilización. Requiere verificación directa antes de usarla. |

## Diferencia entre web pública y fuente integrable

Ver un mapa, una tabla o una consulta de rutas en una web no equivale a disponer de un dataset publicado para reutilización. Antes de crear un adaptador de producción se necesita una fuente descargable o API documentada, un responsable identificable, condiciones de uso claras y una forma de comprobar la actualización de los datos.

Se toman como formatos candidatos, no como formatos que ya se hayan encontrado para SAETA:

- **GTFS Schedule:** datos estructurados de agencias, líneas, viajes, paradas, secuencias y horarios publicados. Referencia oficial: [GTFS Schedule](https://gtfs.org/documentation/overview/).
- **GTFS Realtime:** actualizaciones de viajes, alertas de servicio y posiciones de vehículos. Referencia oficial: [GTFS Realtime](https://gtfs.org/es/documentation/realtime/reference/).

No se debe etiquetar una llegada como “en tiempo real” solo porque exista un horario publicado, ni asumir que un vehículo está puntual cuando no hay actualización de tiempo real.

## Qué falta confirmar con los responsables

Antes de marcar una fuente como apta para producción, registrar y verificar:

1. **Responsable y autorización:** organismo/operador titular, contacto técnico, términos de uso y licencia explícita que permita la reutilización prevista.
2. **Acceso y formato:** URL permanente de descarga o API documentada; si requiere credenciales, proceso de solicitud y condiciones para aplicaciones de terceros.
3. **Cobertura y contenido:** área servida, líneas/ramales, sentidos, paradas con coordenadas, geometrías, calendario y horarios; identificar los elementos ausentes.
4. **Vigencia:** fecha/hora de generación, frecuencia de actualización, zona horaria, política de versiones y contacto para reportar datos obsoletos.
5. **Tiempo real, por separado:** fuente de posiciones, actualizaciones de viaje y alertas; frecuencia de actualización, identificadores que vinculen esos datos con el horario publicado y nivel de disponibilidad esperado.
6. **Calidad y atribución:** sistema de coordenadas, campos obligatorios, restricciones de caché, requisitos de atribución y límites de uso.

## Procedimiento recomendado

1. Solicitar formalmente a SAETA y, según corresponda, a AMT y al municipio un enlace de datos públicos o documentación técnica y las condiciones escritas de reutilización.
2. Revisar los catálogos oficiales de nuevo cuando se reciba una pista concreta, registrando URL, fecha de consulta, responsable, licencia y archivos efectivamente descargados.
3. Validar el conjunto recibido (estructura, coordenadas, duplicados, cobertura, fechas y consistencia entre líneas, viajes y paradas) antes de dibujarlo en el mapa.
4. Mantener fixtures de prueba separados de los datos productivos. Cada fixture debe estar rotulado como demostración y nunca debe presentarse como información actual de SAETA.
5. Implementar adaptadores solo después de confirmar formato, autorización y estrategia de actualización.

No se recomienda hacer scraping masivo de páginas, reconstruir manualmente recorridos desde imágenes, asumir endpoints internos ni inspeccionar/reutilizar servicios privados de una aplicación oficial como sustituto de una autorización.

## Decisión de esta fase

**Estado: auditoría pública inicial documentada; integración de transporte aún bloqueada por falta de una fuente reutilizable verificada.**

La fase 5 (líneas, paradas y geometrías) puede comenzar cuando exista una fuente verificable o un conjunto de datos autorizado. Hasta entonces, SAETA MAPS debe seguir mostrando con claridad que el mapa base no contiene datos oficiales de transporte conectados.

## Criterios para cerrar la auditoría completa

- [ ] Contacto o fuente oficial que confirme el mecanismo de acceso.
- [ ] Licencia/permiso documentado para la aplicación.
- [ ] Muestra descargable o respuesta de API comprobada.
- [ ] Cobertura, vigencia, campos y frecuencia de actualización evaluados.
- [ ] Decisión documentada sobre si procede GTFS estático, GTFS Realtime u otro formato.
