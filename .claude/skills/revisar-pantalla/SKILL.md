---
name: revisar-pantalla
description: Revisión completa de una pantalla de Tino web (página, subrutas, modales, skeleton) encadenando impeccable clarify, harden, adapt, polish, typeset, animate y audit. Para tras el audit.
disable-model-invocation: true
argument-hint: <ruta o pantalla> [indicaciones extra]
---

# /revisar-pantalla — revisión completa de una pantalla

Argumentos: `$ARGUMENTS`

Encadena comandos de impeccable sobre **todo lo que cuelga** de una pantalla y
para tras el audit. El usuario decide después qué ajustes finales lanzar.
Sin pausas ni commits entre pasos.

## 0. Inventario del alcance (antes de tocar nada)

1. Resolver la pantalla desde los argumentos: ruta (`/cuentas`), nombre
   (`detalle de cuenta`) o archivo. Lo que siga a la pantalla son
   **indicaciones extra** y se anexan a cada paso.
   Si viene vacío o es ambiguo → AskUserQuestion con las rutas de
   `src/app/(aplicacion)/**/page.tsx`.
2. Construir el inventario con Glob/Grep siguiendo los imports:
   - `page.tsx` de la ruta y de sus **subrutas** (ej. `cuentas` →
     `cuentas/archivadas`, `cuentas/[id]`).
   - `loading.tsx`, `error.tsx`, `not-found.tsx` de cada una.
   - Componentes de `src/components/<feature>/`, **modales, diálogos y
     paneles** (Grep `dialog|modal|Dialog|Sheet|drawer`), formularios y server
     actions de la ruta.
   - Componentes compartidos (`src/components/ui` u otros fuera de la feature)
     → marcar **compartido**.
3. Mostrar el inventario en una lista corta y seguir sin esperar respuesta. Ese
   inventario es el `<objetivo>` de cada paso.

## 1. Sesión para ver la pantalla renderizada

- **Tino API primero (bloqueante).** Leer `TINO_API_URL` de `.env.local`
  (por defecto `http://localhost:4000`) y comprobar que responde (p. ej.
  `curl -s -o /dev/null -w "%{http_code}" <url>`; cualquier código HTTP = viva,
  conexión rechazada o timeout = parada). Si está parada → **detenerse**: no
  seguir con ningún paso, pedir al usuario que arranque Tino-API (en
  `../Tino-API`) y esperar a que confirme. Al confirmar, volver a comprobar;
  seguir solo cuando responda. No arrancarla por cuenta propia.
- Leer `TINO_QA_CORREO` y `TINO_QA_CLAVE` de `.env.local`. Si faltan → avisar
  y seguir solo con revisión de código.
- Si `npm run dev` no responde en el puerto 3000, levantarlo en segundo plano.
- Con el skill `browser-automation`: iniciar sesión en `/login`, abrir cada ruta
  del inventario en móvil (390 px) y escritorio, modo claro y oscuro, y abrir
  los modales. Esas capturas son la base y la verificación de cada paso.
- La clave nunca se escribe en archivos, logs ni en el informe.

## 2. Restricciones comunes (anexar a cada invocación)

> DESIGN.md manda: solo tokens; los «Desvíos registrados» no se copian.
> Mantener paleta y radios. Modo Operate. Alcance = el inventario. Un componente
> compartido no se cambia en silencio: se anota en el informe. Dinero en
> `bigint`, formato colombiano, cifras tabulares (REGLAS §6). Ninguna regla de
> negocio se mueve a la interfaz.

## 3. Pasos secuenciales

Cada paso: `Skill(impeccable, "<cmd> <objetivo> — <indicación> <restricciones> <extras>")`.
Esperar que termine antes del siguiente. Tras cada paso del 1 al 7: una línea con
los archivos cambiados. Si impeccable pide una decisión → preguntar y seguir.

1. **clarify** — Textos, etiquetas, botones y errores en español claro y breve,
   en página y modales.
2. **harden** — Estados vacíos, de carga y de error; nombres largos; montos
   extremos (`1.234.567.890 COP`, US$ con equivalente en COP y TRM); errores de
   la API; validación de formularios en modales.
3. **Skeleton propio** (lo hace este skill, bajo las reglas de harden/polish):
   - Cada `loading.tsx` del inventario reproduce la **forma real** de su
     pantalla: cabecera, tablas con su número de columnas y alto de fila,
     tarjetas, totales. Al llegar los datos nada se desplaza.
   - Sin cifras inventadas; `aria-busy`; solo tokens existentes.
   - Cargas en el cliente (cambio de mes, modal que pide datos, envío de
     formulario) → esqueleto o estado en línea.
   - Patrón: `src/components/resumen/esqueleto-resumen.tsx` y el fundido
     «Asentar» (220 ms) de `DESIGN.md`. Los genéricos se ajustan a la forma real.
   - Si nace un esqueleto reutilizable → documentarlo en `DESIGN.md` y
     mostrarlo en `/estilos`.
   - Verificar: captura del esqueleto vs pantalla cargada, sin salto de layout.
4. **adapt** — Móvil primero; áreas táctiles ≥ 44 px; tablas de montos legibles
   en 390 px; modales según `DESIGN.md` en móvil.
5. **polish** — Pulir esta pantalla. Mantén la paleta y los radios actuales.
6. **typeset** — Haz más legibles los textos y reduce los estilos de título.
7. **animate** — Micro-interacciones suaves en botones y modales, sin parecer
   un juego. Respeta `prefers-reduced-motion`.
8. `npm run lint` y `npm test`. Reportar fallos tal cual, sin ocultarlos.
9. **audit** — Sobre todo el inventario.

## 4. Cierre: parar

Informe conciso:
- Inventario revisado.
- Cambios por paso (archivos).
- Componentes compartidos que conviene tocar (no tocados).
- Resultado de lint/test.
- Hallazgos del audit por severidad.
- Comandos impeccable sugeridos para cerrar.

No aplicar nada más. Si apareció un componente nuevo → recordar mostrarlo en
`/estilos`.
