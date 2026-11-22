---
name: Tino
description: Finanzas personales como un libro de cuentas — papel y tinta, cifras en columnas.
colors:
  fondo: "#FAF8F3"
  superficie: "#FFFFFF"
  hundido: "#F2EEE5"
  texto: "#1A1A17"
  secundario: "#6B6760"
  terciario: "#9A958B"
  linea: "#E4DFD4"
  raya: "#1A1A17"
  marca: "#A8762C"
  marca-texto: "#8A5F1F"
  entrada: "#2F7D5A"
  entrada-texto: "#2F7D5A"
  salida: "#B0452E"
  salida-texto: "#B0452E"
  fondo-oscuro: "#12141A"
  superficie-oscuro: "#181B22"
  hundido-oscuro: "#1F232C"
  texto-oscuro: "#E8E4DC"
  secundario-oscuro: "#8B8A84"
  terciario-oscuro: "#5E5F63"
  linea-oscuro: "#272B34"
  raya-oscuro: "#8B8A84"
  marca-texto-oscuro: "#BC8A3E"
  entrada-texto-oscuro: "#4E9E78"
  salida-texto-oscuro: "#D0664B"
typography:
  cifra-xl:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "56px"
    lineHeight: "60px"
    fontWeight: 500
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  cifra-campo:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "44px"
    lineHeight: "52px"
    fontWeight: 500
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  cifra-l:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "32px"
    lineHeight: "36px"
    fontWeight: 500
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  cifra-m:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "20px"
    lineHeight: "28px"
    fontWeight: 500
    fontFeature: "tnum"
  cifra-s:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "15px"
    lineHeight: "22px"
    fontWeight: 500
    fontFeature: "tnum"
  cifra-xs:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    lineHeight: "16px"
    fontWeight: 400
    fontFeature: "tnum"
  titulo-1:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "28px"
    lineHeight: "34px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  titulo-2:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "20px"
    lineHeight: "26px"
    fontWeight: 600
  cuerpo:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: "22px"
    fontWeight: 400
  etiqueta:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: "18px"
    fontWeight: 500
  rotulo:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "11px"
    lineHeight: "14px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  fila: "0px"
  muestra: "2px"
  campo: "4px"
  hoja: "6px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  boton-primario:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.fondo}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.campo}"
    padding: "0 24px"
    height: "48px"
  boton-primario-deshabilitado:
    backgroundColor: "{colors.hundido}"
    textColor: "{colors.terciario}"
  boton-secundario:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.campo}"
    padding: "0 24px"
    height: "48px"
  boton-texto:
    textColor: "{colors.marca-texto}"
    typography: "{typography.cuerpo}"
    padding: "0 4px"
    height: "48px"
  chip-categoria:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.campo}"
    padding: "0 12px"
    height: "44px"
  chip-categoria-sin-clasificar:
    textColor: "{colors.secundario}"
    rounded: "{rounded.campo}"
  campo-monto:
    textColor: "{colors.texto}"
    typography: "{typography.cifra-campo}"
    rounded: "{rounded.fila}"
    padding: "8px 0 12px"
  tarjeta-activo:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.hoja}"
    padding: "16px"
  tarjeta-pasivo:
    backgroundColor: "{colors.fondo}"
    rounded: "{rounded.hoja}"
    padding: "16px"
  fila-movimiento:
    rounded: "{rounded.fila}"
    padding: "12px 0"
  panel-lateral:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    width: "400px"
  panel-lateral-amplio:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    width: "480px"
  selector-tipo-activo:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.fondo}"
    rounded: "{rounded.campo}"
    height: "40px"
  ficha-cuenta:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.campo}"
    padding: "8px 12px"
    height: "48px"
  aviso-registro:
    backgroundColor: "{colors.fondo}"
    rounded: "{rounded.campo}"
    height: "44px"
  teclado-numerico:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.texto}"
    typography: "{typography.cifra-m}"
    rounded: "{rounded.fila}"
    height: "56px"
  menu-entrada-activa:
    backgroundColor: "{colors.hundido}"
    textColor: "{colors.texto}"
    rounded: "{rounded.campo}"
    height: "40px"
---

# Design System: Tino

<!--
Fuentes: código construido (src/app/globals.css, src/app/layout.tsx,
src/app/estilos/, src/components/), cruzado con la intención original
(referencias/sistema-de-diseno-prompt.md), el documento visual
(referencias/TINO sistema de diseño.zip → «TINO Sistema de Diseño.dc.html»)
y REGLAS.md §6. Donde el código se aparta del sistema, se registra como
desvío en «Do's and Don'ts → Desvíos registrados»; un desvío no es norma.
Referencia viva: la ruta /estilos.
-->

## Overview

**Creative North Star: "El libro de cuentas"**

Tino se ve como un libro contable de papel: hojas color hueso, tinta casi negra y cifras alineadas en columnas. El contenido son cifras y el diseño existe para que se lean y comparen rápido. La jerarquía se arma con líneas y espacio, como los renglones y las rayas de cierre de un libro. No hay sombras, degradados ni volumen. En modo oscuro la tinta se invierte en un azul tinta (no un gris neutro), y el papel se vuelve la línea.

La densidad es la de una herramienta de uso diario: filas de 44 a 64 px, columnas fijas para fecha y monto, y cifras que siempre van en monoespaciada con dígitos tabulares para que se alineen dígito con dígito. El color casi no aparece. El latón marca la identidad y la acción discreta. El verde y la terracota solo dicen si el patrimonio sube o baja. Una pantalla de Tino debe poder leerse en blanco y negro sin perder nada.

Las tarjetas son la excepción, no la norma. Un activo puede ir en hoja (superficie con borde). Un pasivo no lleva hoja: va sobre el fondo. Agrupar se hace con una raya bajo el encabezado y divisiones entre filas, no con cajas.

**Key Characteristics:**
- Papel y tinta: fondo cálido, texto casi negro, modo oscuro azulado.
- Toda cifra en IBM Plex Mono con dígitos tabulares; toda la interfaz en Familjen Grotesk.
- Cuatro líneas (división, raya, doble raya, punteada) y el espacio construyen toda la jerarquía.
- Cero sombras. Radios de 6 px como máximo.
- Acentos solo en texto, iconos, cifras y gráficas finas; nunca de fondo.
- Signo y color de una cifra leídos desde el patrimonio del usuario.

## Colors

Una paleta de papel y tinta casi monocroma, con tres acentos que se reservan para identidad y dirección del dinero.

Cada token tiene valor para modo claro (papel) y modo oscuro (tinta azulada). Los acentos tienen una variante **base** para iconos, gráficas y cifras de 24 px o más, y una variante **-texto** para tamaños pequeños, elegida por contraste. En modo oscuro solo cambian las variantes `-texto`; las bases se mantienen.

El modo oscuro se aplica con `@media (prefers-color-scheme: dark)` bajo `:root:not([data-theme="light"])`, y también con `[data-theme="dark"]` para el cambio manual. El tema se fija antes del primer pintado con un script en el layout (clave `tino-tema` en localStorage).

### Primary
- **Latón** (`marca`; texto `marca-texto`, oscuro `marca-texto-oscuro`): la identidad. Botón de texto, enlaces de acción («+ Crear cuenta»), la etiqueta «auto» del chip sugerido, el cursor del campo de monto y el anillo de foco.

### Secondary
- **Verde libro** (`entrada`; texto `entrada-texto`, oscuro `entrada-texto-oscuro`): dinero que entra al patrimonio. Cifras de ingreso con `+`.

### Tertiary
- **Terracota** (`salida`; texto `salida-texto`, oscuro `salida-texto-oscuro`): dinero que sale del patrimonio y deuda. Cifras de gasto con `−`, saldos de pasivos, errores de validación y el borde inferior de un campo con error.

### Neutral
- **Papel** (`fondo`; oscuro `fondo-oscuro`): fondo de la página y de los pasivos.
- **Hoja** (`superficie`; oscuro `superficie-oscuro`): tarjetas de activo, paneles laterales, chips y botón secundario.
- **Papel hundido** (`hundido`; oscuro `hundido-oscuro`): entrada activa del menú y botón primario deshabilitado.
- **Tinta** (`texto`; oscuro `texto-oscuro`): texto principal, cifras neutras y fondo del botón primario.
- **Tinta secundaria** (`secundario`; oscuro `secundario-oscuro`): etiquetas, subtítulos, equivalencias en COP, navegación inactiva.
- **Tinta tenue** (`terciario`; oscuro `terciario-oscuro`): marcadores de posición, el «0» de un campo vacío, estados deshabilitados, borde punteado.
- **Renglón** (`linea`; oscuro `linea-oscuro`): divisiones entre filas, bordes de hojas y de controles secundarios, y el resaltado de la selección de texto (`::selection`, con la tinta sin cambiar).
- **Raya** (`raya`; oscuro `raya-oscuro`): la línea fuerte bajo un encabezado de sección, bajo el campo de monto y en el borde del panel.

### Named Rules
**The Ink-Only Accent Rule.** Los acentos son texto, iconos, cifras o gráficas finas (barras de cupo de 4 px, el cursor de 2 px). Nunca rellenan un bloque, un botón ni un fondo de fila.

**The Patrimony Sign Rule.** En la lista general, toda cifra se lee desde el patrimonio del usuario: salida con `−` (U+2212) en terracota, entrada con `+` en verde, transferencia en tinta y sin signo. El signo lo decide el dominio (RN-02): `efectoEnPatrimonio` en `src/domain/cuenta/naturaleza.ts` y, para un movimiento, `importeEnPatrimonio` en `src/domain/movimiento/vista-previa.ts` (gasto −, ingreso +, transferencia sin signo; coincide con el anterior para cualquier cuenta). Ningún componente lo recalcula.

**The Small-Text Variant Rule.** Por debajo de 24 px, un acento siempre usa su variante `-texto`.

## Typography

**Interfaz:** Familjen Grotesk 400 / 500 / 600 / 700 (con `system-ui, sans-serif`)
**Cifras:** IBM Plex Mono 400 / 500 (con `ui-monospace, monospace`)

**Character:** una grotesca cálida y compacta para la voz de la interfaz, y una mono técnica que vuelve cada cifra un asiento contable alineado. Las dos se cargan con `next/font` (`--font-interfaz`, `--font-cifras`) y Tailwind no expone otras familias.

### Hierarchy

Cifras (siempre `font-mono` y `tabular-nums`):
- **cifra-xl** (500, 56/60, −0.03em): la cifra protagonista de una pantalla, como el monto de la captura móvil.
- **cifra-campo** (500, 44/52, −0.02em): solo el campo de monto (C4).
- **cifra-l** (500, 32/36, −0.02em): el patrimonio neto al cierre de la lista de cuentas (escritorio); en el resumen, las tres cifras del mes (escritorio), el resultado (móvil) y el patrimonio de hoy.
- **cifra-m** (500, 20/28): saldo en la tarjeta o fila de cuenta, total de grupo en escritorio e ingresos y gastos del resumen en móvil.
- **cifra-s** (500, 15/22): montos de filas y totales de sección.
- **cifra-xs** (400, 12/16): fechas, equivalencias en COP, TRM, «Usado 32 %», porcentajes y variaciones del resumen y las etiquetas de la gráfica.

Texto:
- **titulo-1** (600, 28/34, −0.01em): título de página.
- **titulo-2** (600, 20/26): título de bloque; también la marca TINO del menú lateral.
- **cuerpo** (400, 15/22): texto base, conceptos de movimiento, nombres, botones.
- **etiqueta** (500, 13/18): rótulos de campo y subtítulos. Se usa con `font-normal` en mensajes de ayuda y error.
- **rotulo** (600, 11/14, +0.08em, MAYÚSCULAS): rótulo de encabezado de sección, de panel y de grupo de opciones.

### Named Rules
**The Mono-Money Rule.** Todo importe monetario va en IBM Plex Mono con dígitos tabulares, sin excepción, también dentro de un botón («Registrar gasto 18.500»).

**The Weight-Step Rule.** El monto siempre va un escalón de peso por encima de su etiqueta. Nunca al revés.

**The Colombian-Format Rule.** Punto de miles y coma decimal. Pesos sin decimales (`1.234.567`), dólares con dos (`US$ 7.750,00`). Negativo con `−` (U+2212), nunca guion. «COP» se omite cuando toda la columna está en pesos. Toda cifra en otra moneda lleva debajo, en secundario, su equivalente y la tasa: `≈ 31.775.000 COP · TRM 4.100,00`. El formato vive en `src/domain/dinero/formato.ts`; ningún componente formatea a mano.

## Layout

**Espaciado:** base 4, escala cerrada `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (en Tailwind `1 · 2 · 3 · 4 · 6 · 8 · 12 · 16`; `--spacing: 4px`). Las alturas de control (40, 44, 48, 56 px) son medidas de objetivo táctil, no pasos de espaciado.

**Estructura de la aplicación:**
- **Escritorio (md, 768 px o más):** menú lateral fijo de 232 px con borde derecho en renglón, y contenido con un ancho máximo de 1120 px. Márgenes laterales de 24 px (md) y 48 px (lg). El contenido arranca 24 px más arriba que el menú (32 px), para que «TINO» y el título de página compartan línea base.
- **Móvil:** márgenes de 16 px, barra inferior de cinco pestañas de 56 px más la zona segura (mínimo 28 px), con «Registrar» en el centro como único botón en tinta.

**Filas y columnas:** las listas son grids con columnas fijas. La fila de movimiento usa `52px | flexible | auto`, con 12 px entre columnas y alineación por línea base. Las cifras siempre se alinean a la derecha. Objetivo táctil mínimo de 44 px en móvil (los chips crecen de 36 a 44 px).

**Paneles:** en escritorio, una hoja lateral de 400 px a todo el alto con raya a la izquierda; 480 px (`ancho="amplio"`) cuando el formulario necesita dos columnas, como la captura rápida. Un panel puede llevar un pie fijo (la acción principal) bajo el contenido desplazable, sobre una división. En móvil, una hoja inferior de ancho completo (hasta 90 dvh) con radio superior de 6 px. El velo oscurece el libro con `fondo` al 60 %.

**Captura rápida en móvil:** no es un panel sino una hoja a pantalla completa (`<dialog>`, por encima de la barra de pestañas): cabecera de 56 px con cerrar, tipos y «Hoy −X»; el monto en el centro (`cifra-xl`, `cifra-campo` si pasa de 9 caracteres); los conceptos en una fila desplazable de chips; la fila Categoría │ Cuenta │ Fecha (56 px, cada celda abre una hoja inferior con «Listo»); el teclado numérico; y el botón. El aviso de registro flota sobre el botón.

**Movimiento:** se usa solo para explicar un cambio de estado. Siempre se sale más rápido de lo que se entra. Las curvas son tokens de `globals.css` y nunca se escriben a mano:
- **Llegada** (`--llegada`, `ease-llegada`; `cubic-bezier(0.16, 1, 0.3, 1)`): desaceleración marcada, para lo que entra en escena.
- **Retirada** (`--retirada`, `ease-retirada`; `cubic-bezier(0.4, 0, 1, 1)`): aceleración, para lo que sale.
- **Despliegue** (`--despliegue`, `ease-despliegue`; `cubic-bezier(0.22, 1, 0.36, 1)`): desaceleración más pareja, para que se vea crecer una fila.

En JavaScript (Web Animations), las curvas se leen de esas variables, porque WAAPI no acepta `var()`. Las duraciones no son tokens y van con la utilidad `duration-*`.

Hay dos movimientos:
- **Panel lateral:** la hoja llega desde el borde en que se ancla y el velo oscurece el libro a la vez. Entra con llegada (320 ms escritorio, 380 ms móvil) y sale con retirada (180 / 200 ms). La salida termina antes de que cambie la URL. La hoja de captura móvil sube desde abajo con las mismas medidas que el panel en móvil.
- **Despliegue de un campo:** un campo que depende de otro (el cupo al elegir tarjeta) se abre en su lugar. La fila crece de `0fr` a `1fr` en `grid-template-rows`, sin animar `height`, y el campo aparece con un fundido y baja 4 px. Entra con despliegue en 300 ms y sale con retirada en 180 ms. Plegado queda `inert`.

Con movimiento reducido no hay desplazamiento, pero se conserva la opacidad: el panel se funde (150 / 120 ms) y el campo cambia de alto de golpe.

## Elevation & Depth

Tino es completamente plano. Ningún componente lleva sombra, y las escalas de sombra de Tailwind están vaciadas en `globals.css` (`--shadow-*: initial` y sus variantes). La profundidad se transmite con tres recursos: el cambio de tono entre `fondo`, `superficie` y `hundido`; el borde en `linea` de una hoja; y las cuatro líneas del libro. Un panel se distingue del contenido por su raya lateral y el velo, no por elevación. El foco es un contorno de 2 px en latón con 2 px de separación, nunca un resplandor.

### Las cuatro líneas
- **División** (1 px, `linea`): entre filas de una lista.
- **Raya** (1 px, `raya`): bajo un encabezado de sección, bajo el campo de monto y en el borde del panel.
- **Doble raya** (3 px doble, `raya`; utilidad `doble-raya`): cierre de un total, como el patrimonio neto.
- **Punteada** (1 px discontinua, `terciario`; utilidad `punteada`): lo pendiente o sin clasificar (también bajo cada ocurrencia de la bandeja de recurrentes). Provisional. Encima de una fila (la de «Sin categoría») se escribe `border-t border-t-terciario [border-top-style:dashed]`, para no volver discontinua la división inferior.

### Named Rules
**The No-Shadow Rule.** Sin sombras en ningún componente, en ningún estado. Si algo necesita destacarse, se usa una línea, un tono de superficie o espacio.

**The Four-Lines Rule.** La jerarquía se construye solo con las cuatro líneas y el espacio. No se inventa una quinta (bordes de color, líneas gruesas, separadores decorativos).

## Shapes

Formas rectas y sobrias, con radios casi imperceptibles y un máximo de 6 px:
- **Fila** (0 px): filas, tablas y teclado.
- **Muestra** (2 px): muestras de color y barras (cupo, gasto por categoría).
- **Campo** (4 px): campos, botones, chips y la entrada activa del menú.
- **Hoja** (6 px): hojas y paneles.

Tailwind solo expone estos cuatro radios (`--radius-*: initial`). Los campos de texto no son cajas: son una línea inferior (en `linea` y en `raya` al recibir foco), como un renglón donde se escribe.

### Named Rules
**The Six-Pixel Ceiling Rule.** Ningún radio supera los 6 px. Las píldoras y las tarjetas redondeadas no existen en Tino.

## Components

Componentes construidos y su número en el documento de referencia. El catálogo va de C1 a C36. Los que no aparecen aquí están diseñados en `referencias/` pero no construidos, y se construyen solo cuando su pantalla tenga spec.

### Botones (C6)
Tinta llena o línea fina, sin relieve.
- **Forma:** radio de campo (4 px), 48 px de alto, 24 px de relleno horizontal, 12 px entre el texto y la cifra.
- **Primario:** fondo `texto`, texto `fondo`, peso 600. Deshabilitado: fondo `hundido`, texto `terciario`.
- **Secundario:** fondo `superficie`, borde `linea`, peso 500.
- **Texto:** sin caja, en `marca-texto`, peso 600.
- **Con monto:** la cifra va dentro del botón en mono 500 («Registrar gasto 18.500»).

### Chips de categoría (C5)
- **Estilo:** fondo `superficie`, borde `linea`, radio de campo, 36 px de alto en escritorio y 44 px en móvil.
- **Seleccionado o sugerido:** borde `texto`, peso 500 y marca de verificación de 16 px. El sugerido añade «auto» en mono `rotulo` latón, porque lo puso una regla de texto.
- **Sin clasificar:** borde discontinuo `terciario`, texto `secundario`.
- **Interactivo:** con `onClick` es un interruptor (`aria-pressed`). En la captura, tocar el sugerido lo quita (RN-11: la regla propone, el usuario dispone) y se registra sin clasificar; tocar otro lo elige. Sobre los chips, «Sugerida por «palabra»» en `etiqueta` latón.
- **Como opción:** el mismo chip sirve para elegir entre opciones cortas que no son categorías (conceptos frecuentes; Hoy · Ayer · Anteayer · Otra fecha).

### Tarjeta de cuenta (C3)
- **Activo:** hoja: fondo `superficie`, borde `linea`, radio de hoja, 16 px de relleno.
- **Pasivo:** sin hoja: borde `linea` sobre el fondo, con «DEBES» en `rotulo` sobre la cifra. El cupo va como barra de 4 px (radio de muestra) en `texto` sobre `linea`, con «Usado %» y «Disponible X de Y» en cifra-xs. El disponible se calcula (RN-18). Corte y pago límite van bajo una división.
- **Cabecera:** grid `20px | flexible | auto`: icono de tipo de cuenta, nombre (cuerpo 600) y subtítulo, cifra-m a la derecha. En USD lleva debajo la equivalencia y la TRM con su fecha.

### Fila de cuenta (C10)
La versión en lista de la cuenta, dentro de un grupo de Activos («Lo que tienes») o Pasivos («Lo que debes»). Los activos van en hoja y los pasivos sobre el fondo. El saldo del pasivo va en `salida-texto`, y su barra de cupo en terracota base. El grupo cierra con Activos, Pasivos y, tras la doble raya, el Patrimonio neto en cifra-l.
- **Sangría común:** activos, pasivos, cierre y enlaces comparten la sangría de la hoja (`SANGRIA_LISTA`), así que todas las cifras caen en la misma columna, también en móvil.
- **Como enlace:** fuera del modo «Ordenar», toda la fila es un enlace a su edición y toma fondo `hundido` al pasar el cursor, de borde a borde de la hoja; el foco va por dentro de la fila. En «Ordenar» deja de serlo y muestra el agarre y las flechas de 44 px.

### Campos
- **Campo de monto (C4):** sin caja, con raya inferior (en `salida` si hay error). Con `signo`, lleva delante `−` o `+` en la base del acento (la cifra mide 44 px). Etiqueta en `etiqueta` secundario, cifra en `cifra-campo` y moneda a la derecha. Vacío muestra un «0» en `terciario` y un cursor de 2 px en latón. En USD lleva la equivalencia debajo. Al escribir formatea los pesos sin mover el cursor. Con foco, la raya pasa a latón y el contorno de foco rodea el campo entero (etiqueta, cifra y moneda), no solo la cifra.
- **Campo subrayado (`CampoSubrayado`):** etiqueta arriba y texto sobre una línea `linea` que pasa a `raya` con el foco. 44 px de alto. Con la prop `error`, la línea pasa a terracota (`salida`), el input queda con `aria-invalid` y el mensaje va debajo, enlazado con `aria-describedby`.
- **Mensaje de error (`MensajeError`):** `etiqueta` con `font-normal` en `salida-texto` y `role="alert"`, bajo el campo o al pie del bloque. Es el único modo de mostrar un error; no se escribe el párrafo a mano. Los campos (`CampoSubrayado`, `CampoMonto`, `OpcionUnica`) lo usan a través de su prop `error`.
- **Nota:** `etiqueta` con `font-normal` en `secundario` («Cambiarlo queda registrado.»).

### Opción única (C34)
Filas de 44 px separadas por divisiones, con un radio nativo oculto y dibujado como círculo de 18 px (borde `terciario`; elegido: borde y punto en `texto`, rótulo en 600). Icono opcional de 20 px en secundario. El rótulo del grupo va en `rotulo` secundario.

### Encabezado de sección (C1)
Rótulo en MAYÚSCULAS a la izquierda y cifra-s a la derecha, alineados por línea base sobre una raya, con 8 px de relleno inferior. Entre grupos se separa con 24 px de espacio, nunca con otra línea.

### Fila de movimiento (C2)
Sin icono. Grid `52px | flexible | auto` con división inferior y 12 px de relleno vertical. Fecha en cifra-xs secundaria, concepto en cuerpo, y debajo categoría · cuenta en `etiqueta` secundaria (sin clasificar: «Sin clasificar» con línea punteada; con partes: «Dividido»). Monto en cifra-s con signo y color según patrimonio, tomado del tipo; en USD, la equivalencia debajo. El recién registrado o guardado (`resaltada`) toma fondo `hundido` y peso 600 en concepto y monto mientras dura su aviso.
- **Partes (sub-renglones):** un movimiento dividido lleva bajo la fila un renglón por parte, con la misma sangría que el concepto: categoría en `etiqueta` secundaria y monto en cifra-xs secundaria, sin signo (el signo es del total), alineado con el importe.
- **Como enlace (`href`):** toda la fila abre su edición. El enlace es el concepto, estirado sobre la fila con un pseudo-elemento (un solo objetivo, nombrado por el concepto); al pasar el cursor, fondo `hundido`.

### Libro de movimientos (`/movimientos`)
En escritorio, rejilla de cuatro columnas `52px | flexible | hasta 176px | 128px` (Fecha, Descripción con la categoría debajo, Cuenta, Importe a la derecha) con rótulos sobre una raya y divisiones entre filas. En móvil, filas C2. Transferencia: «origen → destino» en la cuenta y sin signo.
- **Cabecera:** el título y debajo la navegación de meses.
- **Filas:** cada una es un enlace a `?mes=…&movimiento=<id>` (sin mover el scroll); las partes van como sub-renglones que ocupan de la Descripción al Importe.
- **Aviso:** tras guardar o eliminar, el `AvisoRegistro` va arriba de la lista («Guardado: …» / «Eliminado: …», sin «Deshacer») con la oferta de regla si aplica.
- **Vacío:** en el mes actual, «Aún no registras movimientos este mes.»; en otro, «No hay movimientos en {mes}.» · «Registra uno o cambia de mes.».

- **Filtro «Gastos sin clasificar»** (`?sinClasificar=1`, solo desde el resumen): arriba «Gastos sin clasificar · N» en `rotulo` con «Ver todos» (`EnlaceTexto`) a la derecha; solo esos gastos, con las mismas filas, que conservan el filtro en su enlace y al cerrar la edición. Al clasificar uno, sale de la lista. Vacío: «Sin clasificar · {mes}», «No quedan gastos sin clasificar en {mes}.» y «Ver todos» (sin `+`). Cambiar de mes quita el filtro.

### Navegación de meses (`NavegacionMes`)
`‹` y `›` como objetivos de 44 px con chevrones de 18 px en `secundario` (pasan a `texto` al pasar el cursor), y entre ellos el mes («Noviembre 2026») en cuerpo 600. A la derecha, «Este mes» (`EnlaceTexto`) solo fuera del mes actual. Cada mes es una URL (`?mes=YYYY-MM`). Las flechas se nombran con el destino: «Mes anterior: Octubre 2026».
- **Límites** (`hayAnterior`, `haySiguiente`): una flecha oculta deja su hueco de 44 px, para que el mes no salte. `/movimientos` no tiene límites (la captura admite fechas futuras); en `/resumen` los da la API (`limitesMes`: sin `‹` en el mes de inicio o antes, sin `›` en el actual).
- **Variante título** (`variante="titulo"`): el mes es el `h1` (titulo-1). Escritorio: `‹ Mes ›` y «Este mes» a continuación. Móvil: el mes a la izquierda, `‹ ›` a la derecha y «Este mes» debajo.

### Resumen del mes (`/resumen`)
Pantalla de solo lectura: toda cifra, variación y porcentaje llega de la API y aquí solo se formatea; la web no suma, no resta ni calcula porcentajes. Porcentajes en décimas, con `formatearPorcentaje` (aritmética entera, «—» sin base). Secciones separadas por 48 px en escritorio y 32 px en móvil.
- **Cabecera:** «Resumen del mes» en `rotulo` secundario, la navegación en variante título y, a la derecha (debajo en móvil), «1 – 31 oct · 142 movimientos · comparado con septiembre» en `etiqueta` secundaria, con la cantidad en mono.
- **Cifras del mes (`CifrasMes`):** escritorio, tres columnas bajo una raya separadas por divisiones verticales: rótulo, cifra-l y debajo dos renglones en `etiqueta` / cifra-xs («Septiembre 4.200.000», «Variación +62.500 · +1,5 %»). Ingresos con `+` en verde, gastos con `−` en terracota (base en cifra-l, `-texto` en cifra-m), resultado con su signo en tinta; un cero va sin signo y en tinta. Variaciones con signo, en tinta. Móvil: ingresos y gastos en filas de cifra-m con «+1,5 % vs sep» en cifra-xs; el resultado en cifra-l entre raya y doble raya.
- **Gasto por categoría (`GastoCategorias`):** escritorio, tabla `160px | flexible | 120px | 72px | 120px | 110px` (Categoría, barra, mes, %, anterior, Var.) con rótulos sobre una división. La barra mide 6 px, radio `muestra`, en `texto`, y su largo es el `porcentaje` de la API sobre el mayor de la lista (`anchoBarra`), nunca montos. «Sin categoría» va al final, sobre una punteada, con el nombre subrayado en punteada y la barra como contorno punteado `terciario`; aparece solo si tiene monto este mes o el anterior. Cierra «Total gastos» en 600 sobre doble raya, con «100 %» rotulado sin sumar filas («—» si no hubo gastos). Móvil: lista con nombre, monto y % y debajo una barra de 4 px; el total va en la cabecera de la sección. Sin filas: «No hubo gastos en {mes}.».
- **Indicador de sin clasificar:** solo con gastos sin clasificar. Escritorio, a la derecha del rótulo: «3,3 % sin categoría · Clasificar 1», el % en mono con subrayado punteado y «Clasificar» en latón 600. Móvil, al pie (44 px): «3,3 % sin categoría, en 1 gasto · Clasificar». Lleva a `/movimientos?mes=…&sinClasificar=1`.
- **Patrimonio neto (`PatrimonioNeto`):** «Patrimonio neto · 12 meses» con «dic 2025 – hoy» a la derecha (escritorio), el de hoy en cifra-l y «+6.708.692 desde dic 2025» (cifra en mono y tinta). Con un solo punto, sin variación ni rango. Ocupa 2/3 en escritorio.
- **Cambio en {mes} (`CambioDelMes`):** el puente del patrimonio, 1/3 en escritorio y bajo la gráfica en móvil: «Patrimonio al 30 sep» (rótulo secundario), «Resultado del mes» y «Otros cambios» con signo, y el cierre «Patrimonio al 31 oct» (o «Patrimonio a hoy» en el mes actual) en 600 sobre doble raya. Todo en tinta, cifra-s.

### Gráfica del patrimonio (`GraficaPatrimonio`)
SVG propio, sin librería. La escala se calcula en `src/domain/resumen/grafica.ts` con `bigint`; solo las coordenadas en píxeles salen como `number`. `viewBox` fijo por formato (escritorio 690 × 240, móvil 358 × 180) estirado al ancho, para que el texto conserve su tamaño en cada uno.
- **Casillas:** 12 fijas (11 cierres de mes y hoy); con menos puntos, ocupan las últimas, así que hoy queda siempre a la derecha. La escala de tiempo no se estira.
- **Trazo:** tres líneas de rejilla en `linea` con paso redondo (1, 2 o 5 × 10^k) y su etiqueta compacta a la derecha («25 M», «950 mil», `formatearCompacto`); base en `raya`; línea de 1,5 px en `texto`; puntos huecos (relleno `fondo`) y el de hoy relleno en `texto`. Etiquetas en cifra-xs secundaria; «hoy» en tinta. Rango cero: la rejilla se abre alrededor del valor.
- **Accesible:** `role="img"` con «Patrimonio neto: de {primero} en {mes} a {hoy} hoy».
- **Punto de partida (día uno):** hoy en la primera casilla como punto relleno con aro `fondo`, una línea punteada `terciario` hacia la derecha y debajo «hoy» en tinta y los 11 meses siguientes en `terciario`. Más bajo (escritorio 480 × 140, móvil 358 × 100).

### Día uno del resumen (`DiaUno`)
Cuando el usuario aún no tiene movimientos (`tieneMovimientos: false`); un mes vacío cualquiera muestra ceros, no esto. Sin navegación de meses: el mes es un `h1` simple.
- **Mensaje:** «Hoy es tu primer día.» en titulo-2 y la explicación en cuerpo secundario (larga en escritorio, corta en móvil; «tus 3 cuentas» / «tu cuenta»). En escritorio, a la derecha, «Registrar el primer gasto» (primario, abre la captura) y «Agregar otra cuenta» (enlace con aspecto de botón secundario a `/cuentas?cuenta=nueva`), sobre una división.
- **Cifras:** las tres en «0» `terciario` (cifra-l en escritorio con «Sin ingresos registrados» · «Sin gastos registrados» · «Ingresos menos gastos»; filas en móvil).
- **Abajo, en dos columnas:** «Gasto por categoría» con cuatro renglones vacíos de 44 px (el último en doble raya de `linea`) y «Cuando registres gastos aparecen aquí…»; «Patrimonio neto» con «Punto de partida · 11 nov», la cifra en cifra-l, la gráfica de punto de partida y «La línea arranca hoy. Cada cierre de mes agrega un punto.».
- **Móvil:** mensaje corto, cifras apiladas, patrimonio y «Registrar el primer gasto» a todo el ancho al final; sin categorías ni «Agregar otra cuenta».
- **Sin cuentas:** «Empieza por crear una cuenta: el resumen se arma con lo que registres en ella.» con «+ Nueva cuenta» (`EnlaceTexto`); sin patrimonio ni «Registrar el primer gasto» (la captura pide cuenta).

### Recurrentes (`/recurrentes`)
Ocurrencias que todavía no son movimientos: nada toca saldos hasta confirmar (RN-10). Estados, estimados y sumas llegan de la API; la web arma el texto relativo y las etiquetas de periodicidad desde `fechaHoy` de la respuesta (`src/domain/recurrente/vencimiento.ts`), nunca desde el reloj del navegador. Cabecera con el título y, en escritorio, «Nueva plantilla» (enlace con aspecto de botón secundario y `+` de 18 px). Bandeja y comprometido en dos columnas (`minmax(0,1fr) | 400px`, 48 px) desde `xl`; por debajo, comprometido arriba y bandeja debajo. Plantillas a todo el ancho. 48 px entre bloques (32 en móvil). Sin plantillas: `EstadoVacio` «Recurrentes · 0» con «Nueva plantilla».

### Bandeja de recurrentes (`BandejaRecurrentes`)
«POR CONFIRMAR {N}» (en un contenedor angosto «Por confirmar · N») con «Aún no tocan los saldos» / «No tocan los saldos» a la derecha, sobre una raya. Cada ocurrencia lleva **punteada** abajo: es lo pendiente. La fila cambia de forma con el ancho de su contenedor (`@container`, desde `@2xl`), no de la ventana:
- **Ancha:** rejilla `96px | flexible | 150px | auto`, mínimo 64 px. Fecha en cifra-xs y debajo el texto relativo en `etiqueta` secundaria (`salida-texto` si está vencida); concepto en cuerpo 600 con «categoría · cuenta» debajo («Transferencia · Origen → Destino», «Sin categoría»); importe en cifra-s con el signo de su tipo y «≈ » si es estimado, «fijo»/«estimado» en cifra-xs; «Confirmar» (primario), «Ajustar» (secundario) y «Omitir» (texto en `secundario`), todos de 48 px.
- **Angosta:** concepto 600 con «{12 nov} · {mañana} · {cuenta}» e importe a la derecha; debajo `1fr | 1fr | auto` con las tres acciones.
- **Ajustando** (una fila a la vez): fondo `hundido`; el importe se vuelve un campo sobre una raya con su signo (cifra-s alineada a la derecha en la ancha; cifra-l a todo el ancho con «COP» en la angosta), «Último mes: 31.870» en cifra-xs (`etiquetaUltimo`) y los botones «Confirmar {importe}» (primario, con la cifra en mono) y «Cancelar». Enter confirma, Escape cancela; un importe vacío o en cero muestra `MensajeError` y no se envía.
- **Aviso (`AvisoBandeja`):** fila de 44 px sobre una división, arriba de las ocurrencias: marca de 16 px en verde base, el texto en cuerpo (cifras en mono) y «Deshacer» (botón de texto). Dura 5 s o hasta la siguiente acción. No es `AvisoRegistro`: su formato no coincide.
- **Error de una acción:** `MensajeError` bajo la fila; la ocurrencia sigue. `OCURRENCIA_CERRADA` refresca la página.
- **Vacía:** «Nada por confirmar.» (cuerpo 600) y «El próximo aparece 7 días antes de su vencimiento.».

### Comprometido del mes (`ComprometidoMes`)
Encabezado C1 «Comprometido en {mes}», el total en cifra-l con `−` en terracota base (en cero, «0» en tinta) y una barra de 8 px con radio `muestra` y 2 px entre tramos: pagado en `texto`, por confirmar con contorno discontinuo en `texto`, programado en `linea` (ocupa el resto). Los anchos salen de `anchosComprometido` (`bigint`, división entera); ninguna cifra mostrada sale de ella. Tres filas con muestra de 12 × 8, rótulo en cuerpo, « · N pagos» en `etiqueta` secundaria (solo desde md) y cifra-s. Debajo, una línea por ingreso esperado: «Ingreso esperado · {concepto} {30 nov}» en `etiqueta` secundaria y el importe en cifra-s `entrada-texto`.

### Lista de plantillas (`ListaPlantillas`)
«PLANTILLAS {N}» sobre una raya. Con contenedor ancho (`@5xl`), tabla `minmax(0,1.3fr) | 110px | 100px | minmax(0,1.2fr) | 150px | 140px | 170px` (Concepto, Cada, Vence, Cuenta, Categoría, Importe, {Mes}) con rótulos sobre una división; si no, filas con concepto, «{Mensual} · {Día 1} · {estado}» en `etiqueta` e importe. Cada fila es un enlace a `?plantilla=<id>` con fondo `hundido` al pasar el cursor. Estado del mes (`ocurrenciaDelMes`): «Pagado {1 nov}» con check de 14 px y «Programado {25 nov}» con calendario de 14 px en `secundario`; «Por confirmar · {14 nov}» en `marca-texto` y «Vencido · {9 nov}» en `salida-texto`, ambos con subrayado punteado; «Omitido» tachado en `terciario`; sin ocurrencias, «Próximo {18 dic}» o «—». «Pausada desde {12 nov}» manda sobre todo, en `terciario`, con concepto e importe también en `terciario`. Al pie, la nota del «≈» si hay variables y, en móvil, «+ Nueva plantilla» (`EnlaceTexto`).

### Panel de plantilla (`PanelPlantilla`)
`PanelLateral` amplio (480 px; hoja inferior en móvil) abierto por URL (`?plantilla=nueva`, `?plantilla=<id>`), armado solo con piezas existentes: `SelectorTipo` (segmentado; pestañas en móvil), `CampoSubrayado` (concepto, máx. 80, y el `<input type="date">` nativo del primer vencimiento con su línea), `CampoMonto` con el signo del tipo, `OpcionUnica` (Fijo / Variable, Cada, y Día N / Último día solo en mensual o más), la nota de vencimiento en `etiqueta` secundaria, `FichaCuenta` dos por fila («Cuenta», o «Desde» y «Hacia» en transferencia) y `ChipCategoria` con «Sin categoría» (punteado; elegido, normal con check), oculto en transferencia. Pie fijo: «Crear plantilla» / «Guardar cambios», y en edición «Pausar plantilla» / «Reanudar plantilla» (texto) · «Eliminar plantilla…» (vínculo discreto que abre `BloqueEliminar`). Pausada, arriba: «Pausada desde {12 nov}. No genera ocurrencias nuevas.». Si la edición cambia el calendario, la nota de reinicio va sobre el botón. Errores de la API bajo su campo; cerrar con cambios pregunta «¿Descartar los cambios?».
- **Cuenta archivada:** una cuenta de la plantilla que ya no está entre las activas se muestra como `FichaCuenta` sin icono, con su nombre y «Archivada» en lugar del saldo.

### Deudas y préstamos (`/deudas`)
Primera pantalla maestro-detalle. Capital, intereses, totales, estado y vencido llegan de la API; la web arma los textos relativos («89 días», «hace 27 días») con `fechaHoy` de la respuesta (`src/domain/prestamo/presentacion.ts`), nunca con el reloj del navegador. Cabecera con el título y, en escritorio, «Nuevo préstamo o deuda» (enlace con aspecto de botón secundario y `+` de 18 px). Debajo, el consolidado a todo el ancho, el aviso de condonación y, desde `xl`, lista y detalle en `400px | minmax(0,1fr)` con 48 px entre ellas; por debajo de `xl` (escritorio angosto), el detalle va bajo la lista. 32 px entre bloques. `?prestamo=<id>` elige la persona: en escritorio, sin parámetro, se ve la primera; en móvil, sin parámetro solo la lista y con él solo el detalle. Sin préstamos: consolidado en cero y `DiaUnoDeudas`.

### Consolidado de deudas (`ConsolidadoDeudas`)
Desde `lg`: tres columnas iguales bajo una raya, separadas por renglones verticales: rótulo, cifra-l y subtítulo en `etiqueta` secundaria («1 persona · +6.667 de intereses sin cobrar», «A 1 persona · sin intereses»). «Debes» con `−` en terracota base; en cero, «0» en tinta. «Posición neta» en tinta con su signo, sobre doble raya, y la leyenda debajo (se omite con todo en cero). Por debajo de `lg`: filas con rótulo y subtítulo a la izquierda y cifra-m a la derecha («Debes» en `salida-texto`); la posición en 600 sobre doble raya y la leyenda bajo ella. **Día uno:** cifras en `terciario`, doble raya en `linea` y sin leyenda.

### Lista de préstamos (`ListaPrestamos`)
Grupos «Te deben», «Debes» y «Saldadas» en ese orden (los vacíos no salen; el orden interno es el de la API). Rótulo y total en cifra-s sobre una raya; «Debes» con `−` en `salida-texto`; «Saldadas» con el rótulo en secundario y sin total. Cada fila es un enlace a `?prestamo=<id>` sin mover la página: rejilla `20px | flexible | auto`, 12 px, renglón abajo. Icono de 20 px en secundario (↗ otorgado, ↙ contraída, ✓ saldada); nombre en cuerpo 600 (secundario si saldada); debajo «Desde el {14 ago} · {89} días» o el cierre («Pagó todo el 20 sep», «Pagaste todo…», «Condonado el 11 nov») en `etiqueta` secundaria; si está vencida, «Fecha acordada: {15 oct}» con reloj de 16 px en `marca-texto`. A la derecha, capital en cifra-s (le debes con `−` en `salida-texto`; saldada «0» en secundario) y «te debe» / «le debes» / «saldada» en cifra-xs secundaria. La fila elegida y la que está bajo el cursor llevan fondo `hundido`.

### Detalle de préstamo (`DetallePrestamo`)
Es contenedor (`@container`): se acomoda a su ancho, no al de la ventana.
- **Cabecera:** tipo («Préstamo otorgado · te debe», «Deuda contraída · le debes», «Saldada») en `etiqueta` secundaria y nombre en titulo-2; a la derecha, rótulo («Te debe», «Le debes», «Saldo») y capital en cifra-l (le debes con `−` en terracota base; saldada «0» en secundario), sobre una raya. En móvil, «‹ Deudas» arriba y el capital debajo del nombre, tras una raya.
- **Resumen y condiciones:** dos columnas desde 512 px de contenedor (una, si no). Resumen: «Le prestaste» / «Te prestó», «Abonos a capital» (o «Abonos y condonación») con `−` y «Capital pendiente» en 600 sobre doble raya. Condiciones en `etiqueta` secundaria con el valor a la derecha: «Intereses» (`formatearTasa`: «Sin intereses», «1,5 % mensual sobre saldo»), y con tasa «Intereses cobrados» / «pagados» y, si no está saldado, «Causados sin cobrar» / «sin pagar»; siempre «Fecha acordada» o «—».
- **Aviso de fecha vencida:** reloj de 16 px y «Pasó la fecha acordada hace 27 días.» en `marca-texto` 600, con la ayuda («Acordaron el 15 oct. Si cambió el plan, puedes mover la fecha.») en `etiqueta` secundaria. Bajo las condiciones en contenedor ancho; bajo la cabecera en angosto.
- **Historial:** rótulos sobre una raya. Contenedor ≥ 672 px: `64px | flexible | 130px | 110px | 140px` (Fecha, Historial, Capital, Interés, Saldo capital). Angosto: `minmax(0,1fr) | 84px | 84px` (Historial, Capital, Saldo) con «{fecha} · interés +12.000» en cifra-xs bajo la descripción. Capital con su signo; interés con `+` en `entrada-texto` (te debe) o `−` en `salida-texto` (le debes), «—» en `terciario` sin interés; saldo en 500. Cada fila es un enlace a su movimiento en `/movimientos` (fondo `hundido` al pasar).
- **Acciones** (no saldado): «Registrar abono» (primario) y «Cambiar fecha acordada» (secundario), enlaces de 48 px a los paneles; en un otorgado, «Condonar lo pendiente…» a la derecha como botón de texto subrayado en secundario. En contenedor angosto, a todo el ancho y apiladas. Una saldada no tiene acciones.

### Condonar (`CondonarPrestamo`)
Reemplaza la fila de acciones: raya arriba y, en contenedor ≥ 672 px, `minmax(0,1fr) | 320px` con 32 px (una columna si no, con «Qué cambia» bajo la categoría y los botones a todo el ancho). Izquierda: «Condonar a {Camila}» (titulo-2), la explicación según el modo (todo: el préstamo se cierra; parte: el resto sigue corriendo), `OpcionUnica` «Todo lo pendiente {500.000}» / «Solo una parte», con «parte» un campo en cifra-campo con «COP» sobre una raya y su `MensajeError` («No puedes condonar más de lo pendiente.»: se rechaza, no se recorta), «Categoría del gasto» con `ChipCategoria` sin ninguna elegida y, al condonar todo con causados, la nota de intereses. Derecha: «Qué cambia» (`rotulo` sobre raya) con «Gasto de hoy · {categoría}» (`−` en `salida-texto`), «{Camila} te deberá» y «Patrimonio neto {antes} → {después}», y debajo «Condonar {500.000}» (primario, deshabilitado sin monto válido o sin categoría) y «Cancelar». «Qué cambia» es la única resta de montos de la web, asignada al cliente por el contrato.
- **Aviso (`AvisoCondonacion`):** el de la bandeja (`AvisoBandeja`): «Condonado. Se registró un gasto de {500.000} en {Otros}.» con «Deshacer», 5 s. Vive en `ProveedorAvisoDeudas`, fuera del detalle, porque al condonar todo la fila de acciones desaparece. Si deshacer falla, el `mensaje` de la API va en el aviso.

### Paneles de préstamo (`PanelPrestamo`, `PanelAbono`, `PanelEdicionPrestamo`)
`PanelLateral` por URL (hoja inferior en móvil), con piezas existentes. Errores de la API bajo su campo; sin campo, `MensajeError` al pie. Cerrar con cambios pregunta «¿Descartar los cambios?». Al registrar, se cierran hacia `?prestamo=<id>`.
- **Alta y desembolso (`?nuevo=<tipo>`, amplio):** `OpcionUnica` del sentido («Le presté a alguien · queda como activo: te deben» / «Alguien me prestó · …»), «Persona» (`CampoSubrayado`, máx. 60) con las personas de ese sentido como `ChipCategoria`, `CampoMonto`, `FichaCuenta` dos por fila («Sale de» / «Llega a»), fecha nativa, y solo en el alta «Tasa mensual» (con «% mensual · vacío = sin intereses») y «Fecha acordada» («Opcional», `min` = fecha). Si el nombre coincide con alguien del mismo sentido, «Suma al préstamo con {Camila Ortiz}.» (más «Está saldado: se reabre.»), se ocultan tasa y fecha acordada y el botón dice «Registrar desembolso».
- **Abono (`&abono=1`):** «Capital pendiente {500.000} · causados a hoy {6.667}» en `etiqueta` secundaria, `CampoMonto` «Total» (con «Calculando…» como nota mientras llega la propuesta), fecha, y con tasa «Capital» e «Interés» como `CampoSubrayado` en mono (el interés con «Causados al {11 nov}: {6.667}» a la derecha del rótulo), y las fichas («Llega a» / «Sale de»). El botón «Registrar abono {112.000}» lleva la suma de lo escrito. Sin tasa, no hay capital ni interés.
- **Edición (`&editar=1`):** «Persona» y «Fecha acordada» con «Quitar fecha» (botón de texto). «Guardar cambios» deshabilitado sin cambios.

### Día uno de deudas (`DiaUnoDeudas`)
«Nadie anotado todavía.» (cuerpo 600) con la explicación en cuerpo secundario y, sobre una raya, dos filas de 60 px enlazadas al alta: icono (↗ / ↙), «Le presté a alguien» / «Alguien me prestó» en 600 con «Queda como activo: te deben» / «Queda como pasivo: le debes» en `etiqueta` secundaria y chevron a la derecha. 400 px en escritorio. En Cuentas sin cuentas, «Agregar una deuda con alguien» (`EnlaceTexto`) abre el alta con «Alguien me prestó».

### Estado vacío (C7)
«La página en blanco»: el encabezado de sección con un «0» tenue, tres renglones vacíos de 44 px y debajo el título (cuerpo 600), el detalle y la acción con un `+` (un `EnlaceTexto`; si la acción no navega, como abrir la captura, un botón con el mismo aspecto). Si el destino aún no existe, la acción va en `terciario` y deshabilitada («Próximamente»), con la misma caja de 44 px para que no salte.

### Enlace de texto (`EnlaceTexto`)
El hermano de «Botón de texto» cuando la acción navega: latón (`marca-texto`), cuerpo 600, sin caja y 44 px de alto aunque el texto mida 22, para que el objetivo táctil sea completo. Se usa en «← Cuentas», «+ Nueva cuenta», «Ver archivadas» y la acción del estado vacío. Si la acción no navega, es un `Boton variante="texto"`.

### Panel lateral (C22)
Un `<dialog>` modal: foco atrapado y fondo inerte. Cabecera de 56 px con el título en `rotulo` secundario y «Cerrar» en texto, sobre una raya. Solo se cierra cuando quien lo usa decide, así que puede preguntar antes de descartar cambios. Anchos `normal` (400) y `amplio` (480); `pie` opcional fijo. Medidas y movimiento en Layout.

### Selector de tipo (`SelectorTipo`)
Gasto · Ingreso · Transferencia, cada uno un interruptor (`aria-pressed`).
- **Segmentado (escritorio):** tres tramos de 40 px en una caja con borde `linea` y radio de campo, separados por divisiones. Activo: fondo `texto`, texto `fondo`, 600 (como el botón primario). Inactivo: `superficie`, texto `secundario`.
- **Pestañas (móvil):** texto en cuerpo de 44 px; el activo en 600 y tinta, con raya debajo; la transferencia se llama «Transferir».

### Ficha de cuenta (`FichaCuenta`)
Para elegir la cuenta en la captura de escritorio, dos por fila. Grid `20px | flexible`: icono de tipo en `secundario`, nombre en cuerpo y saldo en cifra-xs secundaria («debe 1.284.300» en un pasivo). Borde `linea`, radio de campo, 48 px mínimo. Elegida: borde `texto` y nombre en 600; con monto muestra la vista previa «20.321 → 5.321» (presentación; el saldo vigente lo da la API).

### Aviso de registro (`AvisoRegistro`)
Tras registrar: marca de 16 px en verde base, «Registrado: Almuerzo −15.000 en Nequi» en cuerpo (monto en cifra-s con signo) y «Deshacer» como botón de texto, durante 5 s. Debajo, tras una división, la oferta de regla en `etiqueta` secundaria con «Crear regla» / «Cambiar regla» · «No», que sigue hasta que el usuario responde o registra otro. Borde `linea`, radio de campo, fondo `fondo` en el panel y `superficie` en la hoja móvil (formato compacto: «Almuerzo · Nequi   −15.000   Deshacer»). Sin sombra.
- **Tras editar:** el mismo aviso con otro verbo («Guardado: …», «Eliminado: …») y sin «Deshacer»; si la edición cambió el mes, termina en « · ahora en Octubre 2026».

### Formulario de movimiento, modo edición
El formulario de la captura (panel de 480 px en escritorio, hoja a pantalla completa con teclado propio en móvil) abierto por URL desde el libro, con todos sus campos precargados, tipo incluido.
- **Cambia respecto al registro:** título «Editar movimiento»; sin «Hoy −X», sin conceptos frecuentes, sin «Usar siempre» y sin vista previa del saldo. Botón «Guardar cambios» / «Guardando…» (sin cifra); Enter guarda.
- **Pie:** el botón y, tras una división, «Eliminar movimiento…» como vínculo discreto, que se reemplaza por la confirmación de borrado. Al cerrar con cambios (Escape, «Cerrar», el velo), el botón se reemplaza por «¿Descartar los cambios?» · «Descartar» (primario) · «Seguir editando» (texto).
- **Solo lectura:** con una cuenta archivada, los campos se ven deshabilitados (un `fieldset` deshabilitado), sin botón de guardar ni de eliminar, y arriba «La cuenta {nombre} está archivada. Restáurala para modificar este movimiento.» con «Ver archivadas».
- **Movimiento de préstamo:** la cuenta del préstamo no está entre las activas, pero no está archivada. Se muestra fija en su rol (`FichaCuentaFija`: ficha elegida, no pulsable, con el icono y «Préstamo otorgado» / «Deuda contraída»; en móvil, su celda no abre la hoja) y el selector de tipo queda deshabilitado. Monto, fecha, cuenta propia, categoría y nota se editan.
- **«Más opciones · nota, dividir»:** en ambos modos, la nota y el editor de partes van plegados bajo esta fila; se despliega sola si ya hay nota o partes.
- **«Usar {cuenta} siempre» (solo registro):** si la cuenta elegida no es la predeterminada, botón de texto a la derecha del rótulo «Cuenta · Nequi es la predeterminada». En móvil va al pie de la hoja de cuentas, y la predeterminada lleva «Predeterminada» en su subtítulo.

### Editor de partes (`EditorPartes`)
Dividir un movimiento entre categorías. Sin dividir es solo «Dividir entre categorías» (botón de texto); dividido, el rótulo con «No dividir» a la derecha y una fila por parte: grid `flexible | 112px | 44px` con un `<select>` nativo de categoría (sin caja, `appearance-none`, línea de `CampoSubrayado` y chevron de 18 px), el monto en cifra-s mono a la derecha sobre la misma línea y «Quitar parte» (✕ de 18 px en 44 px) solo desde la tercera. Debajo, «+ Agregar parte» y la línea del restante: «Falta asignar X» en `etiqueta` secundaria, «Sobran X» en `salida-texto` o «Las partes suman el total.», con «El resto» a la derecha cuando completar la última deja un monto mayor que cero. El error (local o de la API) va al final con `MensajeError`.
- Cada `<select>` ofrece las categorías del tipo que no usa otra parte. Con partes, los chips de categoría se ocultan.
- En escritorio vive bajo «Más opciones»; en móvil, en la hoja de Categoría, y los montos usan el teclado del sistema (`inputMode="numeric"`): el teclado propio es del total.

### Teclado numérico (`TecladoNumerico`)
Solo en la captura móvil, en vez del teclado del sistema. Tres columnas de teclas de 56 px (1–9, 000, 0, borrar) en cifra-m 400, fondo `fondo`, separadas por divisiones de 1 px y radio 0; pulsada, `hundido`. Ignora los ceros a la izquierda y no pasa de 19 dígitos (`aplicarTecla`, en `src/domain/dinero/entrada.ts`).

### Confirmación de borrado (`BloqueEliminar`)
La confirmación ocurre en la misma página, sin diálogo emergente: reemplaza al vínculo que la abrió, en el panel, en la fila o en la edición de un movimiento. Vive en `src/components/bloque-eliminar.tsx`.
- **Contenido:** «Eliminar {nombre}» en `rotulo` y la frase de irreversibilidad (`detalle`) en cuerpo. Cada función trae la suya: cuentas, «Se borra para siempre, con su historial de cambios. No se puede deshacer.»; un movimiento, «El saldo de Nequi vuelve a como estaba. No se puede deshacer.». Debajo, el botón secundario «Eliminar {nombre}» con el texto en `salida-texto` y «Cancelar» como botón de texto.
- **Por qué terracota:** borrar es irreversible y debe distinguirse de las demás acciones. El acento queda en el texto, nunca de fondo.
- **Vínculo que la abre:** discreto, en `etiqueta` o cuerpo `secundario` y terminado en «…» («Eliminar cuenta…», «Eliminar movimiento…»).

### Fila en edición (C19)
Una fila que se abre en su lugar para resolver algo sin salir de la lista. Se usa al restaurar una cuenta archivada cuyo nombre ya está en uso. La fila pasa a `superficie` entre dos rayas y muestra, bajo el nombre, la explicación en `etiqueta` secundaria, un campo subrayado y la acción primaria con «Cancelar» en texto. Al cerrarse vuelve a ser una fila normal.

### Campo dependiente
Un campo que solo existe con cierta opción (el cupo de una tarjeta) no aparece ni desaparece de golpe: se despliega en su lugar, como se describe en Layout → Movimiento. Al plegarse, su valor se descarta.

### Navegación (C14)
- **Escritorio:** columna de 232 px. Arriba la marca «TINO» (titulo-2, 700, tracking amplio), luego «Registrar» como único botón en tinta (con la marca de tecla «N» en mono cifra-xs, borde `secundario`, radio de muestra) y después las entradas de 40 px con icono de 20 px. Inactiva: `secundario`, pasa a `texto` al pasar el cursor. Activa: fondo `hundido`, peso 600, radio de campo. Al pie, cambiar tema y salir. «Registrar» y la tecla N abren la captura sobre la página actual, sin cambiar la URL.
- **Portada:** `/` lleva a `/resumen`, la primera entrada del menú y de la barra (también tras iniciar sesión).
- **Móvil:** barra inferior de cinco pestañas con icono y rótulo de 11 px. «Registrar» va al centro en un cuadro de 40 px en tinta y abre la captura a pantalla completa; «Más» abre una hoja con el resto.
- **Deshabilitado:** los destinos sin construir se muestran en `secundario` con `aria-disabled` y el título «Próximamente».

### Iconos
Lucide, 20 px, trazo 1,5, en `currentColor` (el color del texto al que acompañan). Hay uno por destino de navegación y uno por tipo de cuenta, y solo se definen en `src/components/iconos.tsx`. Los iconos auxiliares dentro de controles (`+`, check, flechas) van a 16 o 18 px.

## Do's and Don'ts

### Do:
- **Do** usar solo los tokens de color, tipo, espaciado y radio de este archivo; Tailwind tiene sus escalas por defecto vaciadas para impedir lo contrario.
- **Do** poner toda cifra en `font-mono tabular-nums`, alineada a la derecha, y formatearla con `src/domain/dinero/formato.ts`.
- **Do** separar con divisiones y espacio; reservar la hoja (superficie con borde) para activos y paneles.
- **Do** tomar signo y color de una cifra de `naturaleza.ts` (RN-02).
- **Do** usar la variante `-texto` de un acento por debajo de 24 px.
- **Do** mostrar cada componente nuevo y sus variantes en `/estilos`, en ambos modos.
- **Do** mantener 44 px de objetivo táctil en móvil.

### Don't:
- **Don't** usar sombras, resplandores ni elevación en ningún estado.
- **Don't** usar un acento (latón, verde, terracota) como fondo de un bloque, botón o fila.
- **Don't** usar radios mayores de 6 px ni píldoras.
- **Don't** escribir un negativo con guion `-`; siempre `−` (U+2212).
- **Don't** poner iconos en las filas de movimientos.
- **Don't** dejar que una etiqueta pese más que su monto.
- **Don't** introducir colores, tamaños, radios ni espaciados fuera de lo listado.
- **Don't** construir un componente del catálogo que no figure en «Components» antes de que su pantalla tenga spec.

### Desvíos registrados
Lugares donde el código construido se aparta del sistema. **No son norma**: cada uno se corrige o se convierte en token tras decidirlo, y en ese caso se actualiza este archivo primero.

1. **Tamaños tipográficos fuera de escala.**
   - `17/22` y `17/26` en el saldo de la fila de cuenta en móvil (`cuentas/fila-cuenta.tsx`), en «Patrimonio neto» en móvil (`cuentas/cierre-patrimonio.tsx`), en el campo subrayado y en la columna de acceso (`acceso/*`).
   - `28/32` en la cifra del patrimonio en móvil.
   - `12/18` en acceso.
   - `11/14` escrito a mano en la barra de pestañas, en vez de `text-rotulo`.

   El documento de referencia usa 17 px en filas de cuenta y textos de introducción. Si se queda, debe pasar a token (por ejemplo `cifra-fila` o `cuerpo-l`).
2. **Espaciados fuera de la escala base 4.** Menú, layout y lista de cuentas ya están en la escala. Quedan en acceso (`acceso/*`: 20 px `pt-5`, 28 px `gap-7` y otros). Los 76 px de «Sin activos/pasivos» en escritorio (`pl-[76px]`) no son un paso de espaciado: alinean el texto con la columna del nombre (28 + 12 + 24 + 12).
3. **Radios circulares.** `rounded-full` en el círculo del radio de opción única y en el monograma «G» del botón de Google. El círculo del radio sigue la convención nativa del control; queda por decidir si se acepta como excepción explícita.
4. **Peso 700 y tracking 0.16em fuera de la escala** en la marca «TINO» (menú lateral, acceso y `/estilos`). Viene del documento de referencia. Si se queda, debe ser un token de marca, no un estilo suelto.
5. **Alturas sueltas.** Botones de acceso de 52 px, frente a los 48 px de C6.
6. **Numeración.** El código llama C26 a la confirmación de borrado, pero en el catálogo C26 es «Condonar». Hay que alinear la referencia.
