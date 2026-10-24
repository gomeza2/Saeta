# Arquitectura propuesta

## Principios

1. **Interfaz separada de los proveedores.** Los componentes consumen servicios y modelos internos; no llaman APIs de transporte directamente.
2. **Fuentes intercambiables.** Cada proveedor se integra mediante un adaptador con tipos normalizados.
3. **Transparencia de datos.** Las entidades deben conservar procedencia, fecha de actualización, frescura y condición de dato real o de demostración cuando corresponda.
4. **Sin secretos en el cliente.** Las credenciales privadas y las integraciones que las requieran permanecerán en un backend.
5. **Cambios incrementales.** Cada fase debe compilarse y probarse antes de iniciar la siguiente.
6. **Primero web adaptable.** La lógica de dominio se mantendrá separada de la presentación para facilitar una futura app móvil.

## Capas previstas

- src/app/: composición de la aplicación y navegación.
- src/components/: componentes visuales compartidos y accesibles.
- src/features/map/: mapa, controles cartográficos y selección geográfica.
- src/features/stops/: paradas, detalles y líneas que las atienden.
- src/features/routes/: líneas, ramales, sentidos y geometrías.
- src/features/trip-planner/: origen, destino, alternativas, caminatas y transbordos.
- src/features/arrivals/: horarios, predicciones y frescura de datos.
- src/features/alerts/: avisos verificados, desvíos e interrupciones.
- src/features/favorites/: preferencias locales y favoritos.
- src/features/card/: futura experiencia de tarjeta, condicionada a integraciones autorizadas.
- src/services/: contratos, adaptadores y normalización.
- src/config/: configuración pública.
- src/test/: utilidades comunes de pruebas.

Las carpetas de funcionalidades se crearán al iniciar cada fase, en lugar de mantener directorios vacíos sin implementación.

## Mapas y geolocalización

La decisión de proveedor se tomará en la fase 3, evaluando cobertura, accesibilidad, disponibilidad de tiles, límites de uso, atribución, coste y comportamiento en dispositivos modestos. Leaflet con fuentes cartográficas compatibles es una alternativa inicial, no una decisión cerrada. La geolocalización solo se solicitará después de una acción clara del usuario; denegarla no deberá impedir usar la aplicación.

## Transporte y adaptadores

Los contratos de datos se definirán a partir de fuentes verificadas, no de endpoints supuestos. Se investigarán formatos abiertos como GTFS y GTFS-Realtime en la fase 4. Las muestras de prueba vivirán separadas del adaptador de producción. Ninguna posición, llegada prevista o alerta se considerará real sin una fuente trazable.

## Backend futuro

No se añade backend en la fase 1. Se evaluará cuando sean necesarios secretos de proveedor, caché, agregación de fuentes, límites de solicitudes, autenticación o notificaciones. El cliente no almacenará credenciales privadas ni datos sensibles de tarjetas.

## Flujo de datos objetivo

Vista o componente → servicio de dominio → adaptador → fuente verificada o fixture de prueba.

La interfaz recibirá modelos normalizados y un estado explícito: cargando, disponible, desactualizado, no disponible o error. La procedencia y la fecha de actualización se expondrán cuando sean relevantes para interpretar el dato.
