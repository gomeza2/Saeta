# Inspección local de archivos GTFS

**Fase:** 6 — inspección y vista previa local

**Estado:** herramienta incorporada; integración de datos reales todavía pendiente.

## Qué hace

La pestaña **Datos** permite seleccionar un conjunto de archivos de texto GTFS Schedule que la persona ya tenga descargado y revisar algunas reglas estructurales básicas. La lectura se hace en el navegador con `File.text()`: los archivos no se cargan a un servidor, no se escriben en el almacenamiento persistente de la aplicación y se representan en un mapa solo al pulsar **Mostrar vista geográfica**. El proveedor de teselas recibe solicitudes de las áreas visibles, no los archivos ni los nombres importados.

El inspector revisa, entre otros:

- Presencia de archivos base como `agency.txt`, `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt` y al menos uno de `calendar.txt` o `calendar_dates.txt`.
- Cabeceras requeridas, columnas inconsistentes y errores comunes de CSV, incluidos BOM UTF-8, comillas escapadas y saltos CRLF.
- Identificadores repetidos, referencias entre rutas, viajes, servicios y paradas.
- Coordenadas y rangos de fechas con formato básico válido.
- Secuencias de parada por viaje, tipo de ruta y formato de horas GTFS que pueden superar las 24 horas.
- Un resumen de conteos y una lista limitada de incidencias para mantener legible la interfaz.

## Uso

1. Obtén un feed GTFS de una fuente cuya procedencia puedas verificar.
2. Descomprimí el ZIP fuera de la aplicación.
3. Abrí **Datos → Revisar un conjunto GTFS**.
4. Seleccioná los archivos `.txt` correspondientes. El límite actual es 60 MB por selección.
5. Revisá el informe. La vista previa puede mostrar registros no ambiguos de un conjunto con errores; no acredita que el feed sea apto para operar.
6. Filtrá líneas y paradas por identificador o nombre. Seleccioná una línea para consultar sus paradas relacionadas mediante `trips.txt` y `stop_times.txt`.
7. Abrí la vista geográfica si querés representar las paradas con coordenadas válidas. Una geometría requiere puntos válidos y secuencias únicas en `shapes.txt`, más una referencia `trips.shape_id` a una ruta existente. Una geometría con cualquier punto inválido se excluye por completo. Nunca se unen paradas para inventar el recorrido.
8. Usá **Limpiar importación** para eliminar resultados, filtros y capas. Elegir otro conjunto reemplaza el anterior, incluso si falla su lectura. Se ignoran las lecturas antiguas que terminan después de reemplazar o limpiar.

Las listas se paginan de a 50 resultados. El mapa dibuja hasta 2000 paradas del filtro actual y geometrías completas dentro de un presupuesto de 100 000 puntos; acotá la selección para revisar conjuntos grandes. Las relaciones por ruta son una unión de paradas de sus viajes, no un orden único ni un itinerario. Las geometrías de la ruta seleccionada se mantienen aunque se filtre el nombre de una parada.

La importación se conserva en memoria al cambiar de pestaña de la aplicación; desaparece al limpiar, recargar o cerrar. No se usan almacenamiento persistente, backend ni consultas remotas de transporte.

Los datos de prueba incluidos en los tests son sintéticos y solo se usan para comprobar el código; no representan líneas, paradas, horarios ni servicios reales de SAETA.

## Límites importantes

Este es un inspector inicial, **no un validador oficial completo de GTFS**. No comprueba todas las reglas del estándar, todos los archivos opcionales, todas las reglas de geometrías, coherencia operacional, actualidad del feed, disponibilidad real del servicio, exactitud del contenido, licencias ni autorización de reutilización. Un resultado sin errores solamente significa que pasó las comprobaciones implementadas.

Seleccionar archivos no configura una fuente, no publica datos y no conecta un backend. Los filtros y las capas opcionales operan solo sobre el conjunto local. Para integrar un feed debe existir una decisión explícita de producto tras verificar procedencia, licencia, cobertura, vigencia y método de actualización. La auditoría preliminar está en [DATA_SOURCE_AUDIT.md](./DATA_SOURCE_AUDIT.md).

## Verificación de desarrollo

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test`
- `npm run build`

Las suites de `src/data/gtfs.test.ts`, `src/data/gtfsPreview.test.ts` y `src/components/GtfsInspector.test.tsx` cubren parsing CSV con comillas, errores de cantidad de columnas, campos no cerrados, un conjunto de prueba coherente, referencias rotas límites del informe, calendarios solo de excepciones, agencias opcionales, filtros, relaciones, limpieza, carreras de lectura y exclusión de geometrías inválidas. Las pruebas de mapa verifican capas y texto seguro en popups.

## Exploración del conjunto local (Fase 7)

Después de importar, abrí **Explorar**. La búsqueda filtra conjuntamente identificadores y nombres de líneas y paradas, con resultados paginados. Cada resultado abre su detalle. Las líneas muestran sus paradas relacionadas; las paradas muestran las coordenadas válidas disponibles. La selección puede abrirse en el mapa local mediante un botón explícito. Si no hay resultados o relaciones, se explica qué falta.

Se comparte la estructura ya procesada en memoria: cambiar de pestaña o buscar no vuelve a leer ni parsear los archivos. Limpiar o reemplazar desde Datos elimina también el catálogo explorado y sus capas. No existe búsqueda remota ni fuente oficial conectada.

## Horarios publicados del conjunto local (Fase 8)

**Planificar** consulta viajes directos únicamente si el conjunto permite procesar una zona horaria de agencia única, calendarios válidos, viajes, paradas y horas explícitas de llegada/salida. Elegí origen y destino por sus IDs y la fecha de servicio del feed. Se respetan días semanales y excepciones de altas/bajas; las horas superiores a 24:00 pertenecen a esa fecha de servicio.

Se excluyen viajes con IDs ambiguos, referencias rotas, secuencias repetidas, horas ausentes o regresivas y plantillas de `frequencies.txt`. Los puntos de ascenso/descenso que requieren llamada, coordinación o están prohibidos no se ofrecen como extremos normales. No se interpola ni se calculan esperas, caminatas o transbordos. Si no hay datos suficientes o coincidencias, se explica sin inventar alternativas.

Los resultados son horarios publicados en los archivos, no predicciones ni confirmaciones de que el servicio exista o esté vigente. Se muestran hasta 20 viajes, ordenados por salida, junto al conteo total. Cambiar los campos descarta el resultado anterior y reemplazar o limpiar la importación elimina los horarios procesados. Los tests usan únicamente conjuntos sintéticos.

## Límites y procesamiento en segundo plano (Fase 10)

En navegadores compatibles, la lectura, el CSV, la inspección y la preparación del catálogo/horarios se ejecutan en un Web Worker local. Limpiar, reemplazar o desmontar el inspector termina el proceso anterior; no puede restaurar resultados viejos. No se transmite el contenido a ningún servidor. En navegadores sin Workers se mantiene un procesamiento local compatible, que puede bloquear la interfaz durante el análisis.

Se permiten hasta 60 MB por selección, 100 000 filas por archivo, 256 columnas por registro y 1 000 000 de caracteres por campo. Superar un límite rechaza la tabla completa: no se presenta un feed truncado como si fuese completo. Sus filas no se incluyen en los conteos inspeccionados y el informe explica la causa. Los filtros y la vista geográfica mantienen sus propios límites de resultados.

Solo se retienen las primeras 50 incidencias y errores de CSV para representación, conservando sus conteos totales. Las tablas se parsean una vez por importación y las relaciones usan conjuntos de identificadores para evitar búsquedas repetidas. Estos límites no sustituyen la medición en dispositivos reales ni convierten al inspector en un validador completo.
