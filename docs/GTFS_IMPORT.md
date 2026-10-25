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
