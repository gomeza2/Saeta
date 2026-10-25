# Verificación de experiencia móvil

La Fase 10 incluye un enlace de salto al contenido, foco visible, controles táctiles de al menos 44 px en navegación/botones/zoom, navegación que se distribuye en pantallas angostas, etiquetas y mensajes de estado, y mejoras de contraste. Se conserva `prefers-reduced-motion` y la geolocalización requiere una acción explícita.

## Evidencia local

- TypeScript, ESLint, Prettier, Vitest y build ejecutados en cada fase; consultar los resultados del SHA revisado en Actions.
- Chromium a 320 px y escritorio: importar archivos sintéticos, filtrar y abrir detalles, activar marcadores con Enter, alternar geometrías, cambiar pestañas y limpiar capas, sin desbordamiento horizontal ni excepciones JavaScript.
- Chromium sobre el build de producción servido con base `/Saeta/`: carga del Worker compilado, consulta de horarios posteriores a medianoche, rechazo de tablas que superan el límite de filas y limpieza/cancelación. Se comprobó el salto al contenido mediante Tab y Enter.
- axe-core con reglas WCAG 2 A/AA y WCAG 2.1 AA: sin incidencias automatizadas en nueve estados a 320 px (cinco secciones sin importación, Datos/Explorar/Planificar importados y mapa local).

Los fixtures son sintéticos; no representan datos de SAETA. Las pruebas de navegador excluyeron las teselas externas. Una comprobación HTTPS separada, con identificación de la aplicación y Referer, devolvió una tesela real de Salta que se inspeccionó visualmente; una solicitud genérica previa había recibido una imagen de denegación. Las comprobaciones automatizadas no sustituyen pruebas con lectores de pantalla, distintos dispositivos y usuarios. No se afirma conformidad integral ni preparación completa para producción.

La comprobación visual directa del dominio público en Chromium quedó limitada por la confianza de su CA del proxy. La instalación de esa CA fue rechazada por la revisión automática y no se realizó; no se desactivó TLS. Se verificaron los recursos públicos mediante HTTPS y el comportamiento del bundle compilado en el navegador local.

No se incorporó una PWA: no se ha implementado ni verificado un contrato de funcionamiento sin conexión ni una política de caché para datos y teselas.
