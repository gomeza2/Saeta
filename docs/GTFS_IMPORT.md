# Inspección local de archivos GTFS

**Fase:** 5 — preparación y revisión de datos  
**Estado:** herramienta incorporada; integración de datos reales todavía pendiente.

## Qué hace

La pestaña **Datos** permite seleccionar un conjunto de archivos de texto GTFS Schedule que la persona ya tenga descargado y revisar algunas reglas estructurales básicas. La lectura se hace en el navegador con `File.text()`: los archivos no se cargan a un servidor, no se escriben en el almacenamiento persistente de la aplicación y no se dibujan en el mapa.

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
5. Revisá los errores y corregí el conjunto en su origen antes de volver a inspeccionarlo.

Los datos de prueba incluidos en los tests son sintéticos y solo se usan para comprobar el código; no representan líneas, paradas, horarios ni servicios reales de SAETA.

## Límites importantes

Este es un inspector inicial, **no un validador oficial completo de GTFS**. No comprueba todas las reglas del estándar, todos los archivos opcionales, geometrías completas, coherencia operacional, actualidad del feed, disponibilidad real del servicio, exactitud del contenido, licencias ni autorización de reutilización. Un resultado sin errores solamente significa que pasó las comprobaciones implementadas.

Subir un archivo en esta pantalla no configura una fuente, no modifica el mapa, no activa búsquedas, no publica datos y no conecta un backend. Para integrar un feed debe existir una decisión explícita de producto tras verificar procedencia, licencia, cobertura, vigencia y método de actualización. La auditoría preliminar está en [DATA_SOURCE_AUDIT.md](./DATA_SOURCE_AUDIT.md).

## Verificación de desarrollo

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test`
- `npm run build`

La suite de `src/data/gtfs.test.ts` cubre parsing CSV con comillas, errores de cantidad de columnas, campos no cerrados, un conjunto de prueba coherente, referencias rotas y límites del informe.
