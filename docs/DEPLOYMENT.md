# Publicación con GitHub Pages

La aplicación requiere compilar Vite y publicar `dist`, no servir el TypeScript de la raíz.

- Configuración esperada: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
- `.github/workflows/deploy-pages.yml` se ejecuta en pushes a `main` y manualmente. Instala dependencias, comprueba tipos, lint, formato y tests, compila y publica `dist` con las acciones oficiales de Pages.
- `vite.config.ts` usa `/Saeta/` cuando `GITHUB_ACTIONS=true`; el bundle debe referenciar `/Saeta/assets/…`.
- Los permisos requeridos ya están declarados: `contents: read`, `pages: write`, `id-token: write`.

## Evidencia observada

Para `803c5a1f0af494388a2dd4a3662005cf134abfef`, el resumen público de [calidad](https://github.com/gomeza2/Saeta/actions/runs/40202801467) indica Success. El de [publicación](https://github.com/gomeza2/Saeta/actions/runs/40202801464) indica Success en build y deploy y registra `https://gomeza2.github.io/Saeta/` como destino.

El entorno de desarrollo recibió un bloqueo CONNECT 403 al solicitar ese destino y la API de GitHub. Por eso esta evidencia no confirma el contenido público actual, la configuración de Source ni la carga de assets en un navegador externo. Los dominios `api.github.com`, `gomeza2.github.io` y `tile.openstreetmap.org` se solicitaron en el borrador de configuración del entorno; guardar el borrador no aplica la política ni publica el sitio.

## Comprobación después de publicar

1. Confirmar que el run corresponde al SHA fusionado y que ambos jobs finalizan correctamente.
2. Solicitar la URL pública y comprobar que contiene el contenedor React y referencias a bundles compilados bajo `/Saeta/assets/`, sin referencias a `/src/main.tsx`.
3. Solicitar esos JS y CSS y comprobar sus respuestas y tipos de contenido. Abrir la aplicación, navegar a Datos e importar un conjunto local de prueba.
4. Comprobar Leaflet, atribución y teselas del proveedor; no confundir disponibilidad de teselas con una fuente de transporte conectada.

No cambiar Source a ciegas si la publicación de Actions ya funciona. Si continúa en `Deploy from a branch`, seleccionar **GitHub Actions**, guardar y ejecutar el workflow. No se necesita publicar `dist` en `main`.
