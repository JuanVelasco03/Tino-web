---
name: revisar-pantalla
description: Revisión completa de una pantalla de Tino web y de todo lo que despliega (subrutas, modales, menús, botones, formularios, estados, skeleton) encadenando impeccable critique, clarify, harden, adapt, layout, typeset, animate, polish y audit. Para tras el audit.
disable-model-invocation: true
argument-hint: <ruta o pantalla> [indicaciones extra]
---

# /revisar-pantalla — revisión completa de una pantalla

Argumentos: `$ARGUMENTS`

Encadena comandos de impeccable sobre **todo lo que se despliega** desde una
pantalla y para tras el audit. El usuario decide después qué ajustes finales
lanzar. Sin pausas ni commits entre pasos.

## Alcance: todo lo que el usuario puede ver desde la pantalla

La pantalla no es solo su `page.tsx`. Se revisa **cada cosa que aparece al
entrar o al interactuar**, aunque viva en otro archivo o solo se vea tras un
clic. Si el usuario puede llegar a verlo desde aquí sin cambiar de sección, está
en el alcance:

- **Rutas:** la página, sus **subrutas** (ej. `cuentas` → `cuentas/archivadas`,
  `cuentas/[id]`, `cuentas/[id]/editar`), rutas interceptadas o paralelas
  (`@modal`, `(.)`), `layout.tsx` propio y variantes por search params
  (`?mes=`, filtros, pestañas).
- **Superposiciones:** modales, diálogos de confirmación, sheets, drawers,
  paneles laterales, popovers, menús desplegables, selects/combobox,
  calendario/selector de fecha, tooltips, toasts y avisos.
- **Controles:** todos los botones y enlaces (primario, secundario, fantasma,
  icono, destructivo) en cada estado: reposo, hover, foco visible, activo,
  deshabilitado, enviando. Inputs, toggles, pestañas, acordeones, filas
  clicables.
- **Formularios:** vacío, con datos, inválido (cada mensaje de error), enviando,
  éxito y error de la API — tanto en página como dentro de modales.
- **Estados de pantalla:** cargando (`loading.tsx` y cargas en el cliente),
  vacío, error (`error.tsx`), no encontrado (`not-found.tsx`), con muchos datos
  y con datos extremos.

Nada de esto se omite por estar oculto tras un clic. Si algo no pudo abrirse o
verse, se dice en el informe; no se da por revisado.

## 0. Inventario del alcance (antes de tocar nada)

1. Resolver la pantalla desde los argumentos: ruta (`/cuentas`), nombre
   (`detalle de cuenta`) o archivo. Lo que siga a la pantalla son
   **indicaciones extra** y se anexan a cada paso.
   Si viene vacío o es ambiguo → AskUserQuestion con las rutas de
   `src/app/(aplicacion)/**/page.tsx`.
2. Construir el inventario con Glob/Grep **siguiendo los imports en
   profundidad** (componente → sus hijos → sus hijos), no solo el primer nivel:
   - `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` de
     la ruta y de cada subruta, interceptada o paralela.
   - Componentes de `src/components/<feature>/` usados por esas rutas.
   - Superposiciones: Grep
     `dialog|Dialog|modal|Modal|Sheet|drawer|Drawer|popover|Popover|menu|Menu|tooltip|Tooltip|toast|confirm|calendario|Calendario`.
   - Botones y disparadores: Grep `onClick|<button|<Boton|formAction|<Link`
     para saber qué abre cada uno.
   - Formularios y server actions de la ruta (`actions.ts`, `"use server"`).
   - Componentes compartidos (`src/components/ui` u otros fuera de la feature)
     → marcar **compartido**.
3. Mostrar el inventario agrupado (rutas · superposiciones · controles ·
   formularios · estados) y seguir sin esperar respuesta. Ese inventario es el
   `<objetivo>` de cada paso.

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
- Con el skill `browser-automation`: iniciar sesión en `/login` y, en móvil
  (390 px) y escritorio, modo claro y oscuro:
  - abrir cada ruta y subruta del inventario;
  - **pulsar cada botón y disparador** y capturar lo que despliega (modal,
    menú, popover, calendario, confirmación, toast);
  - enviar cada formulario vacío e inválido para ver los errores;
  - recorrer con teclado: Tab muestra foco visible, Esc cierra la
    superposición, el foco queda atrapado dentro y vuelve al disparador.
  Esas capturas son la base y la verificación de cada paso.
- No confirmar acciones destructivas ni crear datos reales salvo que sea
  necesario para ver un estado; si se crean, se dice en el informe.
- La clave nunca se escribe en archivos, logs ni en el informe.

## 2. Restricciones comunes (anexar a cada invocación)

> DESIGN.md manda: solo tokens; los «Desvíos registrados» no se copian.
> Mantener paleta y radios. Modo Operate. Alcance = el inventario completo,
> incluidas subrutas, superposiciones, controles y sus estados. Un componente
> compartido no se cambia en silencio: se anota en el informe. Dinero en
> `bigint`, formato colombiano, cifras tabulares (REGLAS §6). Ninguna regla de
> negocio se mueve a la interfaz.

## 3. Pasos secuenciales

Cada paso: `Skill(impeccable, "<cmd> <objetivo> — <indicación> <restricciones> <extras>")`.
Esperar que termine antes del siguiente. Tras cada paso que cambie código: una
línea con los archivos cambiados. Si impeccable pide una decisión → preguntar y
seguir.

1. **critique** — Diagnóstico UX inicial (jerarquía, flujo, carga cognitiva)
   sobre las capturas. **No cambia código.** Sus hallazgos se anexan como
   contexto a los pasos siguientes.
2. **clarify** — Textos, etiquetas, botones, tooltips, confirmaciones, toasts y
   errores en español claro y breve, en página y superposiciones.
3. **harden** — Estados vacíos, de carga y de error; nombres largos; montos
   extremos (`1.234.567.890 COP`, US$ con equivalente en COP y TRM); errores de
   la API; validación de formularios en página y modales; doble envío; botones
   en estado enviando/deshabilitado.
4. **Skeleton propio** (lo hace este skill, bajo las reglas de harden/polish):
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
5. **adapt** — Móvil primero; áreas táctiles ≥ 44 px; tablas de montos legibles
   en 390 px; modales, menús y calendario según `DESIGN.md` en móvil.
6. **layout** — Espaciado, ritmo y jerarquía visual con los tokens de
   espaciado; alineación de columnas de montos.
7. **typeset** — Haz más legibles los textos y reduce los estilos de título.
8. **animate** — Micro-interacciones suaves en botones, menús y modales, sin
   parecer un juego. Respeta `prefers-reduced-motion`.
9. **polish** — Pasada final de detalle sobre todo el inventario. Mantén la
   paleta y los radios actuales.
10. `npm run lint` y `npm test`. Reportar fallos tal cual, sin ocultarlos.
11. **audit** — Sobre todo el inventario (a11y, rendimiento, responsive).

No se usan `bolder`, `colorize`, `delight`, `quieter` ni `distill`: cambian la
identidad o quitan funciones, y eso lo decide el usuario aparte.

## 4. Cierre: parar

Informe conciso:
- Inventario revisado, y lo que **no** se pudo abrir o ver (y por qué).
- Hallazgos clave del critique.
- Cambios por paso (archivos).
- Componentes compartidos que conviene tocar (no tocados).
- Datos creados en la sesión de QA, si los hubo.
- Resultado de lint/test.
- Hallazgos del audit por severidad.
- Comandos impeccable sugeridos para cerrar (p. ej. `optimize`, `distill`).

No aplicar nada más. Si apareció un componente nuevo → recordar mostrarlo en
`/estilos`.
