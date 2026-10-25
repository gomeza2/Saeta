# SAETA MAPS

SAETA MAPS es una aplicación web independiente en desarrollo para explorar opciones de movilidad urbana en Salta, Argentina. **No es una aplicación oficial de SAETA ni está afiliada a esa organización.**

## Estado del proyecto

Las fases 1 a 4 están integradas en `main`. Las fases 6 y 7 permiten explorar líneas, paradas y geometrías importadas. La Fase 8 agrega consultas limitadas de viajes directos con horarios publicados, cuando el conjunto contiene los datos necesarios. La integración y publicación de cada revisión deben comprobarse en GitHub.

- **Base técnica:** React, TypeScript, Vite, ESLint, Prettier y Vitest.
- **Interfaz:** secciones Explorar, Planificar, Guardados, Datos e Información.
- **Mapa:** cartografía interactiva con Leaflet y OpenStreetMap, centrada de forma general en Salta.
- **Geolocalización:** solo se solicita después de una acción explícita.
- **Inspección GTFS:** la pestaña Datos analiza archivos locales, filtra líneas y paradas y permite abrir una vista geográfica explícita.

### Qué funciona y qué falta

El mapa base puede mostrar calles reales y el inspector permite revisar parte de la estructura de un feed GTFS. **Todavía no están integrados los datos de transporte de SAETA**: no hay búsquedas reales de líneas o paradas, cálculo real de itinerarios, horarios verificados, posiciones en vivo, alertas ni recargas. El inspector no es un validador oficial completo. La vista previa geográfica usa únicamente los archivos importados y no conecta una fuente de SAETA.

No se inventan líneas, paradas, horarios ni ubicaciones. Para integrar transporte falta identificar y validar una fuente oficial o autorizada, su licencia, cobertura, vigencia y frecuencia de actualización. Consultá [la auditoría de fuentes](docs/DATA_SOURCE_AUDIT.md) y [la guía del inspector GTFS](docs/GTFS_IMPORT.md).

## Requisitos

- Node.js 22.12.0 o superior.
- npm.

## Instalación y ejecución local

1. Cloná este repositorio y entrá en la carpeta:

   ```bash
   git clone https://github.com/gomeza2/Saeta.git
   cd Saeta
   ```

2. Instalá las dependencias:

   ```bash
   npm install
   ```

3. Copiá `.env.example` a `.env.local`. En Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Iniciá el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abrí en el navegador la dirección local que indique Vite.

Se necesita conexión a Internet para cargar las teselas del mapa base. La disponibilidad del mapa depende del proveedor cartográfico configurado y sus condiciones de uso.

## Comprobaciones

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Para servir localmente la compilación generada:

```bash
npm run preview
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Hoja de ruta](docs/ROADMAP.md)
- [Auditoría de fuentes de transporte](docs/DATA_SOURCE_AUDIT.md)
- [Inspección local de archivos GTFS](docs/GTFS_IMPORT.md)

## Privacidad y uso responsable

Los archivos GTFS elegidos en la pestaña Datos se leen en la pestaña del navegador y no se suben a un servidor ni se guardan de forma persistente. La vista geográfica local es opcional y se elimina al limpiar o reemplazar la importación. La geolocalización del dispositivo solo se solicita mediante una acción explícita. La aplicación no debe presentar la ubicación del usuario como posición de un colectivo ni sugerir seguimiento en tiempo real sin una fuente verificada.

## Publicación

La publicación web mediante GitHub Pages está configurada por un flujo de GitHub Actions. El despliegue real debe comprobarse en la pestaña Actions y en Settings → Pages; no se debe considerar publicado solo porque exista un workflow en el repositorio.
