# Publicación con GitHub Pages

La aplicación requiere compilar Vite y publicar `dist`, no servir el TypeScript de la raíz.

- Configuración esperada: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
- `.github/workflows/deploy-pages.yml` se ejecuta en pushes a `main` y manualmente. Instala dependencias, comprueba tipos, lint, formato y tests, compila y publica `dist` con las acciones oficiales de Pages.
- `vite.config.ts` usa `/Saeta/` cuando `GITHUB_ACTIONS=true`; el bundle debe referenciar `/Saeta/assets/…`.
- Los permisos requeridos ya están declarados: `contents: read`, `pages: write`, `id-token: write`.

## Evidencia observada

Para `803c5a1f0af494388a2dd4a3662005cf134abfef`, el resumen público de [calidad](https://github.com/gomeza2/Saeta/actions/runs/40202801467) indica Success. El de [publicación](https://github.com/gomeza2/Saeta/actions/runs/40202801464) indica Success en build y deploy y registra `https://gomeza2.github.io/Saeta/` como destino.

El bloqueo CONNECT inicial dejó de reproducirse. Se comprobó que la URL pública entrega HTML con bundles compilados y que ambos assets JS/CSS responden HTTP 200 con sus tipos de contenido correctos.

La API de Pages confirmó `build_type: legacy`, con fuente `main` y `/`. Se intentó cambiar a `workflow` con la API oficial y GitHub respondió HTTP 403: `Resource not accessible by integration`. La identidad de la integración permite ramas y pull requests, pero no ese ajuste de Pages. En una lectura posterior, la API confirmó `build_type: workflow`. El ajuste de Source ya está aplicado; no se atribuye al intento que recibió 403. No queda pendiente seleccionar GitHub Actions según esa última lectura.

La primera solicitud genérica de tesela respondió con una imagen de denegación y cabecera `x-blocked: Access denied`. Una comprobación posterior identificada como `SAETA-MAPS-development-check/0.1`, con Referer de la aplicación y una tesela de Salta, recibió HTTP 200 sin esa cabecera y una imagen de calles reales, inspeccionada visualmente. Esto comprueba esa solicitud concreta, no garantiza disponibilidad permanente. Las pruebas de navegador local excluyen las teselas externas.

## Comprobación después de publicar

1. Confirmar que el run corresponde al SHA fusionado y que ambos jobs finalizan correctamente.
2. Solicitar la URL pública y comprobar que contiene el contenedor React y referencias a bundles compilados bajo `/Saeta/assets/`, sin referencias a `/src/main.tsx`.
3. Solicitar esos JS y CSS y comprobar sus respuestas y tipos de contenido. Abrir la aplicación, navegar a Datos e importar un conjunto local de prueba.
4. Comprobar Leaflet, atribución y teselas del proveedor; no confundir disponibilidad de teselas con una fuente de transporte conectada.

No cambiar Source a ciegas si la publicación de Actions ya funciona. Si continúa en `Deploy from a branch`, seleccionar **GitHub Actions**, guardar y ejecutar el workflow. No se necesita publicar `dist` en `main`.

## Mejoras integradas

Las fases 6–10 se fusionaron en [PR #6](https://github.com/gomeza2/Saeta/pull/6), [PR #7](https://github.com/gomeza2/Saeta/pull/7), [PR #8](https://github.com/gomeza2/Saeta/pull/8), [PR #9](https://github.com/gomeza2/Saeta/pull/9) y [PR #10](https://github.com/gomeza2/Saeta/pull/10). La revisión `c1e0d14` integra la Fase 10; su [control de calidad](https://github.com/gomeza2/Saeta/actions/runs/40206183466) quedó aprobado. La publicación y el contenido público deben comprobarse contra el SHA actual, sin inferirlos solo de la existencia del workflow.
