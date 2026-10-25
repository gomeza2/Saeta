# Publicación con GitHub Pages

La aplicación requiere compilar Vite y publicar `dist`, no servir el TypeScript de la raíz.

- Configuración esperada: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
- `.github/workflows/deploy-pages.yml` se ejecuta en pushes a `main` y manualmente. Instala dependencias, comprueba tipos, lint, formato y tests, compila y publica `dist` con las acciones oficiales de Pages.
- `vite.config.ts` usa `/Saeta/` cuando `GITHUB_ACTIONS=true`; el bundle debe referenciar `/Saeta/assets/…`.
- Los permisos requeridos ya están declarados: `contents: read`, `pages: write`, `id-token: write`.

## Evidencia observada

Para `803c5a1f0af494388a2dd4a3662005cf134abfef`, el resumen público de [calidad](https://github.com/gomeza2/Saeta/actions/runs/40202801467) indica Success. El de [publicación](https://github.com/gomeza2/Saeta/actions/runs/40202801464) indica Success en build y deploy y registra `https://gomeza2.github.io/Saeta/` como destino.

El bloqueo CONNECT inicial dejó de reproducirse. Se comprobó que la URL pública entrega HTML con bundles compilados y que ambos assets JS/CSS responden HTTP 200 con sus tipos de contenido correctos.

La API de Pages confirmó `build_type: legacy`, con fuente `main` y `/`. Se intentó cambiar a `workflow` con la API oficial y GitHub respondió HTTP 403: `Resource not accessible by integration`. La identidad de la integración permite ramas y pull requests, pero no ese ajuste de Pages. Queda pendiente que un administrador seleccione **GitHub Actions** en el recorrido de Settings indicado arriba. No se ha confirmado ese cambio.

Una solicitud de tesela respondió con una imagen de denegación y cabecera `x-blocked: Access denied` del proveedor. Esa respuesta no verifica cartografía útil aunque su HTTP sea 200. Las pruebas locales de capas excluyen las teselas externas.

## Comprobación después de publicar

1. Confirmar que el run corresponde al SHA fusionado y que ambos jobs finalizan correctamente.
2. Solicitar la URL pública y comprobar que contiene el contenedor React y referencias a bundles compilados bajo `/Saeta/assets/`, sin referencias a `/src/main.tsx`.
3. Solicitar esos JS y CSS y comprobar sus respuestas y tipos de contenido. Abrir la aplicación, navegar a Datos e importar un conjunto local de prueba.
4. Comprobar Leaflet, atribución y teselas del proveedor; no confundir disponibilidad de teselas con una fuente de transporte conectada.

No cambiar Source a ciegas si la publicación de Actions ya funciona. Si continúa en `Deploy from a branch`, seleccionar **GitHub Actions**, guardar y ejecutar el workflow. No se necesita publicar `dist` en `main`.
