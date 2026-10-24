# SAETA MAPS

SAETA MAPS es un proyecto independiente en desarrollo para ayudar a explorar opciones de movilidad urbana en Salta, Argentina. No es una aplicación oficial de SAETA ni está afiliado a esa organización.

**Estado actual:** Fase 2, diseño interactivo. La navegación y los formularios permiten explorar la interfaz, pero aún no existen búsquedas reales, mapa operativo, recorridos, horarios, posiciones GPS, alertas ni recargas.

## Requisitos

- Node.js 22.12.0 o superior.
- npm incluido con Node.js.

## Instalación y ejecución

1. Cloná el repositorio y entrá en su carpeta.
2. Ejecutá `npm install`.
3. Copiá `.env.example` a `.env.local`.
4. Ejecutá `npm run dev` y abrí en el navegador la dirección que muestre la terminal.

En Windows PowerShell, el paso de copiar el archivo se puede hacer con `Copy-Item .env.example .env.local`.

## Comprobaciones

- `npm run typecheck`: revisa los tipos de TypeScript.
- `npm run lint`: análisis estático del código.
- `npm run format:check`: comprueba el formato.
- `npm run test`: ejecuta las pruebas automatizadas.
- `npm run build`: verifica tipos y genera la compilación de producción.
- `npm run preview`: sirve localmente la compilación de producción.

## Experiencia actual

- Navegación por Explorar, Planificar, Guardados e Información.
- Formularios con mensajes explícitos cuando no hay fuentes de transporte conectadas.
- Patrones de estado accesibles para carga, error, contenido vacío y funciones no disponibles.
- Panel de estado de integraciones y un espacio cartográfico de diseño que no muestra calles ni ubicaciones ficticias.
- Diseño adaptable, controles con foco visible y navegación compatible con teclado.

## Variables de entorno

`VITE_APP_NAME` permite configurar el nombre visible de la aplicación. Las variables con prefijo `VITE_` se incluyen en el código del navegador, por lo que no deben contener claves privadas, contraseñas ni tokens. Esta fase no requiere credenciales externas.

## Datos y transparencia

Los datos oficiales, los datos de demostración y las predicciones deben mantenerse claramente diferenciados. No se integrarán fuentes hasta comprobar su origen, vigencia, cobertura, licencia y condiciones de uso. Nunca se mostrarán simulaciones como ubicaciones GPS, horarios o confirmaciones reales.

## Licencias y atribuciones

Antes de integrar cartografía o datos de terceros, se documentarán las licencias, condiciones de uso y atribuciones. La elección del proveedor cartográfico está pendiente; por eso esta fase no incorpora un mapa real ni solicita permisos de ubicación.
