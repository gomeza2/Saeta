# Mapa y geolocalización — Fase 3

## Implementación

- Leaflet renderiza un mapa interactivo centrado de forma general en Salta.
- La URL de las teselas se configura mediante `VITE_MAP_TILE_URL`; debe ser HTTPS e incluir los placeholders `{z}`, `{x}` e `{y}`.
- El mapa conserva atribución visible a OpenStreetMap.
- No se dibujan rutas, paradas, horarios ni posiciones de colectivos porque todavía no existe una fuente de transporte verificada conectada.
- La geolocalización solo se solicita después de que la persona pulsa «Usar mi ubicación». Si el permiso se deniega o el dispositivo no responde, el mapa sigue disponible.
- La ubicación se muestra en el navegador y la aplicación no la guarda ni la envía a un servicio de transporte.

## Privacidad y límites del proveedor

La carga de teselas implica que el proveedor cartográfico recibe solicitudes para el área visible y puede recibir metadatos de conexión del navegador. Esto se informa en la interfaz. No se debe describir el mapa como privado frente al proveedor.

El valor por defecto usa el servidor comunitario de teselas de OpenStreetMap como configuración inicial. Su política es de mejor esfuerzo, sin SLA; requiere atribución visible, caché respetuosa y prohíbe la descarga masiva y el uso sin conexión. Antes de un lanzamiento público se debe estimar el tráfico, revisar la política vigente y elegir un proveedor con condiciones apropiadas. La biblioteca Leaflet y el proveedor de cartografía son decisiones distintas.

## Criterios de aceptación

- Mapa navegable y adaptable en escritorio y móvil.
- Atribución legible dentro del mapa.
- Ningún permiso de ubicación solicitado al cargar la pantalla.
- Errores de geolocalización comunicados de forma accesible.
- Ningún dato de transporte simulado.
- Typecheck, lint, formato, pruebas y build de producción aprobados por CI.

## Capas importadas y controles (Fase 9)

La vista opcional del conjunto local ofrece controles independientes para paradas y geometrías verificadas. Los marcadores admiten foco y activación con Enter o Espacio, con un panel de detalle y textos de popup tratados como texto, no HTML. Los controles de zoom se presentan en español y la rueda no captura el desplazamiento de la página.

Con más de 200 paradas se agrupan visualmente en celdas de 48 píxeles según el zoom; el ancla de cada grupo es una parada real del archivo, no una posición de vehículo. Activar un grupo acerca la vista. Los filtros permiten separar paradas coincidentes. Se conservan los límites de 2000 paradas y 100 000 puntos completos de geometría por vista.

Los fallos de carga de teselas muestran un mensaje y permiten reintentar sin borrar los datos locales. Un proveedor que devuelva una imagen de denegación con HTTP 200 puede no generar un evento de error en Leaflet: recibir una imagen no acredita cartografía útil. La atribución sigue visible y la ubicación personal continúa solicitándose solo mediante el botón explícito.
