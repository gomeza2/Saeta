# Arquitectura propuesta

## Principios

1. **Interfaz separada de los proveedores.** Los componentes consumen servicios y modelos internos; no llaman APIs de transporte directamente.
2. **Fuentes intercambiables.** Cada proveedor se integra mediante un adaptador con tipos normalizados.
3. **Transparencia de datos.** Las entidades deben conservar procedencia, fecha de actualización, frescura y condición de dato real o de demostración cuando corresponda.
4. **Sin secretos en el cliente.** Las credenciales privadas y las integraciones que las requieran permanecerán en un backend.
5. **Cambios incrementales.** Cada fase debe compilarse y probarse antes de iniciar la siguiente.
6. **Primero web adaptable.** La lógica de dominio se mantendrá separada de la presentación para facilitar una futura app móvil.

## Organización actual

- `src/App.tsx`: estado de navegación y composición de la experiencia principal.
- `src/components/PrimaryNavigation.tsx`: navegación accesible entre vistas.
- `src/components/StateNotice.tsx`: avisos accesibles para estados de carga, error y funciones aún no disponibles.
- `src/components/MapPreview.tsx`: mapa interactivo con Leaflet, teselas configurables y geolocalización opcional bajo acción explícita.
- `src/components/TransportStatus.tsx`: estado visible de las integraciones pendientes; no contiene datos de vehículos.
- `src/config/`: configuración pública de la aplicación, incluida la URL configurable de teselas.
- `src/test/`: configuración compartida para pruebas.
- `src/App.test.tsx`: pruebas de transparencia, navegación y formularios.
- `docs/DATA_SOURCE_AUDIT.md`: inventario de fuentes públicas revisadas, limitaciones y requisitos de autorización para integrar transporte.

Las futuras funcionalidades se incorporarán en capas independientes a medida que se definan sus fuentes y contratos. No se crean servicios vacíos ni carpetas sin implementación.

## Capas previstas

- `src/features/map/`: mapa, controles cartográficos y selección geográfica.
- `src/features/stops/`: paradas, detalles y líneas que las atienden.
- `src/features/routes/`: líneas, ramales, sentidos y geometrías.
- `src/features/trip-planner/`: origen, destino, alternativas, caminatas y transbordos.
- `src/features/arrivals/`: horarios, predicciones y frescura de datos.
- `src/features/alerts/`: avisos verificados, desvíos e interrupciones.
- `src/features/favorites/`: preferencias locales y favoritos.
- `src/features/card/`: futura experiencia de tarjeta, condicionada a integraciones autorizadas.
- `src/services/`: contratos, adaptadores y normalización.

## Mapas y geolocalización

Leaflet es la biblioteca de mapa; las teselas base se configuran con `VITE_MAP_TILE_URL`. La configuración de ejemplo usa el servicio estándar de OpenStreetMap, que exige atribución visible, uso moderado y respeto de caché, y no permite descargas masivas ni mapas sin conexión. Antes de un despliegue público se debe revisar el volumen esperado y elegir un proveedor con condiciones adecuadas; el servicio comunitario no ofrece SLA.

El mapa inicia centrado de forma general en Salta y muestra cartografía base real, pero no incluye líneas, paradas ni vehículos de SAETA. La ubicación personal se solicita solo cuando el usuario pulsa el botón; se muestra localmente y no se guarda en la app ni se envía a un servicio de transporte. Si se deniega el permiso, el mapa sigue disponible.

## Transporte y adaptadores

La auditoría pública inicial quedó registrada en `docs/DATA_SOURCE_AUDIT.md`. En las páginas públicas revisadas se pudo confirmar que SAETA ofrece mapas de corredores, información de paradas, horarios estimativos y planificación de viajes para pasajeros, pero no se confirmó un feed GTFS actual, una API pública documentada ni condiciones de reutilización para una aplicación independiente. Esta conclusión describe lo verificado en la revisión, no demuestra que no existan vías de acceso mediante solicitud formal.

GTFS Schedule y GTFS Realtime son formatos candidatos para evaluar si una fuente autorizada los ofrece; no se presume que SAETA los publique. La integración deberá mantener separados los horarios publicados, las predicciones y las posiciones en tiempo real. Las muestras de prueba vivirán separadas del adaptador de producción y se rotularán como demostración. Ninguna posición, llegada prevista o alerta se considerará real sin una fuente trazable y vigente.

La interfaz actual no consulta servicios externos. Los formularios solo explican el estado de la integración y no generan rutas ficticias ni envían a un servidor los valores introducidos.

## Backend futuro

No se añade backend en la fase 2. Se evaluará cuando sean necesarios secretos de proveedor, caché, agregación de fuentes, límites de solicitudes, autenticación o notificaciones. El cliente no almacenará credenciales privadas ni datos sensibles de tarjetas.

## Flujo de datos objetivo

Vista o componente → servicio de dominio → adaptador → fuente verificada o fixture de prueba.

La interfaz recibirá modelos normalizados y un estado explícito: cargando, disponible, desactualizado, no disponible o error. La procedencia y la fecha de actualización se expondrán cuando sean relevantes para interpretar el dato.
