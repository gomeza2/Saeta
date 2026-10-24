# SAETA MAPS

SAETA MAPS es una aplicación web independiente en desarrollo para explorar opciones de movilidad urbana en Salta, Argentina. **No es una aplicación oficial de SAETA ni está afiliada a esa organización.**

## Estado del proyecto

Las fases 1 a 4 ya están integradas en `main`.

- **Base técnica:** React, TypeScript, Vite, ESLint, Prettier y Vitest.
- **Interfaz:** navegación por Explorar, Planificar, Guardados e Información.
- **Mapa:** cartografía interactiva con Leaflet y OpenStreetMap, centrada de forma general en Salta.
- **Geolocalización:** solo se solicita después de que la persona pulse la acción correspondiente.
- **Transparencia de datos:** documentación sobre las fuentes revisadas y los límites de integración.

### Qué funciona y qué falta

El mapa base puede mostrar calles reales, pero **todavía no están integrados los datos de transporte de SAETA**. No hay búsquedas reales de líneas/paradas, cálculo real de itinerarios, horarios verificados, posiciones en vivo de colectivos, alertas ni recargas. Los formularios y estados de la interfaz no deben interpretarse como un servicio de transporte operativo.

No se inventan líneas, paradas, horarios ni ubicaciones. La integración de transporte queda pendiente de identificar y validar una fuente oficial o autorizada, junto con sus condiciones de uso, cobertura y frecuencia de actualización. Ver [la auditoría de fuentes](docs/DATA_SOURCE_AUDIT.md).

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

Se necesita conexión a Internet para cargar las teselas del mapa base. La disponibilidad del mapa depende del proveedor cartográfico configurado y de sus condiciones de uso.

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

## Privacidad y uso responsable

La ubicación del dispositivo solo se solicita mediante una acción explícita. La aplicación no debe presentar la geolocalización como posición de un colectivo ni sugerir que hay seguimiento en tiempo real sin una fuente verificada.

## Estado

Proyecto en desarrollo. La presencia del código en GitHub no implica que exista una versión pública desplegada. La publicación web y la integración de datos reales son tareas pendientes.
