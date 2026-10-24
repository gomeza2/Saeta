# SAETA MAPS

SAETA MAPS es un proyecto independiente en desarrollo para ayudar a explorar opciones de movilidad urbana en Salta, Argentina. No es una aplicación oficial de SAETA ni está afiliado a esa organización.

**Estado actual:** Fase 1, base técnica inicial. Todavía no se muestran recorridos, paradas, horarios, posiciones GPS, alertas ni recargas reales.

## Requisitos

- Node.js 22.12.0 o superior.
- npm incluido con Node.js.

## Instalación y ejecución

1. Cloná el repositorio y entrá en su carpeta.
2. Ejecutá npm install.
3. Copiá .env.example a .env.local.
4. Ejecutá npm run dev y abrí en el navegador la dirección que muestre la terminal.

En Windows PowerShell, el paso de copiar el archivo se puede hacer con Copy-Item .env.example .env.local.

## Comprobaciones

- npm run typecheck: revisa los tipos de TypeScript.
- npm run lint: análisis estático del código.
- npm run format:check: comprueba el formato.
- npm run test: ejecuta las pruebas automatizadas.
- npm run build: verifica tipos y genera la compilación de producción.
- npm run preview: sirve localmente la compilación de producción.

## Variables de entorno

VITE_APP_NAME permite configurar el nombre visible de la aplicación. Las variables con prefijo VITE_ se incluyen en el código del navegador, por lo que no deben contener claves privadas, contraseñas ni tokens. Esta fase no requiere credenciales externas.

## Estructura del proyecto

- src/config/: configuración pública de la aplicación.
- src/test/: configuración compartida para pruebas.
- src/App.tsx: pantalla inicial de estado del proyecto.
- src/App.test.tsx: pruebas de la pantalla inicial.
- src/main.tsx: punto de entrada de React.
- src/styles.css: estilos globales y diseño adaptable.
- docs/ARCHITECTURE.md: arquitectura y separación de responsabilidades.
- docs/ROADMAP.md: fases, dependencias y criterios de aceptación.

## Datos y transparencia

Los datos oficiales, los datos de demostración y las predicciones deben mantenerse claramente diferenciados. No se integrarán fuentes hasta comprobar su origen, vigencia, cobertura, licencia y condiciones de uso. Nunca se mostrarán simulaciones como ubicaciones GPS, horarios o confirmaciones reales.

## Licencias y atribuciones

Antes de integrar cartografía o datos de terceros, se documentarán las licencias, condiciones de uso y atribuciones. La elección del proveedor cartográfico está pendiente; por eso esta fase no incorpora un mapa ni solicita permisos de ubicación.
