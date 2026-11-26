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
    fontSize: "13px"
    lineHeight: "18px"
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
    fontSize: "14px"
    lineHeight: "20px"
    fontWeight: 500
  rotulo:
    fontFamily: "Familjen Grotesk, system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: "16px"
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
- **Tinta tenue** (`terciario`; oscuro `terciario-oscuro`): marcadores de posición, el «0» de un campo vacío, estados deshabilitados, borde punteado. Contrasta 2,8:1: **nunca es texto informativo** (un rótulo, un mes, una cifra que hay que leer). Para eso, `secundario` (5,3:1).
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
- **cifra-xs** (400, 13/18): fechas, equivalencias en COP, TRM, «Usado 32 %», porcentajes y variaciones del resumen y las etiquetas de la gráfica.

Texto:
- **titulo-1** (600, 28/34, −0.01em): título de página.
- **titulo-2** (600, 20/26): título de bloque; también la marca TINO del menú lateral.
- **cuerpo** (400, 15/22): texto base, conceptos de movimiento, nombres, botones.
- **etiqueta** (500, 14/20): rótulos de campo y subtítulos. Se usa con `font-normal` en mensajes de ayuda y error.
- **rotulo** (600, 12/16, +0.08em, MAYÚSCULAS): rótulo de encabezado de sección, de panel y de grupo de opciones.

Los tres roles chicos (cifra-xs, etiqueta, rotulo) subieron un punto (antes 12, 13 y 11 px) para que se lean sin esfuerzo en tablas densas como el resumen: el piso de la interfaz es 12 px, y solo en mayúsculas espaciadas.

### Named Rules
**The Mono-Money Rule.** Todo importe monetario va en IBM Plex Mono con dígitos tabulares, sin excepción, también dentro de un botón («Registrar gasto 18.500»).

**The Weight-Step Rule.** El monto siempre va un escalón de peso por encima de su etiqueta. Nunca al revés.

**The Colombian-Format Rule.** Punto de miles y coma decimal. Pesos sin decimales (`1.234.567`), dólares con dos (`US$ 7.750,00`). Negativo con `−` (U+2212), nunca guion. «COP» se omite cuando toda la columna está en pesos. Toda cifra en otra moneda lleva debajo, en secundario, su equivalente y la tasa: `≈ 31.775.000 COP · TRM 4.100,00`. El formato vive en `src/domain/dinero/formato.ts`; ningún componente formatea a mano.

## Layout

**Espaciado:** base 4, escala cerrada `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (en Tailwind `1 · 2 · 3 · 4 · 6 · 8 · 12 · 16`; `--spacing: 4px`). Las alturas de control (40, 44, 48, 56 px) son medidas de objetivo táctil, no pasos de espaciado.

**Estructura de la aplicación:**
- **Escritorio (md, 768 px o más):** menú lateral fijo de 232 px con borde derecho en renglón, y contenido a todo el ancho restante (sin máximo: se ajusta a la ventana). Márgenes laterales de 24 px (md) y 48 px (lg). El contenido arranca 24 px más arriba que el menú (32 px), para que «TINO» y el título de página compartan línea base.
- **Móvil:** márgenes de 16 px, barra inferior de cinco pestañas de 56 px más la zona segura (mínimo 28 px), con «Registrar» en el centro como único botón en tinta.

**Filas y columnas:** las listas son grids con columnas fijas. La fila de movimiento usa `52px | flexible | auto`, con 12 px entre columnas y alineación por línea base. Las cifras siempre se alinean a la derecha. Objetivo táctil mínimo de 44 px en móvil (los chips crecen de 36 a 44 px).

**Paneles:** en escritorio, una hoja lateral de 400 px a todo el alto con raya a la izquierda; 480 px (`ancho="amplio"`) cuando el formulario necesita dos columnas, como la captura rápida. Un panel puede llevar un pie fijo (la acción principal) bajo el contenido desplazable, sobre una división. En móvil, una hoja inferior de ancho completo (hasta 90 dvh) con radio superior de 6 px. El velo oscurece el libro con `fondo` al 60 %. Mientras hay un `<dialog>` modal abierto, la página de fondo no se desplaza (`html:has(dialog:modal)` en `globals.css`) y el contenido del panel contiene su propio desplazamiento (`overscroll-contain`); el canal de la barra queda reservado (`scrollbar-gutter: stable`) para que nada salte de ancho.

**Captura rápida en móvil:** no es un panel sino una hoja a pantalla completa (`<dialog>`, por encima de la barra de pestañas): cabecera de 56 px con cerrar, tipos y «Hoy −X» (en la edición, «Editar» en `rotulo` secundario en su lugar); el monto en el centro (`cifra-xl`; baja a `cifra-campo` desde 10 caracteres, `cifra-l` desde 12 y `cifra-m` desde 16, para que hasta 19 dígitos quepan en 390 px sin cortarse); bajo la descripción, la nota plegada en una línea de 44 px («+ Nota» en latón 600, o «Nota · {texto}» truncado en `etiqueta` secundaria) que abre la hoja «Nota» con un área de texto subrayada (máx. 500) y el cursor ya dentro; los conceptos en una fila desplazable de chips; la fila Categoría │ Cuenta │ Fecha (56 px, cada celda abre una hoja inferior con «Listo»); el teclado numérico; y el botón. El aviso de registro flota sobre el botón.

**Movimiento:** se usa solo para explicar un cambio de estado. Siempre se sale más rápido de lo que se entra. Las curvas son tokens de `globals.css` y nunca se escriben a mano:
- **Llegada** (`--llegada`, `ease-llegada`; `cubic-bezier(0.16, 1, 0.3, 1)`): desaceleración marcada, para lo que entra en escena.
- **Retirada** (`--retirada`, `ease-retirada`; `cubic-bezier(0.4, 0, 1, 1)`): aceleración, para lo que sale.
- **Despliegue** (`--despliegue`, `ease-despliegue`; `cubic-bezier(0.22, 1, 0.36, 1)`): desaceleración más pareja, para que se vea crecer una fila.

En JavaScript (Web Animations), las curvas se leen de esas variables, porque WAAPI no acepta `var()`. Las duraciones no son tokens y van con la utilidad `duration-*`.

Hay dos movimientos generales y los del resumen:
- **Panel lateral:** la hoja llega desde el borde en que se ancla y el velo oscurece el libro a la vez. Entra con llegada (320 ms escritorio, 380 ms móvil) y sale con retirada (180 / 200 ms). La salida termina antes de que cambie la URL. La hoja de captura móvil sube desde abajo con las mismas medidas que el panel en móvil.
- **Despliegue de un campo:** un campo que depende de otro (el cupo al elegir tarjeta) se abre en su lugar. La fila crece de `0fr` a `1fr` en `grid-template-rows`, sin animar `height`, y el campo aparece con un fundido y baja 4 px. Entra con despliegue en 300 ms y sale con retirada en 180 ms. Plegado queda `inert`.

- **Retroalimentación de controles (toda la app):** todo lo que se pulsa lleva el cursor de mano (regla base en `globals.css`; lo deshabilitado, `not-allowed`). Los cambios de color, fondo y borde de enlaces, botones y filas con fondo `hundido` al pasar el cursor tienen una transición de 150 ms con llegada. Los botones C6, los chips, las fichas de cuenta, los desplegables de filtro y las teclas del teclado numérico llevan la utilidad `presion`: ceden a 0,98 al pulsar (75 ms) y vuelven en 150 ms. Al pasar el cursor, el botón secundario, los chips sin elegir, las fichas sin elegir y los desplegables inactivos oscurecen su borde a `secundario`. El botón primario (y su enlace, `BOTON_ENLACE.primario`) aclara su tinta al 85 % (`bg-texto/85`, que en oscuro atenúa el papel claro); el botón de texto y `EnlaceTexto` se subrayan en su color, línea de 1 px a 4 px del texto, con el subrayado fundiéndose desde transparente (150 ms, llegada). Deshabilitados, nada cambia.

Con movimiento reducido no hay desplazamiento, pero se conserva la opacidad: el panel se funde (150 / 120 ms) y el campo cambia de alto de golpe. Con `presion`, el control no cede pero el color sigue cambiando.

**Resumen** (solo en `/resumen`, utilidades `asentar` y `trazo` de `globals.css`):
- **Asentar:** al cambiar de mes, el contenido reemplaza al esqueleto con un fundido de 220 ms (llegada), sin desplazamiento. También lo usa el libro de movimientos.
- **Trazo:** las barras de gasto por categoría (y la punteada de «Sin categoría») se trazan desde la izquierda con `scaleX`, 520 ms con llegada, escalonadas 40 ms por fila con tope de 200 ms. Dicen que la proporción es del mes recién cargado. Nunca se anima `width`.
- **Flechas de mes:** al pasar el cursor, el chevrón se corre 2 px hacia el mes al que lleva (150 ms, llegada) y el color cambia con transición. Deshabilitada, quieta.
- **Presión:** los botones del día uno y «Agregar otra cuenta» usan la `presion` general; «Agregar otra cuenta» oscurece su borde a `secundario` al pasar el cursor. «Clasificar» funde su color al pasar.
- Sin rebotes, sin elásticos, sin entradas en cascada de secciones. Con movimiento reducido: las barras solo se funden (150 ms), las flechas no se corren y los botones no ceden.

## Elevation & Depth

Tino es completamente plano. Ningún componente lleva sombra, y las escalas de sombra de Tailwind están vaciadas en `globals.css` (`--shadow-*: initial` y sus variantes). La profundidad se transmite con tres recursos: el cambio de tono entre `fondo`, `superficie` y `hundido`; el borde en `linea` de una hoja; y las cuatro líneas del libro. Un panel se distingue del contenido por su raya lateral y el velo, no por elevación. El foco es un contorno de 2 px en latón con 2 px de separación, nunca un resplandor.

### Las cuatro líneas
- **División** (1 px, `linea`): entre filas de una lista. **Corte de día:** en el libro de movimientos (escritorio), el primer renglón de cada día salvo el primero lleva además arriba una división en `terciario`; junto a la del renglón anterior se lee como un corte más firme, sin llegar a la raya. Es la división en otro tono, no una quinta línea.
- **Raya** (1 px, `raya`): bajo un encabezado de sección, bajo el campo de monto y en el borde del panel.
- **Doble raya** (3 px doble, `raya`; utilidad `doble-raya`): cierre de un total, como el patrimonio neto.
- **Doble renglón** (utilidad `doble-renglon`, 3 px doble en `linea`): el cierre de una tabla todavía vacía (día uno), donde la doble raya en tinta prometería un total.
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
- **Compacto (`compacto`):** 44 px de alto en vez de 48, para un botón de texto dentro de una fila, un aviso o una cabecera móvil («Restaurar», «Seleccionar», «Deshacer», «+ Agregar parte»). Es una prop, no un `h-11` en `className`, que perdía contra el alto de la base.
- **Enlace con aspecto de botón (`BOTON_ENLACE`):** las mismas medidas y la misma `presion`; el secundario oscurece su borde a `secundario` al pasar el cursor.

### Chips de categoría (C5)
- **Estilo:** fondo `superficie`, borde `linea`, radio de campo, 36 px de alto en escritorio y 44 px en móvil.
- **Seleccionado o sugerido:** borde `texto`, peso 500 y marca de verificación de 16 px. El sugerido añade «auto» en mono `rotulo` latón, porque lo puso una regla de texto.
- **Sin clasificar:** borde discontinuo `terciario`, texto `secundario`.
- **Interactivo:** con `onClick` es un interruptor (`aria-pressed`). En la captura, tocar el sugerido lo quita (RN-11: la regla propone, el usuario dispone) y se registra sin clasificar; tocar otro lo elige. Sobre los chips, «Sugerida por «palabra»» en `etiqueta` latón.
- **Como opción:** el mismo chip sirve para elegir entre opciones cortas que no son categorías (conceptos frecuentes; Hoy · Ayer · Anteayer · Otra fecha; símbolos de posiciones abiertas).
- **Como enlace (`href`):** navega sin mover la página (`aria-current="page"` en el elegido, con su marca) y puede llevar una cifra tras el rótulo (`detalle`, mono cifra-xs secundaria). Lo usa el selector de inversiones.
- **Estático (`estatico`):** solo presenta, sin control: un `<span>` neutro con borde `linea`, en `etiqueta` y 8 px de relleno, al alto del renglón (22 px) para no engrosar la fila. Lo usa la categoría «Ajuste» en el libro de movimientos.

### Tarjeta de cuenta (C3)
- **Activo:** hoja: fondo `superficie`, borde `linea`, radio de hoja, 16 px de relleno.
- **Pasivo:** sin hoja: borde `linea` sobre el fondo, con «DEBES» en `rotulo` sobre la cifra. El cupo va como barra de 4 px (radio de muestra) en `texto` sobre `linea`, con «Usado %» y «Disponible X de Y» en cifra-xs. El disponible se calcula (RN-18). Corte y pago límite van bajo una división.
- **Cabecera:** grid `20px | flexible | auto`: icono de tipo de cuenta, nombre (cuerpo 600) y subtítulo, cifra-m a la derecha. En USD lleva debajo la equivalencia y la TRM con su fecha.

### Fila de cuenta (C10)
La versión en lista de la cuenta, dentro de un grupo de Activos («Lo que tienes») o Pasivos («Lo que debes»). Los activos van en hoja y los pasivos sobre el fondo. El saldo del pasivo va en `salida-texto`, y su barra de cupo en terracota base. El grupo cierra con Activos, Pasivos y, tras la doble raya, el Patrimonio neto en cifra-l.
- **Sangría común:** activos, pasivos, cierre y enlaces comparten la sangría de la hoja (`SANGRIA_LISTA`), así que todas las cifras caen en la misma columna, también en móvil.
- **Como enlace:** fuera del modo «Ordenar», el nombre es un enlace a su detalle (`/cuentas/<id>`) estirado sobre toda la fila, que toma fondo `hundido` al pasar el cursor, de borde a borde de la hoja; el foco dibuja el contorno de latón por dentro de la fila. A la derecha, un lápiz de 18 px en un botón de 44 px (`secundario`, «Editar {nombre}») abre `PanelCuenta` sin salir de la lista; va por encima del enlace estirado, como hermano. En «Ordenar» deja de serlo y muestra el agarre y las flechas de 44 px.
- **Inversión:** enlaza a su detalle en `/inversiones?inversion=<id>` (se edita desde ahí con «Editar cuenta»). Escritorio: tipo «Inversión · USD» (en COP, «Inversión»), detalle «US$ 7.750,00 × 4.120,00» en mono cifra-xs (valor de mercado × tasa), saldo en COP y «US$ 7.750,00» debajo en cifra-xs secundaria. Móvil: subtítulo «Inversión · TRM 4.120,00». USD sin TRM: «Sin TRM» en `marca-texto` en lugar del saldo.
- **Tarjeta en móvil:** el subtítulo es solo «Cupo 4.000.000» (cifra en mono cifra-xs, sin cortarse; con una cifra muy larga, baja entera a la línea siguiente): el ícono y el grupo Pasivos ya dicen que es una tarjeta, y «Tarjeta de crédito · cupo …» ocupaba tres líneas en 390 px. Debajo, la barra de 4 px con «Usado 32 %» y «Disponible 2.715.700». El nombre puede ocupar dos líneas antes de cortarse con «…» (en escritorio, una).
- **Cabecera de Cuentas:** «Saldos al 11 nov 2026 · USD a TRM 4.120,00» (móvil «Al 11 nov · …»), la tasa en mono; desactualizada, «· sin actualizar» en `marca-texto`.

### Campos
- **Campo de monto (C4):** sin caja, con raya inferior (en `salida` si hay error). Con `signo`, lleva delante `−` o `+` en la base del acento (la cifra mide 44 px). Etiqueta en `etiqueta` secundario, cifra en `cifra-campo` y moneda a la derecha. Vacío muestra un «0» en `terciario` y un cursor de 2 px en latón. En USD lleva la equivalencia debajo. Al escribir formatea en su moneda sin mover el cursor: pesos sin decimales, dólares con coma y hasta dos decimales (`formatearEntrada`, teclado `decimal`). Con foco, la raya pasa a latón y el contorno de foco rodea el campo entero (etiqueta, cifra y moneda), no solo la cifra. `admiteComa` (solo pesos) deja escribir una coma decimal para rechazarla con su mensaje en vez de descartarla en silencio (saldo contado del ajuste).
- **Campo subrayado (`CampoSubrayado`):** etiqueta arriba y texto sobre una línea `linea` que pasa a `raya` con el foco. 44 px de alto. Con la prop `error`, la línea pasa a terracota (`salida`), el input queda con `aria-invalid` y el mensaje va debajo, enlazado con `aria-describedby`. Con `sufijo`, la unidad («%») va sobre el mismo renglón, en `etiqueta` secundaria (la tasa de la tarjeta).
- **Mensaje de error (`MensajeError`):** `etiqueta` con `font-normal` en `salida-texto` y `role="alert"`, bajo el campo o al pie del bloque. Es el único modo de mostrar un error; no se escribe el párrafo a mano. Los campos (`CampoSubrayado`, `CampoMonto`, `OpcionUnica`) lo usan a través de su prop `error`.
- **Nota:** `etiqueta` con `font-normal` en `secundario` («Cambiarlo queda registrado.»).

### Campo de fecha (`CampoFecha`)
El único modo de pedir una fecha en un formulario: no queda ningún `<input type="date">` ni `type="month"` nativo (azul, fuera de paleta). Como `CampoSubrayado`: etiqueta arriba (con `extra` a la derecha, p. ej. «Opcional») y el valor en cuerpo sobre un renglón de 44 px (`linea`, `raya` con el foco o abierto, terracota con `error` o `invalido`), con un calendario de 18 px en secundario a la derecha. Valor: «mar 24 nov 2026» (o «Noviembre 2026» en `modo="mes"`); vacío, el texto de `vacio` en secundario («Elegir fecha», «Sin fecha acordada», «Hasta hoy»). Al pulsarlo, el `Calendario` (o `CalendarioMeses`) se abre debajo en una hoja `superficie` con borde `raya` y radio de campo, de 320 px, entrando con «Asentar» y con el foco en la casilla activa; con `enLinea`, en el flujo y a lo ancho (máx. 400 px). Elegir cierra la hoja y devuelve el foco al campo; Escape (sin cerrar el panel que lo contiene) y un clic fuera también la cierran. `min` y `max` deshabilitan las casillas fuera de rango y las flechas de mes sin días elegibles. `hoy` es siempre `fechaHoy` de la API.
- **Cuadrícula de meses (`CalendarioMeses`):** «‹ 2026 ›» y doce casillas de 40 px (44 en móvil) en tres columnas con el mes corto en cuerpo, con el mismo trato que los días (elegido en tinta llena, el actual en latón, fuera de rango en `terciario`). Flechas: un mes; arriba y abajo, tres; RePág/AvPág, un año.

### Opción única (C34)
Filas de 44 px separadas por divisiones, con un radio nativo oculto y dibujado como círculo de 18 px (borde `terciario`; elegido: borde y punto en `texto`, rótulo en 600). Icono opcional de 20 px en secundario. Detalle opcional bajo el rótulo en `etiqueta` secundaria («Apartar parte del saldo» / «Varias metas pueden compartir la cuenta.»); la fila crece con 8 px arriba y abajo. Cifra opcional tras el rótulo (`cifra`, ya formateada), en cifra-s mono tabular a 8 px: «Todo lo pendiente 500.000». Una opción puede ir deshabilitada sola (`terciario`, sin poder elegirse) mientras el grupo sigue activo. El rótulo del grupo va en `rotulo` secundario.

### Encabezado de sección (C1)
Rótulo en MAYÚSCULAS a la izquierda y cifra-s a la derecha, alineados por línea base sobre una raya, con 8 px de relleno inferior. Entre grupos se separa con 24 px de espacio, nunca con otra línea.

### Fila de movimiento (C2)
Sin icono. Grid `52px | flexible | auto` con división inferior y 12 px de relleno vertical. Fecha en cifra-xs secundaria, concepto en cuerpo, y debajo categoría · cuenta en `etiqueta` secundaria (sin clasificar: «Sin clasificar» con línea punteada; con partes: «Dividido»). Monto en cifra-s con signo y color según patrimonio, tomado del tipo; en USD, la equivalencia debajo. El recién registrado o guardado (`resaltada`) toma fondo `hundido` y peso 600 en concepto y monto mientras dura su aviso.
- **Partes (sub-renglones):** un movimiento dividido lleva bajo la fila un renglón por parte, con la misma sangría que el concepto: categoría en `etiqueta` secundaria y monto en cifra-xs secundaria, sin signo (el signo es del total), alineado con el importe.
- **Como enlace (`href`):** toda la fila abre su edición. El enlace es el concepto, estirado sobre la fila con un pseudo-elemento (un solo objetivo, nombrado por el concepto); al pasar el cursor, fondo `hundido`.

### Libro de movimientos (`/movimientos`)
Referencia: `referencias/export-movimientos/Movimientos.dc.html`. En escritorio, rejilla `52px | 2fr | 1fr | 1,2fr | (0,7fr desde lg) | 128px` (Fecha, Concepto, Categoría, Cuenta, Persona desde `lg`, Monto a la derecha) con rótulos entre dos rayas y divisiones entre filas. Categoría en `etiqueta` tinta («Transferencia» en secundario, «Sin clasificar» punteada); cuenta y persona en `etiqueta` 400 secundaria. En móvil, filas C2. Transferencia: «origen → destino» en la cuenta y sin signo.
- **Cabecera:** «Movimientos» (titulo-1) y a la derecha la cantidad visible en mono («26 movimientos»; en móvil solo la cifra). Sin sumas de entradas ni salidas: la web no suma montos (REGLAS §5).
- **Filtros (`FiltrosMovimientos`):** bajo la cabecera. Fecha cambia de mes por URL (`?mes=`; el actual y los 11 anteriores) y reemplaza a la navegación de meses en esta pantalla. Búsqueda, Cuenta, Categoría, Tipo y Persona filtran en el cliente los movimientos ya cargados (`src/domain/movimiento/filtros.ts`); sus opciones salen del mes. Persona = nombre de la cuenta de préstamo en un extremo. Sin resultados: «Nada con estos filtros.» · «Prueba otro mes o limpia los filtros.» y «Limpiar filtros» (botón de texto).
- **Agrupación por día:** los movimientos del mismo día van juntos. Escritorio: la fecha solo en la primera fila del día, y entre días el corte de día (división en `terciario` sobre la primera fila, ver «Las cuatro líneas»). Móvil: encabezado por día («mié 11 nov», `rotulo` sobre raya, 24 px entre días) y filas C2 sin columna de fecha.
- **Filas:** cada una es un enlace a `?mes=…&movimiento=<id>` (sin mover el scroll); las partes van como sub-renglones del Concepto al Monto.
- **Ajuste de saldo:** «Ajuste de saldo» como concepto, la categoría «Ajuste» como `ChipCategoria` estático (en móvil, en el texto de la fila), la cuenta que trae y el importe con «+» y `entrada-texto` si sube el saldo (trae `cuentaDestino`) o «−» y `salida-texto` si lo baja. No cuenta en ingresos ni gastos. Ni la captura ni el filtro de tipo lo ofrecen; la categoría «Ajuste» sale en el filtro solo si hay ajustes en el mes.
- **Carga (`EsqueletoMovimientos`):** al entrar (`loading.tsx` de la ruta y de la subruta) y al cambiar de mes (`<Suspense key={mes}>`). La misma forma que la página: cabecera real (con «← Movimientos» en la subruta), buscador y filtros con sus rótulos, rótulos de la tabla entre rayas y renglones del alto real (escritorio 48 px; móvil, dos días con filas C2 de 67 px), con bloques `linea` (radio `muestra`, pulso solo con `motion-safe`) donde van los datos; nunca cifras inventadas. «Cargando movimientos…» en un `role="status"` oculto. Al llegar, el libro entra con «Asentar» (220 ms).
- **Abriendo una edición:** abrir `?movimiento=` espera al servidor sin `loading.tsx`, así que la fila pulsada toma fondo `hundido`, `aria-busy` y late (`motion-safe:animate-pulse`) hasta que llega el panel. Con movimiento reducido, solo el fondo.
- **Aviso:** tras guardar o eliminar, el `AvisoRegistro` va arriba de la lista («Guardado: …» / «Eliminado: …», sin «Deshacer») con la oferta de regla si aplica.
- **Vacío:** en el mes actual, «Aún no registras movimientos este mes.»; en otro, «No hay movimientos en {mes}.» · «Registra uno o cambia de mes.». Los filtros siguen visibles para cambiar de mes.
- **Gastos sin clasificar** (subruta `/movimientos/sin-clasificar?mes=`, desde el resumen; el antiguo `?sinClasificar=1` redirige ahí): cabecera con «← Movimientos» (`EnlaceTexto`, vuelve a `/movimientos?mes=`) sobre el título «Gastos sin clasificar» (titulo-1) y la cantidad a la derecha. Mismos filtros; la fecha cambia de mes sin salir de la subruta. Solo esos gastos, con las mismas filas, cuyos enlaces y el cierre de la edición se quedan en la subruta. Al clasificar uno, sale de la lista. Vacío: «Sin clasificar · {mes}», «No quedan gastos sin clasificar en {mes}.» y «Ver todos» (sin `+`). El menú marca «Movimientos».

### Filtros de movimientos (`FiltrosMovimientos`)
- **Buscador:** caja `superficie` con borde `linea` (raya con foco; el contorno de foco rodea la caja, no el texto), radio de campo, 36 px (44 en móvil), lupa de 18 px en secundario y texto en cuerpo; el texto de ejemplo («Buscar concepto, cuenta o categoría») va en `secundario`, no en `terciario`, porque informa qué se puede buscar; con texto, «Borrar búsqueda» (✕ de 16 px en secundario, objetivo de 36/44 px) en lugar de la ✕ nativa; 300 px en escritorio, ancho completo en móvil. Es la excepción a «los campos son una línea»: es un control de filtro, como los chips.
- **Desplegable:** botón de 36 px (44 en móvil) con fondo `superficie`, borde `linea` y radio de campo: rótulo en `etiqueta` secundaria, valor y chevron de 16 px. Activo: borde `texto` y valor en 600. En móvil la fila se desplaza en horizontal y el botón muestra solo el valor (o el rótulo en «Todas»). Las opciones van en una lista `superficie` con borde `raya` (mín. 200 px, bajo el botón en escritorio; a todo el ancho bajo la fila en móvil), 36 / 44 px por opción, la elegida en 600 con check de 16 px, fondo `hundido` al pasar el cursor. Escape o un clic fuera la cierran. Al abrir, la lista entra con «Asentar» y el chevron gira 180° (150 ms, llegada); con movimiento reducido, solo el fundido y el chevron gira sin transición.
- **Limpiar filtros:** botón de texto en `marca-texto` 600, solo con algún filtro activo.

### Navegación de meses (`NavegacionMes`)
`‹` y `›` como objetivos de 44 px con chevrones de 18 px en `secundario` (pasan a `texto` al pasar el cursor), y entre ellos el mes («Noviembre 2026») en cuerpo 600. A la derecha, «Este mes» (`EnlaceTexto`) solo fuera del mes actual. Cada mes es una URL (`?mes=YYYY-MM`). Las flechas se nombran con el destino: «Mes anterior: Octubre 2026». Cambiar de mes desmonta la navegación (el resumen va en un `<Suspense key={mes}>`): la nueva devuelve el foco a la flecha pulsada, o a la otra si esa ya no está activa, para que el teclado no vuelva al inicio de la página.
- **Límites** (`hayAnterior`, `haySiguiente`): la flecha sigue visible pero deshabilitada (`terciario`, sin enlace), para que el mes no salte y la navegación se lea siempre. En `/resumen` los da la API (`limitesMes`: `‹` deshabilitada en el mes de inicio o antes, `›` en el actual).
- **Variante título** (`variante="titulo"`): el mes es el `h1` (titulo-1) y los chevrones van en `texto`. Escritorio: `‹ Mes ›` con flechas de 40 px, 4 px entre piezas, y la `‹` corrida 10 px a la izquierda para que el chevrón quede a plomo con el rótulo. Móvil: el mes a la izquierda y `‹ ›` (44 px) a la derecha. Sin «Este mes».

### Resumen del mes (`/resumen`)
Pantalla de solo lectura: toda cifra, variación y porcentaje llega de la API y aquí solo se formatea; la web no suma, no resta ni calcula porcentajes. Porcentajes en décimas, con `formatearPorcentaje` (aritmética entera, «—» sin base). Secciones separadas por 48 px en escritorio y 32 px en móvil.
- **Puntos de quiebre:** con el menú lateral, `md` deja 488 px de contenido, donde no caben tres cifra-l ni la tabla. Aquí «escritorio» empieza en `lg` (cabecera en fila, tabla de categorías); las cifras van en tres columnas y patrimonio y cambio lado a lado desde `xl` (en `lg`, un tercio deja 184 px y una cifra de 8 dígitos en cifra-l mide 204); por debajo, el formato móvil a todo el ancho.
- **Ancho:** el contenido del resumen tiene un tope de 1440 px (también el día uno y el esqueleto), para que en pantallas muy anchas el rótulo y su cifra no se separen más de lo que se puede comparar. Por debajo de ~1670 px de ventana ocupa todo el ancho.
- **Carga (`EsqueletoResumen`):** al entrar (`loading.tsx`) y al cambiar de mes (`<Suspense key={mes}>`, porque cambiar solo `?mes=` no vuelve a mostrar `loading.tsx`). La misma estructura que la página (cabecera, cifras, gasto por categoría) con rótulos reales y bloques `linea` (radio `muestra`, pulso solo con `motion-safe`; `hundido` casi no se distinguía del papel) donde van las cifras; nunca cifras inventadas. Al cambiar de mes el título ya es el mes destino, con las dos flechas deshabilitadas hasta conocer los límites. «Cargando resumen…» va en un `role="status"` oculto, sin `aria-busy` (que silenciaba el anuncio).
- **Cabecera:** «Resumen del mes» en `rotulo` secundario, la navegación en variante título y, a la derecha (debajo en móvil), «1 – 31 oct · 142 movimientos · comparado con septiembre» en `etiqueta` secundaria, con la cantidad en mono.
- **Cifras del mes (`CifrasMes`):** escritorio (`xl`), tres columnas bajo una raya separadas por divisiones verticales: rótulo, cifra-l y debajo dos renglones en `etiqueta` / cifra-xs («Septiembre 4.200.000», «Variación +62.500 · +1,5 %»). Ingresos con `+` en verde, gastos con `−` en terracota (base en cifra-l, `-texto` en cifra-m), resultado con su signo en tinta; un cero va sin signo y en tinta. Variaciones con signo, en tinta; si no caben, parten en el «·», nunca dentro de una cifra. Móvil: ingresos y gastos en filas de cifra-m con «+1,5 % vs sep» en cifra-xs; el resultado en cifra-l entre raya y doble raya.
- **Gasto por categoría (`GastoCategorias`):** escritorio, tabla `160px | flexible | 120px | 72px | 120px | 110px` con 16 px desde `xl` (en `lg`, `140px | flexible | 112px | 64px | 112px | 96px` con 12 px, para que la barra no quede en un punto) (Categoría, barra, mes, %, anterior, Var.) con rótulos sobre una división. La barra mide 6 px, radio `muestra`, en `texto`, y su largo es el `porcentaje` de la API sobre el mayor de la lista (`anchoBarra`), nunca montos. «Sin categoría» va al final, sobre una punteada, con el nombre subrayado en punteada y la barra como la punteada de 1 px (`punteada`, `terciario`) centrada al alto de la barra, porque un contorno punteado de 4–6 px se vuelve un borrón con porcentajes chicos; aparece solo si tiene monto este mes o el anterior. Cierra «Total gastos» en 600 sobre doble raya, con «100 %» rotulado sin sumar filas («—» si no hubo gastos). Móvil: lista con nombre, monto y % y debajo una barra de 4 px; el total va en la cabecera de la sección. Sin filas: «No hubo gastos en {mes}.».
- **Indicador de sin clasificar:** solo con gastos sin clasificar. Escritorio, a la derecha del rótulo: «3,3 % sin categoría · Clasificar 1», el % en mono con subrayado punteado y «Clasificar» en latón 600. Móvil, al pie (44 px): «3,3 % sin categoría, en 1 gasto · Clasificar». Lleva a `/movimientos/sin-clasificar?mes=…`.
- **Patrimonio neto (`PatrimonioNeto`):** «Patrimonio neto · 12 meses» con «dic 2025 – hoy» a la derecha (escritorio), el de hoy en cifra-l y «+6.708.692 desde dic 2025» (cifra en mono y tinta). Con un solo punto, sin variación ni rango: la gráfica es el punto de partida y debajo va «La línea arranca hoy. Cada cierre de mes agrega un punto.». Ocupa 2/3 en escritorio.
- **Cambio en {mes} (`CambioDelMes`):** el puente del patrimonio, 1/3 en escritorio y bajo la gráfica en móvil: «Patrimonio al 30 sep» (rótulo secundario), «Resultado del mes», «Revaluación de inversiones» (solo si no es 0) y «Otros cambios» con signo, y el cierre «Patrimonio al 31 oct» (o «Patrimonio a hoy» en el mes actual) en 600 sobre doble raya. Todo en tinta, cifra-s.

### Gráfica del patrimonio (`GraficaPatrimonio`)
SVG propio, sin librería. La escala se calcula en `src/domain/resumen/grafica.ts` con `bigint`; solo las coordenadas en píxeles salen como `number`. `viewBox` fijo por formato (escritorio 690 × 240, medio 520 × 200, móvil 358 × 180) estirado al ancho, para que el texto conserve su tamaño en cada uno. El formato lo decide el ancho del bloque (`@container`: móvil hasta 448 px, medio hasta 576, escritorio desde ahí), no el de la ventana.
- **Casillas:** 12 fijas (11 cierres de mes y hoy); con menos puntos, ocupan las últimas, así que hoy queda siempre a la derecha. La escala de tiempo no se estira: las casillas anteriores al inicio no llevan punto, pero sí su mes en `secundario`, para que se lean los 12 (no en `terciario`: son texto).
- **Trazo:** tres líneas de rejilla en `linea` con paso redondo (1, 2 o 5 × 10^k) y su etiqueta compacta a la derecha («25 M», «950 mil», `formatearCompacto`); base en `raya`; línea de 1,5 px en `texto`; puntos huecos (relleno `fondo`) y el de hoy relleno en `texto`. Etiquetas en cifra-xs secundaria; «hoy» en tinta. En móvil, los meses se rotulan uno de cada dos contando desde «hoy» (también en el punto de partida): doce no caben a 13 px. Rango cero: la rejilla se abre alrededor del valor.
- **Mes consultado:** en un mes cerrado (`mes` de la página), su cierre lleva el punto hueco de 3,5 px y su mes en tinta 500, para unir la gráfica con las cifras del mes. En el mes actual no se marca nada más: hoy ya va relleno. En móvil, si su mes cae en una casilla sin rótulo, queda solo el punto.
- **Accesible:** `role="img"` con «Patrimonio neto: de {primero} en {mes} a {hoy} hoy».
- **Punto de partida (día uno):** sin rejilla, así que la base en `raya` va de borde a borde y las casillas usan el mismo margen a ambos lados. Hoy en la primera casilla, como el punto de hoy de la serie (relleno en `texto`); una punteada `terciario` hasta la última casilla con un punto hueco (relleno `fondo`, borde `terciario`) en cada cierre por venir; debajo «hoy» en tinta y los 11 meses siguientes en `secundario`. Más bajo (escritorio 690 × 112, medio 480 × 104, móvil 358 × 96, elegidos por el ancho del bloque como la serie). También es lo que se dibuja con una serie de un solo punto: una línea no se traza con un punto, y un punto suelto a la derecha de una rejilla vacía no dice nada.

### Día uno del resumen (`DiaUno`)
Cuando el usuario aún no tiene movimientos (`tieneMovimientos: false`); un mes vacío cualquiera muestra ceros, no esto. Sin navegación de meses: el mes es un `h1` simple.
- **Mensaje:** «Hoy es tu primer día.» en titulo-2 y la explicación en cuerpo secundario (larga en escritorio, corta en móvil; «tus 3 cuentas» / «tu cuenta»). En escritorio, a la derecha, «Registrar el primer gasto» (primario, abre la captura) y «Agregar otra cuenta» (enlace con aspecto de botón secundario a `/cuentas?cuenta=nueva`), sobre una división.
- **Cifras:** las tres en «0» `secundario` (cifra-l en escritorio con «Sin ingresos registrados» · «Sin gastos registrados» · «Ingresos menos gastos»; filas en móvil).
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
`PanelLateral` amplio (480 px; hoja inferior en móvil) abierto por URL (`?plantilla=nueva`, `?plantilla=<id>`), armado solo con piezas existentes: `SelectorTipo` (segmentado; pestañas en móvil), `CampoSubrayado` (concepto, máx. 80, ), `CampoFecha` para el primer vencimiento (`min` hoy en el alta), `CampoMonto` con el signo del tipo, `OpcionUnica` (Fijo / Variable, Cada, y Día N / Último día solo en mensual o más), la nota de vencimiento en `etiqueta` secundaria, `FichaCuenta` dos por fila («Cuenta», o «Desde» y «Hacia» en transferencia) y `ChipCategoria` con «Sin categoría» (punteado; elegido, normal con check), oculto en transferencia. Pie fijo: «Crear plantilla» / «Guardar cambios», y en edición «Pausar plantilla» / «Reanudar plantilla» (texto) · «Eliminar plantilla…» (vínculo discreto que abre `BloqueEliminar`). Pausada, arriba: «Pausada desde {12 nov}. No genera ocurrencias nuevas.». Si la edición cambia el calendario, la nota de reinicio va sobre el botón. Errores de la API bajo su campo; cerrar con cambios pregunta «¿Descartar los cambios?».
- **Cuenta archivada:** una cuenta de la plantilla que ya no está entre las activas se muestra como `FichaCuenta` sin icono, con su nombre y «Archivada» en lugar del saldo.

### Deudas y préstamos (`/deudas`)
Primera pantalla maestro-detalle. Capital, intereses, totales, estado y vencido llegan de la API; la web arma los textos relativos («89 días», «hace 27 días») con `fechaHoy` de la respuesta (`src/domain/prestamo/presentacion.ts`), nunca con el reloj del navegador. Cabecera con el título y, en escritorio, «Nuevo préstamo o deuda» (enlace con aspecto de botón secundario y `+` de 18 px). Debajo, el consolidado a todo el ancho, el aviso de condonación y, desde `xl`, lista y detalle en `400px | minmax(0,1fr)` con 48 px entre ellas; por debajo de `xl` (escritorio angosto), el detalle va bajo la lista. 32 px entre bloques. `?prestamo=<id>` elige la persona: en escritorio, sin parámetro, se ve la primera; en móvil, sin parámetro solo la lista y con él solo el detalle. Sin préstamos: consolidado en cero y `DiaUnoDeudas`.

### Consolidado de deudas (`ConsolidadoDeudas`)
Desde `lg`: tres columnas iguales bajo una raya, separadas por renglones verticales: rótulo, cifra-l (cifra-m si la columna mide menos de 288 px, por consulta de contenedor, para que diez dígitos no invadan la vecina) y subtítulo en `etiqueta` secundaria («1 persona · +6.667 de intereses sin cobrar», «A 1 persona · sin intereses»). «Debes» con `−` en terracota base; en cero, «0» en tinta. «Posición neta» en tinta con su signo, sobre doble raya, y la leyenda debajo (se omite con todo en cero). Por debajo de `lg`: filas con rótulo y subtítulo a la izquierda y cifra-m a la derecha («Debes» en `salida-texto`); la posición en 600 sobre doble raya y la leyenda bajo ella. **Día uno:** cifras en `terciario`, doble raya en `linea` y sin leyenda.

### Lista de préstamos (`ListaPrestamos`)
Grupos «Te deben», «Debes» y «Saldadas» en ese orden (los vacíos no salen; el orden interno es el de la API). Rótulo y total en cifra-s sobre una raya; «Debes» con `−` en `salida-texto`; «Saldadas» con el rótulo en secundario y sin total. Cada fila es un enlace a `?prestamo=<id>` sin mover la página: rejilla `20px | flexible | auto`, 12 px, renglón abajo. Icono de 20 px en secundario (↗ otorgado, ↙ contraída, ✓ saldada); nombre en cuerpo 600 (secundario si saldada); debajo «Desde el {14 ago} · {89} días» o el cierre («Pagó todo el 20 sep», «Pagaste todo…», «Condonado el 11 nov») en `etiqueta` secundaria; si está vencida, «Fecha acordada: {15 oct}» con reloj de 16 px en `marca-texto`. A la derecha, capital en cifra-s (le debes con `−` en `salida-texto`; saldada «0» en secundario) y «te debe» / «le debes» / «saldada» en cifra-xs secundaria. La fila elegida y la que está bajo el cursor llevan fondo `hundido`.

### Detalle de préstamo (`DetallePrestamo`)
Es contenedor (`@container`): se acomoda a su ancho, no al de la ventana.
- **Cabecera:** tipo («Préstamo otorgado», «Deuda contraída»; saldado, «… · saldado»: el «te debe» lo dice el rótulo del capital) en `etiqueta` secundaria y nombre en titulo-2; a la derecha, rótulo («Te debe», «Le debes», «Saldo») y capital en cifra-l (le debes con `−` en terracota base; saldada «0» en secundario), sobre una raya. En móvil, «‹ Deudas» arriba y el capital debajo del nombre, tras una raya.
- **Resumen y condiciones:** dos columnas desde 512 px de contenedor (una, si no). Resumen: «Le prestaste» / «Te prestó», «Abonos a capital» (o «Abonos y condonación») con `−` y «Capital pendiente» en 600 sobre doble raya. Condiciones en `etiqueta` secundaria con el valor a la derecha: «Intereses» (`formatearTasa`: «Sin intereses», «1,5 % mensual sobre saldo»), y con tasa «Intereses cobrados» / «pagados» y, si no está saldado, «Causados sin cobrar» / «sin pagar»; siempre «Fecha acordada» o «—».
- **Aviso de fecha vencida:** reloj de 16 px y «Pasó la fecha acordada hace 27 días.» en `marca-texto` 600, con la ayuda («Acordaron el 15 oct. Si cambió el plan, puedes mover la fecha.») en `etiqueta` secundaria. Bajo las condiciones en contenedor ancho; bajo la cabecera en angosto.
- **Historial:** rótulos sobre una raya. Contenedor ≥ 672 px: `64px | flexible | 130px | 110px | 140px` (Fecha, Historial, Capital, Interés, Saldo capital). Angosto: `minmax(0,1fr) | 84px | 84px`. Los anchos de cifras son mínimos: crecen con la cifra más larga y, como cada fila hereda las columnas de la tabla (`subgrid`), todas crecen juntas y siguen alineadas. Si alguna cifra del historial llega a 12 caracteres («1.234.567.890»), en la tabla angosta la descripción toma su renglón entero y capital y saldo bajan al siguiente, alineados a la derecha (en un teléfono, dos columnas así dejaban a la descripción sin ancho legible) (Historial, Capital, Saldo) con «{fecha} · interés +12.000» en cifra-xs bajo la descripción. Capital con su signo; interés con `+` en `entrada-texto` (te debe) o `−` en `salida-texto` (le debes), «—» en secundario sin interés (dice algo, así que no va en `terciario`); saldo en 500. Cada fila es un enlace a su movimiento en `/movimientos` (fondo `hundido` al pasar).
- **Acciones** (no saldado): «Registrar abono» (primario) y «Cambiar fecha acordada» (secundario), enlaces de 48 px a los paneles; en un otorgado, «Condonar lo pendiente…» a la derecha como botón de texto subrayado en secundario. En contenedor angosto, a todo el ancho y apiladas. Una saldada no tiene acciones.

### Condonar (`CondonarPrestamo`)
Reemplaza la fila de acciones: raya arriba y, en contenedor ≥ 672 px, `minmax(0,1fr) | 320px` con 32 px (una columna si no, con «Qué cambia» bajo la categoría y los botones a todo el ancho). Izquierda: «Condonar a {Camila}» (cuerpo 600: el bloque depende del detalle y no compite con el nombre), la explicación (máx. 65 caracteres por línea) según el modo (todo: el préstamo se cierra; parte: el resto sigue corriendo), `OpcionUnica` «Todo lo pendiente {500.000}» / «Solo una parte», con «parte» un campo en cifra-campo con «COP» sobre una raya y su `MensajeError` («No puedes condonar más de lo pendiente.»: se rechaza, no se recorta), «Categoría del gasto» con `ChipCategoria` sin ninguna elegida y, al condonar todo con causados, la nota de intereses. Derecha: «Qué cambia» (`rotulo` sobre raya) con «Gasto de hoy · {categoría}» (`−` en `salida-texto`), «{Camila} te deberá» y «Patrimonio neto {antes} → {después}», y debajo «Condonar {500.000}» (primario, deshabilitado sin monto válido o sin categoría) y «Cancelar»; mientras «Condonar» espera, encima de los botones en `etiqueta` secundaria lo que falta («Escribe cuánto vas a condonar.», «Elige la categoría del gasto.»), en una región `aria-live` enlazada al botón con `aria-describedby`. «Qué cambia» es la única resta de montos de la web, asignada al cliente por el contrato.
- **Movimiento:** el bloque entra con «Asentar» al reemplazar la fila de acciones (salir, «Cancelar», es inmediato); el campo de «Solo una parte» se despliega como campo dependiente (grid 0fr → 1fr, 300 ms despliegue / 180 ms retirada, plegado `inert`); «Condonar lo pendiente…» lleva `presion`. Con movimiento reducido, solo los fundidos.
- **Aviso (`AvisoCondonacion`):** el de la bandeja (`AvisoBandeja`): «Condonado. Se registró un gasto de {500.000} en {Otros}.» con «Deshacer», 5 s. Vive en `ProveedorAvisoDeudas`, fuera del detalle, porque al condonar todo la fila de acciones desaparece. Si deshacer falla, el `mensaje` de la API va en el aviso.

### Paneles de préstamo (`PanelPrestamo`, `PanelAbono`, `PanelEdicionPrestamo`)
`PanelLateral` por URL (hoja inferior en móvil), con piezas existentes. Errores de la API bajo su campo; sin campo, `MensajeError` al pie. Las server actions de los paneles y de condonar pasan por `llamarAccion`: sin red, el mensaje queda en su lugar y la página no cae a `error.tsx`. Cerrar con cambios pregunta «¿Descartar los cambios?». Al registrar, se cierran hacia `?prestamo=<id>`.
- **Alta y desembolso (`?nuevo=<tipo>`, amplio):** `OpcionUnica` del sentido («Le presté a alguien» / «Alguien me prestó», con «Queda como activo: te deben» / «Queda como pasivo: le debes» como detalle, igual que el día uno), «Persona» (`CampoSubrayado`, máx. 60) con las personas de ese sentido como `ChipCategoria`, `CampoMonto`, `FichaCuenta` dos por fila («Sale de» / «Llega a»), `CampoFecha`, y solo en el alta «Tasa mensual» (con «En % mensual. Déjala vacía si no hay intereses.») y «Fecha acordada» («Opcional», `min` = fecha). Si el nombre coincide con alguien del mismo sentido, «Suma al préstamo con {Camila Ortiz}.» (más «Está saldado: se reabre.»), se ocultan tasa y fecha acordada y el botón dice «Registrar desembolso».
- **Abono (`&abono=1`):** «Capital pendiente {500.000} · intereses sin cobrar {6.667}» («sin pagar» en una deuda) en `etiqueta` secundaria, `CampoMonto` «Total» (con «Calculando…» como nota mientras llega la propuesta), fecha, y con tasa «Capital» e «Interés» como `CampoSubrayado` en mono (el interés con «Causados al {11 nov}: {6.667}» a la derecha del rótulo), y las fichas («Llega a» / «Sale de»). El botón «Registrar abono {112.000}» lleva la suma de lo escrito. Sin tasa, no hay capital ni interés.
- **Edición (`&editar=1`, «Editar préstamo» o «Editar deuda»):** «Persona» y «Fecha acordada» con «Quitar fecha» (botón de texto). «Guardar cambios» deshabilitado sin cambios.

### Esqueleto de deudas (`EsqueletoDeudas`)
En `src/components/deudas/esqueleto-deudas.tsx`, para el `loading.tsx` de `/deudas`, con las reglas de los esqueletos de cuentas (bloques `linea` con el `leading` del texto que reemplazan, rótulos reales, nunca cifras, «Cargando tus deudas…» en un `role="status"` oculto). Cabecera con la caja del botón en `terciario`; consolidado con sus rótulos («Te deben», «Debes», «Posición neta») y doble renglón en vez de doble raya; un grupo de la lista con tres filas; y desde md el detalle: cabecera sobre raya, resumen con «Capital pendiente», cuatro condiciones y el historial con sus rótulos. Al llegar, la página entra con «Asentar» (220 ms).
- **Al cambiar de persona** (cambiar `?prestamo=` no vuelve a mostrar `loading.tsx`): la fila pulsada deja una marca (`MarcaPendiente`, `useLinkStatus`) y el detalle viejo se atenúa al 50 % (150 ms, llegada) hasta que llega el nuevo, que entra con «Asentar».

### Día uno de deudas (`DiaUnoDeudas`)
«Nadie anotado todavía.» (cuerpo 600) con la explicación en cuerpo secundario y, sobre una raya, dos filas de 60 px enlazadas al alta: icono (↗ / ↙), «Le presté a alguien» / «Alguien me prestó» en 600 con «Queda como activo: te deben» / «Queda como pasivo: le debes» en `etiqueta` secundaria y chevron a la derecha. 400 px en escritorio. En Cuentas sin cuentas, «Agregar una deuda con alguien» (`EnlaceTexto`) abre el alta con «Alguien me prestó».

### Inversiones (`/inversiones`)
Una cuenta de inversión a la vez, a valor de mercado, en USD o COP. Valor, costo, rendimiento, efectivo, costo promedio, ganancia realizada y equivalentes llegan de la API; la web solo calcula la vista previa del precio manual, el precio por unidad de una operación y la tasa implícita de la captura, con `bigint` y el mismo redondeo de la API (`src/domain/inversion/`, `src/domain/dinero/tasa.ts`). Cantidades como texto decimal (nunca `number`): `formatearCantidad` (mínimo 4 decimales) en escritorio y `formatearCantidadCorta` en móvil. Porcentajes en centésimas con `formatearPorcentaje` («+12,48 %», «—» sin base). Textos relativos con `fechaHoy` de la respuesta; la hora del intradía en la zona del perfil. En USD toda cifra lleva su «≈ COP» en cifra-xs secundaria («≈ —» sin TRM); en COP no hay equivalente ni TRM. Columna en columna: 32 px entre bloques. `?inversion=<id>` elige la cuenta (sin él, la primera); una archivada por URL se ve en solo lectura («· archivada», sin acciones ni enlaces).
- **Signo y color:** rendimiento, % y ganancia realizada con `+` en `entrada-texto`, `−` en `salida-texto`, 0 en secundario (`colorSigno`). Valor, costo, efectivo y precios sin signo, en tinta; costo promedio en secundario. Operaciones: compra `−` y venta `+` en tinta; «Ya lo tenía» sin signo, en secundario.
- **Estados degradados:** precio vencido, TRM desactualizada y sin TRM van como nota en `marca-texto`, nunca como franja aparte.

### Línea de la TRM (`LineaTrm`, `TrmReferencia`)
`LineaTrm`: icono de tasa (⇄) de 16 px, la cifra en mono cifra-xs tinta y el resto en `etiqueta` secundaria: «TRM aplicada 4.120,00 · 11 nov 2026 · {fuente}» (día uno: «TRM de hoy …»). Desactualizada («TRM del 8 nov 2026 · sin actualizar · …») o nula («Sin TRM: no hay equivalente en pesos.»), toda en `marca-texto`. `TrmReferencia`, al pie del menú lateral y de la hoja «Más»: «TRM de referencia» en `etiqueta` secundaria, «4.120,00 COP» en mono cifra-s y la fecha de vigencia debajo; desactualizada, «· sin actualizar» en `marca-texto`; nula, «Sin TRM». El layout la lee en el servidor dentro de `<Suspense>`: si `GET /trm` falla, no se muestra.

### Cabecera, selector y cifras de una inversión
- **Cabecera (`CabeceraInversion`):** «Inversiones» (titulo-1) y «eToro · cuenta en USD · activo» en `etiqueta` secundaria (móvil sin «· activo»); a la derecha, «+ Nueva inversión» (enlace con aspecto de botón secundario); bajo el título, a la derecha, `LineaTrm` (solo USD; en móvil va bajo las cifras).
- **Selector (`SelectorInversiones`):** con dos o más, `ChipCategoria` como enlace con nombre y valor de mercado en su moneda; envuelven.
- **Cifras (`CifrasInversion`):** escritorio, tres columnas `1.3fr | 1fr | 1.2fr` bajo una raya, separadas por renglones: «Valor de mercado» (rótulo en tinta, cifra-l), «Costo de las posiciones» y «Rendimiento» (rótulo secundario, cifra-m; rendimiento con su `%` tras «·» y color por signo), y «≈ … COP» debajo. Móvil: valor de mercado y rendimiento en filas.

### Tabla de posiciones (`TablaPosiciones`)
Desde `xl` (1280 px), tabla `minmax(0,1fr) | 96 | 104 | 104 | 150 | 130 | 76 | 140` con 12 px entre columnas y rótulos sobre una raya: Activo (símbolo en mono cifra-s 600, nombre truncado en `etiqueta` secundaria), Cantidad, Costo prom. (secundario), Precio (el manual con subrayado discontinuo en `marca`), Valor · USD y Rend. · USD (con «≈» debajo), % y Cotización (`notaCotizacion` en `etiqueta` secundaria, `marca-texto` si está vencido; «manual» en mono cifra-xs `marca-texto` y «Actualizar precio» en latón 600; en una automática la nota misma abre el precio). La fila con el bloque abierto lleva fondo `hundido`. Cierran «Efectivo disponible · Saldo sin invertir» con «Al {11 nov}» y «Total cuenta {eToro}» en 600 sobre doble raya. Por debajo de `xl`, lista `minmax(0,1fr) | auto`: símbolo y «manual», nombre, «6,25 × 562,40 · costo 498,72» en cifra-xs y la nota; a la derecha valor, «≈» y «+398,00 · +12,77 %» con color; toda la fila abre el precio. Sin posiciones, «Todavía no hay posiciones en {eToro}.» con la invitación a «Ya lo tenía». Bajo la tabla, «Registrar operación» (primario) y «Editar cuenta» (secundario) y la nota al pie de equivalentes y fechas de precio (`notaPrecios`), en `etiqueta` secundaria.

### Bloque de precio (`BloquePrecio`)
Abierto por URL (`&precio=<activoId>`). Desde `xl`, en línea bajo su fila: fondo `superficie`, raya abajo, rejilla `minmax(0,1fr) | 260 | 260` con 32 px. Manual: «Cotización manual de {RENEW}» (cuerpo 600) con la explicación, «Precio actual · {7 nov}» (secundario) y «Antes · {1 nov}» (terciario); en el centro «Precio por unidad», el campo en mono cifra-l con «US$» delante sobre una raya (latón con foco) y la vista previa «Valor de la posición: US$ 411,06 ≈ 1.693.567 COP»; a la derecha «Fecha de la cotización: hoy, {11 nov}», «Guardar precio» (deshabilitado sin precio válido) y «Cancelar», y en USD «Intentar precio automático» (botón de texto). Automático: «Precio automático de {VOO}», su explicación y «Pasar a cotización manual» · «Cerrar». Por debajo de `xl`, la misma pieza en hoja inferior (`PanelLateral` con «Cancelar»), con el botón a todo el ancho. Errores de la API en `MensajeError` dentro del bloque. Al guardar o cambiar el modo se cierra y la página se refresca.

### Operaciones (`ListaOperaciones`)
«Operaciones» en `rotulo` sobre una raya. Desde `lg`, `64px | flexible | 120 | 150 | 150` (Fecha, Operación, Cantidad, Monto, Ganancia realizada): fecha en cifra-xs secundaria, «Compra · VOO» en cuerpo con «US$ 562,40 por unidad» debajo, ganancia con color o «—» en `terciario`. Móvil: «Compra · VOO» con «02 oct · 6,25 × 498,72» y, a la derecha, el monto con la ganancia debajo. Cada fila abre su edición (fondo `hundido` al pasar). Vacía: «Sin operaciones todavía.».

### Paneles de inversión y operación (`PanelInversion`, `PanelOperacion`)
`PanelLateral` por URL (hoja inferior en móvil), con piezas existentes; errores de la API bajo su campo, sin campo al pie; cerrar con cambios pregunta «¿Descartar los cambios?».
- **Nueva inversión (`?nueva=1`):** «Nombre» (máx. 60), `OpcionUnica` «Dólares · USD» / «Pesos · COP» y «Efectivo inicial» (`CampoMonto` en la moneda elegida, con la nota de «Ya lo tenía»). Cambiar la moneda conserva la parte entera. Al crear, se cierra en su detalle.
- **Operación (`&operacion=nueva`, amplio):** `OpcionUnica` «Compra · sale del efectivo» / «Venta · entra al efectivo» / «Ya lo tenía · no mueve efectivo»; «Símbolo» (`CampoSubrayado` en mono mayúsculas, máx. 12; en venta solo chips) con las posiciones abiertas como chips y la nota de la búsqueda («Buscando…», «{Nombre} · precio automático», «… · ya está en la cuenta», «No lo encontramos: …», «Sin proveedor de precios: …»), «Nombre» solo para un activo nuevo, «Cantidad» (con «Tienes 6,25» en venta), «Total pagado» / «Total recibido» / «Costo total» con «US$ 498,72 por unidad · comisión incluida» como nota, `CampoFecha` (máx. hoy) y, en compra, «Efectivo disponible US$ 513,61». La búsqueda va al salir del campo, una vez por símbolo.
- **Edición (`&operacion=<id>`):** «{Compra} · {VOO} · {nombre}» fijo en `etiqueta` secundaria, cantidad, total y fecha; «Guardar cambios» deshabilitado sin cambios y, tras una división, «Eliminar operación…» con `BloqueEliminar`. `EFECTIVO_INSUFICIENTE` y `CANTIDAD_INSUFICIENTE` van al pie.

### Día uno de inversiones (`DiaUnoInversiones`)
«Aún no tienes una cuenta de inversión.» (cuerpo 600) con la explicación en secundario; esqueleto de tabla («Posición», «Cantidad», «Valor» sobre una raya y tres renglones vacíos de 52 px, el último en doble raya); `LineaTrm` «TRM de hoy …»; «Agregar cuenta de inversión» (primario, a todo el ancho en móvil, 400 px en escritorio).

### Avisos (`/avisos`)
Primera pantalla cuyo contenido no se guarda: la API deriva los avisos y manda campos, no frases. Título, detalle (largo y corto), monto con su sentido, acción, plazo, grupo y momento se arman en `src/domain/aviso/presentacion.ts`; la antelación, en `src/domain/aviso/antelacion.ts`. Leído, resuelto, montos y capital llegan de la API. Todo texto relativo usa `fechaHoy` y `zonaHoraria` de la respuesta, nunca el reloj del navegador. Cabecera a todo el ancho; debajo, desde `xl` (1280 px), lista y antelación en `minmax(0,1fr) | 420px` con 48 px entre ellas, alineadas arriba; por debajo, solo la lista con «Configurar» y la antelación en `?antelacion=1` con «‹ Avisos» (en `xl` el parámetro se ignora). 32 px entre bloques. Alternar leído, «Marcar todo» y la antelación son optimistas (`useOptimistic`) y vuelven atrás con el `mensaje` de la API en `MensajeError` si fallan; `AVISO_NO_ENCONTRADO`, `OCURRENCIA_CERRADA` y `OCURRENCIA_INVALIDA` refrescan la página.

### Lista de avisos (`ListaAvisos`)
- **Cabecera:** «Avisos» (titulo-1) y debajo «{3} sin leer» / «Todo leído» en `etiqueta` secundaria; a la derecha «Marcar todo como leído» (`Boton` secundario, deshabilitado con 0 sin leer) y, por debajo de `xl`, el botón de icono «Configurar» (deslizadores de 20 px en 44 px, `secundario`). Móvil: «Avisos» con «Configurar» a la derecha y debajo el conteo con «Marcar todo leído» (botón de texto `marca-texto`, 44 px).
- **Grupos:** «Hoy», «Ayer», «Esta semana» (2 a 6 días atrás) y «Antes», en `rotulo` sobre una raya; los vacíos no salen y el orden interno es el de la API.
- **Vacío:** `EstadoVacio` «Avisos · 0», «Sin avisos.» y la explicación, sin acción; la cabecera dice «Todo leído».

### Fila de aviso (`FilaAviso`)
Toda la fila es un `<button>` que alterna leído, estirado sobre el `<li>` con un pseudo-elemento (como la fila de movimiento como enlace), con la etiqueta accesible «{título}. Marcar como leído» / «… no leído». La acción es un hermano por encima del pseudo-elemento, fuera del botón: nunca botón dentro de botón. Renglón abajo, 12 px de relleno vertical y 12 px entre columnas; fondo `hundido` al pasar sobre el botón; el foco del botón dibuja el contorno de latón en toda la fila.
- **Escritorio (md+):** `12px | 20px | flexible | auto | auto`. Punto de 8 px en `marca` si no leído (transparente y con su espacio si leído; «No leído» / «Leído» oculto), icono del tipo en secundario (`IconoAviso`), título en cuerpo (no leído 600 en tinta; leído 400 en secundario) con el detalle largo debajo en `etiqueta` secundaria, monto en cifra-s (salida con `−` en `salida-texto`, entrada sin signo en tinta, «≈ » si es estimado; precio sin monto) y el momento en cifra-xs secundaria (mínimo 110 px, a la derecha: «08:00», «mar 10 nov · 08:00», «lun 9 nov»). La acción, bajo el momento.
- **Móvil:** `10px | flexible | auto`, sin icono: título y monto; detalle corto y momento; la acción debajo, en la columna del título.
- **Acción:** `etiqueta` 600 en `marca-texto`, 44 px. «Confirmar» y «Ajustar» confirman en la fila («Confirmando…» mientras tanto); «Registrar abono» y «Registrar precio» son enlaces a los paneles por URL de Deudas e Inversiones. Resuelto o deuda: sin acción.
- **Ajuste en la fila** (recurrente variable): bajo la fila, de la columna del título al final (a todo el ancho en móvil), un `CampoMonto` con el monto del aviso, «Confirmar {35.000}» (primario, con la cifra en mono) y «Cancelar» (secundario; apilados en móvil). Enter confirma, Escape cancela. Vacío o cero: «Escribe un valor en pesos, sin decimales.» y no se envía. Un ajuste a la vez.

### Antelación por tipo (`AntelacionAvisos`)
Un bloque por tipo, en el orden de la API, con renglón abajo: `Casilla` con el rótulo y la descripción y, con 30 px de sangría (la casilla y su separación), el prefijo en `etiqueta` secundaria («Avisar», «Repetir después», «Después de») y las opciones como `ChipCategoria` «como opción» (la vigente con su marca). Tipo inactivo: prefijo y chips en `terciario` y ninguno marcado; siguen activos (elegir uno enciende el tipo). Error en `MensajeError` bajo el bloque.
- **Columna (`xl`):** «Antelación por tipo» en `rotulo` y a la derecha «Avisos a las 08:00» (hora en mono tinta), sobre una raya.
- **Página (`?antelacion=1`):** «‹ Avisos» (`EnlaceTexto`), «Antelación por tipo» en titulo-2 y «Los avisos llegan a las 08:00, hora de Colombia.» (`zonaLegible`) en `etiqueta` secundaria, sobre una raya; el prefijo va en su propia línea, sobre los chips.

### Metas de ahorro (`/metas`)
Segunda pantalla maestro-detalle y la primera cuyas cifras son todas derivadas: avance, falta, porcentaje, ritmo, cumplimiento, saldo libre, historial y totales llegan de la API. La web solo arma frases (`src/domain/meta/presentacion.ts`), filtra cuentas para el formulario y decide qué acciones mostrar (`src/domain/meta/formulario.ts`); no suma, no resta ni proyecta. Todo texto relativo usa `fechaHoy` de `GET /metas`; las archivadas no lo traen y sus fechas van siempre con año. Cabecera a todo el ancho: «Metas de ahorro» (titulo-1; «Metas» en móvil) y debajo «En metas activas: {34.430.000} de {54.300.000}» en `etiqueta` secundaria (avance en mono tinta, objetivo en mono secundario; sin TRM, « · sin 1 meta sin TRM» en `marca-texto`; sin activas, «Sin metas activas.»); a la derecha «+ Nueva meta» (enlace con aspecto de botón secundario) o, en móvil, un botón de icono `+` de 44 px. Desde `xl`, lista y detalle en `400px | minmax(0,1fr)` con 48 px; por debajo, el detalle bajo la lista. `?meta=<id>` elige la meta (escritorio sin parámetro: la primera; móvil: solo la lista, o solo el detalle con «‹ Metas»). «Ver archivadas» (`EnlaceTexto`) al pie de la lista. Sin metas: `EstadoVacio` «Metas» con «Nueva meta». Archivadas en `/metas/archivadas` («‹ Metas», «Metas archivadas», lista sin grupos y detalle de solo lectura con «Restaurar»; vacío sin acción). Nada es optimista: cada acción espera la respuesta y la página se revalida.

### Lista de metas (`ListaMetas`, `ListaMetasArchivadas`)
Grupos «Activas» y «Cumplidas» (rótulo en secundario) en `rotulo` sobre una raya; los vacíos no salen y el orden es el de la API. Cada fila es un enlace a `?meta=<id>` sin mover la página, con renglón abajo, 12 px de relleno vertical y 8 px entre líneas: nombre en cuerpo 600 (secundario si cumplida) y porcentaje en cifra-xs secundaria («25,3 %», truncado a un decimal); `BarraAvance` de 4 px; «{600.000} de {1.800.000}» (avance cifra-xs tinta, «de» en `etiqueta` secundaria, objetivo cifra-xs secundaria) con la fecha a la derecha («Para el 15 dic», «Para dic 2027», «Sin fecha», «Cumplida el 12 sep»). Sin TRM, el avance es «—». La elegida y la que está bajo el cursor llevan fondo `hundido`. **Móvil:** nombre y porcentaje; el avance en cifra-m 500 con «de {objetivo}» a la derecha en `etiqueta`; la barra; la cuenta con su icono de 16 px y la fecha en `etiqueta` secundaria; en las activas, el ritmo corto en `etiqueta` tinta («Faltan 1.200.000 en 34 días.»).

### Barra de avance (`BarraAvance`)
Pista en `linea` y relleno en `texto` (`secundario` si la meta está cumplida), radio `muestra`. 4 px en la lista, 8 px en el detalle. El ancho topa en 100 % aunque la meta lo pase; sin avance, vacía. `role="img"` con «{25,3 %} del objetivo».

### Detalle de meta (`DetalleMeta`)
Es contenedor (`@container`).
- **Cabecera:** icono de la cuenta de 16 px y «Nubank · apartado para esta meta» / «eToro · toda la cuenta» en `etiqueta` secundaria; nombre en titulo-2; raya abajo. En móvil, «‹ Metas» («‹ Archivadas») arriba.
- **Cifras:** avance en cifra-l a la izquierda y «de {7.500.000}» a la derecha («de» en cuerpo secundario, objetivo en cifra-m); `BarraAvance` de 8 px; debajo, porcentaje y «Faltan 5.600.000» (o «Cumplida el 12 sep») en cifra-xs secundaria, a los extremos. En un ancho muy angosto, la fila se parte.
- **Ritmo:** la frase larga en cuerpo («Para llegar el 15 dic faltan 1.200.000 en 34 días.», «En los últimos 6 meses aportaste en promedio 316.667 al mes. A ese ritmo llegarías alrededor de mayo de 2028.», «Llegaste al objetivo el 12 sep. El dinero se usó el 14 sep · taller.»). Debajo, la nota de apartado compartido o de inversión en `etiqueta` secundaria y, si lo apartado supera el saldo, el aviso en `etiqueta` `marca-texto`.
- **Historial:** rótulos en `rotulo` secundario sobre una raya. Con 448 px o más de ancho propio, `64px | flexible | 120px | 130px` (Fecha, Historial, Aporte / Variación, Acumulado / Valor); más angosto, `flexible | 96px | 104px` con la fecha en cifra-xs bajo la etiqueta. Monto en cifra-s y acumulado en cifra-s 500, a la derecha, en tinta y con signo: apartar o liberar no cambia el patrimonio. En una meta por apartado no archivada, cada fila abre su edición (fondo `hundido` al pasar). Sin filas: «Sin aportes todavía.».
- **Condiciones y acciones:** «Cuenta asociada», «Objetivo» (cifra-s), «Fecha meta» y «Creada», con el rótulo en `etiqueta` secundaria y el valor a la derecha, renglón entre filas; debajo, `AccionesMeta`. Historial y condiciones van en `minmax(0,1.4fr) | minmax(0,1fr)` con 32 px solo desde 896 px de contenedor; por debajo, las condiciones bajo el historial (en la columna de 576 px del detalle a 1440, las columnas fijas del historial no caben al lado).

### Acciones de meta (`AccionesMeta`)
Los botones de `accionesMeta` en fila con 8 px (a todo el ancho y apilados en móvil): activa, «Registrar aporte» (primario) o, sobre una inversión, «Ver inversiones» (primario, lleva a su detalle), y «Editar meta» (secundario); cumplida, «Archivar» (secundario) o, por apartado con dinero apartado, «Registrar retiro» con «Para archivarla, retira lo apartado.»; archivada, «Restaurar» (primario). Los paneles se abren por URL con enlaces de 48 px. «Archivar» y «Restaurar» no piden confirmación («Archivando…», «Restaurando…»); sus errores van en `MensajeError` bajo los botones. «Eliminar meta…» es el vínculo discreto de `BloqueEliminar`, debajo, en todos los estados.

### Paneles de meta y de aporte (`PanelMeta`, `PanelAporte`)
`PanelLateral` por URL (hoja inferior en móvil), con piezas existentes. Errores de la API bajo su campo; sin campo, `MensajeError` al pie. Cerrar con cambios pregunta «¿Descartar los cambios?». Al guardar, se cierran hacia `?meta=<id>`. Sin cuentas, «No pudimos cargar tus cuentas.».
- **Meta (`?nueva=1`, `&editar=1`, amplio):** «Nombre» (máx. 60), «Modo» (`OpcionUnica` con detalle: «Apartar parte del saldo» / «Toda la cuenta») primero; «Cuenta» con `FichaCuenta` dos por fila, filtradas por modo y por las metas que excluyen (sin ninguna, «No hay cuentas para este modo…» con «Cuentas» como `EnlaceTexto`); «Objetivo» (`CampoMonto`); `CampoFechaMeta`; y solo en el alta por apartado «Apartado inicial · opcional» con «Desde» desplegado al escribir un monto: primero «Ya está en {Nubank}» (elegida, sin saldo) y luego las cuentas en pesos, con la nota «Marca dinero que ya está en {Nubank}.» o «Se registra una transferencia de {Bancolombia} a {Nubank}.». En la edición, el modo deshabilitado con «Una meta con aportes no cambia de modo.» si hay historial, «Lo apartado ({1.900.000}) pasa a {Bancolombia}.» al cambiar de cuenta y «Guardar cambios» deshabilitado sin cambios.
- **Aporte (`&registrar=aporte|retiro`, `&aporte=<id>`):** por apartado y al registrar, `OpcionUnica` «Aporte» / «Retiro» con detalle (en una cumplida, «Aporte» deshabilitado); `CampoMonto`; `CampoFecha` (`min` la creación, `max` hoy); en el aporte, «Desde» con «Ya está en {cuenta}» elegida y «Saldo libre: {600.000}» en la nota (en toda la cuenta, sin «Ya está» y obligatorio); en el retiro, «Liberar no registra un gasto…» y «Apartado hoy: {1.900.000}»; «Motivo · opcional» (máx. 80). El botón lleva la cifra («Registrar aporte 350.000»). Edición: «Editar aporte» / «Editar retiro», sin tipo, el origen fijo en texto («Desde {Bancolombia}» con «Con origen, el cambio también corrige su transferencia.», o «Ya estaba en {Nubank}») y, tras una división, «Eliminar aporte…» con `BloqueEliminar` (con origen avisa que se borra su transferencia).

### Campo de fecha meta (`CampoFechaMeta`)
`OpcionUnica` «Sin fecha» / «Un día» / «Un mes» bajo el rótulo «Fecha meta» y, según la precisión, un `CampoFecha` «Día» (`min` hoy) o «Mes» (`modo="mes"`, cuadrícula de meses, `min` el mes actual) con el calendario abierto en línea (`enLinea`, porque `Despliegue` recorta), que se despliega en su lugar como campo dependiente (`Despliegue`). Cambiar de precisión descarta el valor. El error («Elige la fecha meta.») va bajo el campo.

### Detalle de cuenta (`/cuentas/[id]`)
Referencias: `referencias/export-detalle-cuenta/` y `referencias/export-tarjeta/`. Una ruta por cuenta: efectivo y banco muestran el historial con saldo corrido y la conciliación; la tarjeta, su ciclo. La inversión sigue en `/inversiones`. Saldo corrido, conciliado, entradas, salidas, saldo al inicio, ciclo, compra, uso y tasa E.A. llegan de la API; la web solo suma los `efecto` de la selección y resta `saldoReal − saldoHoy` para la vista previa del ajuste (`src/domain/cuenta/detalle.ts`, `tarjeta.ts`). Todo texto relativo usa `fechaHoy` de la respuesta; fechas sin año si son del año de hoy. 32 px entre bloques (24 en móvil). `?desde=&hasta=` es el rango; `?ajuste=1` y `?editar=1` abren sus paneles conservándolo. Una archivada (desde `/cuentas/archivadas`) se ve en solo lectura: «Archivada» junto al nombre, «‹ Archivadas», sin casillas, sin «Ajustar saldo», sin «Registrar pago» ni «Editar cuenta». En móvil, «Editar cuenta» (`EnlaceTexto`) va al pie de la página. Conciliar es optimista solo en el ícono de la fila (`useOptimistic`); el resto espera la respuesta.

### Cabecera de cuenta (`CabeceraCuenta`)
Escritorio: miga «Cuentas › Activos» («Pasivos» en la tarjeta) en `etiqueta` secundaria, con «Cuentas» como enlace; icono de tipo de 22 px, nombre en titulo-1 y «{Tipo} · {detalle} · {activo|pasivo}» en `etiqueta` secundaria; a la derecha la acción principal («Ajustar saldo», enlace con aspecto de botón secundario; «Registrar pago», primario) y «Editar cuenta» (`EnlaceTexto`). Raya fuerte abajo. Móvil: «‹ Cuentas» con su extra a la derecha («Seleccionar» / «Listo») y el nombre en titulo-2 con el icono.

### Cifras de cuenta (`CifrasCuenta`)
Escritorio: «Saldo actual» (rótulo en tinta, cifra-l) y «Conciliado» (rótulo secundario, cifra-m; «—» en `terciario` si nunca se concilió) con «al 31 oct · 9 sin conciliar» / «todo conciliado» / «Sin movimientos» debajo en `etiqueta` secundaria; tras un renglón vertical, «En el rango» con «Entradas» (+, `entrada-texto`) y «Salidas» (−, `salida-texto`) en cifra-s. Móvil: el saldo en cifra-l con «Ajustar» (secundario de 44 px) a la derecha y «Conciliado 148.100 · al 31 oct · 9 sin conciliar» debajo.

### Rango del historial (`RangoHistorial`)
Tres fichas que navegan («Últimos 30 días», el mes en curso y el anterior), con la caja del chip (36 px en escritorio, 44 en móvil); la activa con borde `texto` y peso 600. En escritorio, el botón del rango con icono de calendario de 16 px y «12 oct – 11 nov 2026» en mono cifra-xs despliega en línea «Desde» (`max` hoy) y «Hasta · opcional» (`min` el desde; vacío, «Hasta hoy»), ambos `CampoFecha`, con «Aplicar» (secundario); «La fecha final no puede ser anterior a la inicial.» va bajo «Hasta» sin navegar. A la derecha, «Seleccionar pendientes» (botón de texto). En móvil, solo las fichas, con desplazamiento horizontal.

### Historial (`TablaHistorial`)
Escritorio (lg+): rejilla `44px | 64px | flexible | 170px | 130px | 130px | 64px` (casilla, Fecha, Concepto, Categoría, Movimiento, Saldo, Conc.); entre md y lg, `44px | flexible | 110px | 110px | 64px`, con «11 nov · Comida» bajo el concepto como en móvil, con rótulos sobre una raya y divisiones entre filas. Casilla sin rótulo visible («Seleccionar {concepto}»); fecha en cifra-xs secundaria (programada en `marca-texto` con «Programado» en `rotulo` debajo); concepto en cuerpo con sus partes como sub-renglones; categoría en `etiqueta` secundaria («Desde Bancolombia», «Hacia Préstamo Juan», «Dividido», «Sin clasificar», «Ajuste»); movimiento en cifra-s con «+» verde o «−» terracota; saldo en cifra-s tinta; estado como botón de 44 px: ✓ en `entrada-texto` u ○ en `secundario` (un ícono con significado pide 3:1; `terciario` da 2,8). La fila elegida toma fondo `hundido`. Pie: «Saldo al {día antes de desde}» y su cifra, a la derecha. Rango vacío: «Sin movimientos en este rango.». Móvil: `24px | flexible | 76px+ | 76px+` (una rejilla con filas en `subgrid`: los montos crecen con la cifra más ancha y siguen alineados) con el estado (o la casilla en modo selección) en la primera columna y «11 nov · Comida» bajo el concepto. Archivada: sin casillas y el estado es un ícono fijo.

### Barra de selección (`BarraSeleccion`)
Solo con selección. Escritorio: fondo `hundido`, radio de campo, la casilla «−» que limpia, «{3} seleccionados · {−29.000}» (la suma en cifra-s), «Marcar como conciliados» (primario con ✓) y «Cancelar» (texto). Móvil: fija sobre las pestañas, a todo el ancho, con raya arriba, el texto y el botón.

### Panel de ajuste (`PanelAjuste`)
`PanelLateral` por URL (`?ajuste=1`; hoja inferior en móvil) con el pie fijo. «Cuenta lo que tienes en la billetera / la cuenta y escribe el total.» con la explicación en secundario; «Saldo en Tino» (saldo a hoy, cifra-m; con programados, «Sin los movimientos programados.» debajo); «Saldo real contado» (`CampoMonto` con `admiteComa`); «Diferencia» en cifra-m con color de signo («0» en secundario vacío); «Se registrará 11 nov · Ajuste de saldo · −3.500»; «No cuenta como ingreso ni gasto en el resumen.»; y la `Casilla` «Marcar todo como conciliado hasta hoy», marcada. Pie: «Registrar ajuste» (deshabilitado vacío, mal escrito o con diferencia 0; «Registrando…») y «Cancelar». Cerrar con valor escrito pregunta «¿Descartar los cambios?».

### Cupo de la tarjeta (`ResumenTarjeta`)
Escritorio: «Cupo total», «Deuda actual» (con «−», `salida-texto`) y «Disponible hoy» (rótulo en tinta) en cifra-m; barra de 8 px en `linea` con el uso en `texto` y, con una compra que cabe, un tramo de borde discontinuo `salida-texto` hasta el uso tras la compra; debajo, «Usado 32 %» y «Disponible 68 %» o «Con esta compra: 43 %» en cifra-xs secundaria. Móvil: «Disponible hoy» en cifra-l, barra de 4 px, «Usado 32 % de 4.000.000» y «Debes −1.284.300» en `etiqueta`.

### Consulta de compra (`ConsultaCompra`)
«¿Puedo comprar esto?» en cuerpo 600 (una pregunta, no un rótulo en mayúsculas), `CampoMonto` en COP y la respuesta: ícono de 18 px (✓ `entrada-texto` si cabe, ✕ `texto` si no, ? secundario sin valor), el título en cuerpo 600 y el detalle en `etiqueta` secundaria. Consulta a la API 300 ms después de la última tecla por server action, sin recargar la página; una respuesta vieja se descarta. En escritorio va a la derecha del cupo, tras un renglón vertical (360 px); en móvil, debajo, con «Registrar pago» a todo el ancho.

### Línea del ciclo (`LineaCiclo`)
«Ciclo de facturación» en `rotulo` y «16 oct – 15 nov · pago hasta 30 nov» en `etiqueta` secundaria; «Inicio», «Corte» y «Pago límite» como hitos de dos renglones (rótulo en `etiqueta` secundaria; debajo, la fecha en mono cifra-s tinta y «en 4 días» aparte en secundario, 8 px después): inicio a la izquierda, corte y pago límite a la derecha, alineados a la derecha y separados 48 px; una barra de 4 px con lo transcurrido en `secundario` y el punto «Hoy» de 8 px en `texto` (radio de campo), con «Hoy 11 nov» en cifra-xs debajo. Móvil: «Ciclo 16 oct – 15 nov» y los hitos de corte y pago límite en dos columnas (16 px).

### Ciclo en curso (`CicloTarjeta`)
«Ciclo en curso» en `rotulo` con «11 consumos» a la derecha, sobre una raya. Escritorio: `64px | flexible | 150px | 130px | 130px` (Fecha, Concepto, Categoría, Cargo, Abono; sin categoría, el concepto ocupa también esa columna): «Saldo al corte anterior» (cifra en secundario), los abonos («Pago desde Bancolombia», «Transferencia», en Abono) y «Saldo anterior pendiente» (600); «Consumos del período» (subtítulo en `etiqueta` 500 secundaria, en minúsculas, sobre raya; «Avance hacia {cuenta}», «Dividido») con «Subtotal consumos»; «Cargos del banco · no son consumos» («Cargo fijo», «Sobre 597.980» en la columna de categoría) con «Subtotal cargos»; y «Deuda actual» en cifra-m sobre una raya. Vacíos: «Sin consumos en este ciclo.», «Sin cargos en este ciclo.». En escritorio son tres tablas ARIA (saldo anterior, consumos, cargos) que solo contienen filas: los subtítulos y «Deuda actual» van fuera, los rótulos de columna se repiten ocultos en la segunda y la tercera, y un bloque vacío es una fila con una celda. Igual en el historial: el pie «Saldo al …» va fuera de la tabla. Móvil: sin abonos detallados, consumos en `48px | flexible | 96px+` (una rejilla con filas en `subgrid`: el monto crece con la cifra más ancha), cargos con su categoría. Ciclo y condiciones van en `1.4fr | 1fr` desde `xl`; en móvil no hay condiciones. Sin condiciones, `EstadoVacio` «Ciclo» con «Completar condiciones» (abre el panel) en su lugar.

### Condiciones de la tarjeta (`CondicionesTarjeta`, `CamposTarjeta`)
- **En el detalle:** «Condiciones» en `rotulo` sobre una raya; «Cupo», «Tasa de interés» («1,98 % M.V. · 26,52 % E.A.»), «Cuota de manejo» («26.990 al mes»), «Día de corte» y «Día límite de pago» («15 de cada mes»), «Se paga desde»; rótulo en `etiqueta` secundaria y valor a la derecha (cifras en mono), renglón entre filas; lo que falta, «Sin definir».
- **En `PanelCuenta`:** «Condiciones de la tarjeta» en `rotulo` secundario, con el error del bloque (`CONDICIONES_REQUERIDAS`) debajo; «Día de corte» y «Día límite de pago» (campos subrayados numéricos, dos por fila); «Tasa mensual (M.V.) · opcional» con «%» de sufijo; «Cuota de manejo · opcional» (`CampoMonto`); «Se paga desde · opcional» con `FichaCuenta` dos por fila y «Sin definir» primero (sin cuentas: «Crea una cuenta de efectivo o banco para elegirla.»). Se despliegan con el cupo al elegir tarjeta en el alta y siempre en la edición de una tarjeta.

### Esqueletos de cuentas (`EsqueletoCuentas`, `EsqueletoDetalleCuenta`, `EsqueletoArchivadas`)
En `src/components/cuentas/esqueleto-cuentas.tsx`, usados por los `loading.tsx` de `/cuentas`, `/cuentas/[id]` y `/cuentas/archivadas`. La misma forma que cada pantalla: rótulos reales donde se conocen («Cuentas», «Activos · Lo que tienes», «Pasivos · Lo que debes», «Detalle», «Patrimonio neto», «‹ Cuentas», la cabecera de archivadas) y bloques `linea` (radio `muestra`, pulso solo con `motion-safe`) donde van nombres y cifras; nunca cifras inventadas. Cada bloque va dentro de una caja con el `leading` del texto que reemplaza, para que ningún renglón cambie de alto. La lista reproduce la hoja de activos (tres filas de 69 px, con la columna del lápiz), los pasivos sin hoja y el cierre con doble raya; el detalle, la cabecera exacta (común a cuenta y tarjeta, porque la ruta aún no sabe el tipo), las cifras, las fichas del rango y renglones del historial de 53 px (67 en móvil); archivadas, filas de 68 px (110 en móvil, con las acciones debajo). «Cargando …» en un `role="status"` oculto, sin `aria-busy`. Al llegar, el contenido entra con «Asentar» (220 ms).
- **Cargas en el cliente:** al cambiar de rango (cambiar `?desde=` no vuelve a mostrar `loading.tsx`), la ficha pulsada marca `data-rango-pendiente` (`useLinkStatus`) y el historial se atenúa al 50 % (150 ms, llegada) hasta que llega el rango nuevo. En «¿Puedo comprar esto?», mientras consulta, la respuesta se atenúa igual (`aria-busy`). Los formularios de los paneles muestran «Guardando…», «Registrando…», «Archivando…» en su botón.
- **Movimiento en `/cuentas`:** las fichas del rango, «Ajustar» (móvil), el lápiz y las flechas de «Ordenar» de cada fila, los botones de la cabecera de la lista y el estado de conciliación llevan `presion`; los de borde lo oscurecen a `secundario` al pasar el cursor. El fondo `hundido` de una fila elegida del historial se funde (150 ms, llegada) y la barra de selección entra con «Asentar». Nada se desplaza; con movimiento reducido solo quedan los fundidos.
- **Sin conexión:** las server actions de la lista, los paneles, la conciliación y archivadas pasan por `llamarAccion` (`src/lib/sin-conexion.ts`, compartido con Deudas): un fallo de red se muestra en su lugar («No pudimos conectar. Revisa tu conexión e intenta de nuevo.») en vez de tumbar la página hasta su `error.tsx`.

### Edición de un ajuste (`EdicionAjuste`)
En `/movimientos`, un ajuste no abre el formulario de la captura sino un `PanelLateral` propio («Editar movimiento»; hoja inferior en móvil): «Ajuste de saldo» en cuerpo 600 con «Subió/Bajó el saldo de {cuenta}…» en secundario; monto (`CampoMonto` con su signo), la fila de fecha de la edición común (`SelectorFecha`), cuenta (`FichaCuenta` de efectivo y banco, conservando el lado), descripción y nota. Sin tipo, categoría ni partes. «Guardar cambios», «¿Descartar los cambios?» y «Eliminar movimiento…» con `BloqueEliminar` van en el pie fijo del panel, como la edición común; con la cuenta archivada, en solo lectura.

### Casilla (`Casilla`)
Casilla de verificación (no exclusiva, a diferencia de la opción única): un `<input type="checkbox">` real oculto, dibujado como cuadro de 18 px con radio `muestra` (borde `secundario`, que da el 3:1 de un control; `terciario` daba 2,8; marcada, borde y relleno en `texto` con la marca de 14 px en `fondo`). Toda la fila es el control (44 px mínimo): rótulo en cuerpo 600 (secundario si no está marcada) y descripción en `etiqueta` secundaria. Foco: contorno de latón en la fila. Con `rotuloOculto` es solo el cuadro en un objetivo de 44 px, con el rótulo para el lector de pantalla (selección de filas del historial).

### Estado vacío (C7)
«La página en blanco»: el encabezado de sección con un «0» tenue, tres renglones vacíos de 44 px y debajo el título (cuerpo 600), el detalle y la acción con un `+` (un `EnlaceTexto`; si la acción no navega, como abrir la captura, un botón con el mismo aspecto). Si el destino aún no existe, la acción va en `terciario` y deshabilitada («Próximamente»), con la misma caja de 44 px para que no salte. La acción es opcional: sin nada que crear (avisos), solo título y detalle.

### Enlace de texto (`EnlaceTexto`)
El hermano de «Botón de texto» cuando la acción navega: latón (`marca-texto`), cuerpo 600, sin caja y 44 px de alto aunque el texto mida 22, para que el objetivo táctil sea completo. Se usa en «‹ Cuentas», «+ Nueva cuenta», «Ver archivadas» y la acción del estado vacío. Si la acción no navega, es un `Boton variante="texto"`.

### Panel lateral (C22)
Un `<dialog>` modal: foco atrapado y fondo inerte. Al abrir, el foco va al diálogo (sin anillo; el lector anuncia el título y Tab llega a «Cerrar»), o al primer campo cuando el formulario lo pide (las ediciones de movimiento, al monto). Cabecera de 56 px con el título en `rotulo` secundario (en una línea: si no cabe, se corta con «…») y, a la derecha, «Cerrar» como botón: ✕ de 18 px y el rótulo en cuerpo 500 tinta, 44 px de alto, radio de campo y fondo `hundido` al pasar el cursor (`rotuloCerrar`: «Cancelar» cuando cerrar descarta lo escrito, como en la hoja de precio), sobre una raya. Solo se cierra cuando quien lo usa decide, así que puede preguntar antes de descartar cambios. Anchos `normal` (400) y `amplio` (480); `pie` opcional fijo. Medidas y movimiento en Layout.

### Selector de tipo (`SelectorTipo`)
Gasto · Ingreso · Transferencia, cada uno un interruptor (`aria-pressed`).
- **Segmentado (escritorio):** tres tramos de 40 px en una caja con borde `linea` y radio de campo, separados por divisiones. Activo: fondo `texto`, texto `fondo`, 600 (como el botón primario). Inactivo: `superficie`, texto `secundario`.
- **Pestañas (móvil):** texto en cuerpo de 44 px; el activo en 600 y tinta, con raya debajo; la transferencia se llama «Transferir».

### Ficha de cuenta (`FichaCuenta`)
Para elegir la cuenta en la captura de escritorio, dos por fila. Fuera de una transferencia no se ofrecen las inversiones (`admiteGastoIngreso`): tampoco en recurrentes, préstamos ni abonos. Grid `20px | flexible`: icono de tipo en `secundario`, nombre en cuerpo y saldo en cifra-xs secundaria («debe 1.284.300» en un pasivo). Borde `linea`, radio de campo, 48 px mínimo. Elegida: borde `texto` y nombre en 600; con monto muestra la vista previa «20.321 → 5.321» (presentación; el saldo vigente lo da la API). `sinSaldo`: solo el nombre, para «Ya está en {Nubank}» en el origen de un aporte a una meta.

### Aviso de registro (`AvisoRegistro`)
Tras registrar: marca de 16 px en verde base, «Registrado: Almuerzo −15.000 en Nequi» en cuerpo (monto en cifra-s con signo) y «Deshacer» como botón de texto, durante 5 s. Debajo, tras una división, la oferta de regla en `etiqueta` secundaria con «Crear regla» / «Cambiar regla» · «No», que sigue hasta que el usuario responde o registra otro. Borde `linea`, radio de campo, fondo `fondo` en el panel y `superficie` en la hoja móvil (formato compacto: «Almuerzo · Nequi   −15.000   Deshacer»). Sin sombra.
- **Tras editar:** el mismo aviso con otro verbo («Guardado: …», «Eliminado: …») y sin «Deshacer»; si la edición cambió el mes, termina en « · ahora en Octubre 2026».

### Formulario de movimiento, modo edición
El formulario de la captura (panel de 480 px en escritorio, hoja a pantalla completa con teclado propio en móvil) abierto por URL desde el libro, con todos sus campos precargados, tipo incluido.
- **Fecha (`SelectorFecha`, escritorio):** fila entre divisiones con «Fecha», la elegida («Hoy · mar 24 nov») y «Cambiar» como botón de 36 px (calendario de 16 px en secundario, `etiqueta` 600 tinta, borde `linea` que pasa a `secundario` al pasar el cursor, fondo `superficie`), que despliega Hoy · Ayer · Anteayer · Otra fecha.
- **Cambia respecto al registro:** título «Editar movimiento»; sin «Hoy −X», sin conceptos frecuentes, sin «Usar siempre» y sin vista previa del saldo. Botón «Guardar cambios» / «Guardando…» (sin cifra); Enter guarda.
- **Pie:** el botón y, tras una división, «Eliminar movimiento…» como vínculo discreto, que se reemplaza por la confirmación de borrado. Al cerrar con cambios (Escape, «Cerrar», el velo), el botón se reemplaza por «¿Descartar los cambios?» · «Descartar» (primario) · «Seguir editando» (texto).
- **Solo lectura:** con una cuenta archivada, los campos se ven deshabilitados (un `fieldset` deshabilitado), sin botón de guardar ni de eliminar, y arriba «La cuenta {nombre} está archivada. Restáurala para modificar este movimiento.» con «Ver archivadas».
- **Movimiento de préstamo:** la cuenta del préstamo no está entre las activas, pero no está archivada. Se muestra fija en su rol (`FichaCuentaFija`: ficha elegida, no pulsable, con el icono y «Préstamo otorgado» / «Deuda contraída»; en móvil, su celda no abre la hoja y lleva un candado de 16 px en secundario) y el selector de tipo queda deshabilitado: las opciones inactivas pasan a `terciario`. Monto, fecha, cuenta propia, categoría y nota se editan.
- **«Más opciones · nota, dividir»:** en ambos modos, la nota y el editor de partes van plegados bajo esta fila; se despliega sola si ya hay nota o partes.
- **Transferencia entre monedas («Llegó»):** el monto va en la moneda del origen (cambiarlo conserva la parte entera). Si origen y destino difieren, bajo las cuentas aparece «Llegó», un `CampoMonto` en la moneda del destino, con «Tasa 4.120,00 COP por US$ · TRM de hoy 4.120,00» como nota (tasa implícita de vista previa; sin TRM, solo la tasa). En móvil es una fila bajo Desde │ Hacia con el teclado del sistema. En `/movimientos` se muestra el lado COP como cifra y «US$ 2.000,00 · TRM 4.120,00» debajo en mono cifra-xs secundaria (`LineaCambio`), que parte en el «·» si no cabe.
- **«Usar {cuenta} siempre» (solo registro):** si la cuenta elegida no es la predeterminada, botón de texto a la derecha del rótulo «Cuenta · Nequi es la predeterminada». En móvil va al pie de la hoja de cuentas, y la predeterminada lleva «Predeterminada» en su subtítulo.

### Calendario (`Calendario`)
Reemplaza al selector de fecha nativo (azul, fuera de paleta) en «Otra fecha» de la captura y la edición, en escritorio (bajo los chips, en una hoja `superficie` con borde `linea`) y en la hoja «Fecha» de móvil (elegir cierra la hoja). Arriba, «‹ Noviembre 2026 ›»: el mes en cuerpo 600 y flechas de 40 px (44 en móvil) con chevrón de 18 px en `secundario`, fondo `hundido` al pasar el cursor. Debajo, la cuadrícula de lunes a domingo (`src/domain/fecha/calendario.ts`): iniciales en `rotulo` secundario sobre una división y los días en mono cifra-s, casillas de 40 px (44 en móvil) con radio de campo y sin días de otros meses. La elegida en tinta llena (fondo `texto`, cifra en `fondo`, 500), como el tipo activo; hoy (`fechaHoy` de la API, nunca el reloj del navegador) en `marca-texto` 600 con `aria-current="date"`; el resto con fondo `hundido` al pasar el cursor y `presion` al pulsar. Teclado: flechas día a día y semana a semana, Inicio/Fin la semana, RePág/AvPág el mes, Enter o espacio eligen; cada casilla se nombra entera («martes 24 de noviembre de 2026»). Al cambiar de mes, la cuadrícula entra con «Asentar». La edición de un ajuste usa la misma fila de fecha (`SelectorFecha`) que la edición común.

### Editor de partes (`EditorPartes`)
Dividir un movimiento entre categorías. Sin dividir es solo «Dividir entre categorías» (botón de texto); dividido, el rótulo con «No dividir» a la derecha y una fila por parte: grid `flexible | 112px | 44px` con un `<select>` nativo de categoría (sin caja, `appearance-none`, línea de `CampoSubrayado` y chevron de 18 px), el monto en cifra-s mono a la derecha sobre la misma línea y «Quitar parte» (✕ de 18 px en 44 px) solo desde la tercera. Debajo, «+ Agregar parte» y la línea del restante: «Falta asignar X» en `etiqueta` secundaria, «Sobran X» en `salida-texto` o «Las partes suman el total.», con «El resto» a la derecha cuando completar la última deja un monto mayor que cero. El error (local o de la API) va al final con `MensajeError`.
- Cada `<select>` ofrece las categorías del tipo que no usa otra parte. Con partes, los chips de categoría se ocultan.
- En escritorio vive bajo «Más opciones»; en móvil, en la hoja de Categoría, y los montos usan el teclado del sistema (`inputMode="numeric"`): el teclado propio es del total.

### Teclado numérico (`TecladoNumerico`)
Solo en la captura móvil, en vez del teclado del sistema. Tres columnas de teclas de 56 px (1–9, 000, 0, borrar) en cifra-m 400, fondo `fondo`, separadas por divisiones de 1 px y radio 0; pulsada, `hundido`. Ignora los ceros a la izquierda y no pasa de 19 dígitos (`aplicarTecla`, en `src/domain/dinero/entrada.ts`). Si el monto va en dólares, «000» se cambia por «,» (coma decimal, una sola vez, dos decimales).

### Confirmación de borrado (`BloqueEliminar`)
La confirmación ocurre en la misma página, sin diálogo emergente: reemplaza al vínculo que la abrió, en el panel, en la fila o en la edición de un movimiento. Vive en `src/components/bloque-eliminar.tsx`.
- **Contenido:** «Eliminar {nombre}» en `rotulo` y la frase de irreversibilidad (`detalle`) en cuerpo. Cada función trae la suya: cuentas, «Se borra para siempre, con su historial de cambios. No se puede deshacer.»; un movimiento, «El saldo de Nequi vuelve a como estaba. No se puede deshacer.». Debajo, el botón secundario «Eliminar {nombre}» con el texto en `salida-texto` y «Cancelar» como botón de texto.
- **Por qué terracota:** borrar es irreversible y debe distinguirse de las demás acciones. El acento queda en el texto, nunca de fondo.
- **Vínculo que la abre (`PedirEliminar`):** papelera de 16 px y el texto terminado en «…» («Eliminar cuenta…», «Eliminar movimiento…») en `etiqueta` 500 `secundario`, 44 px de alto; al pasar el cursor el texto y la papelera pasan a `salida-texto` (150 ms). Discreto en reposo, inequívoco al acercarse. Es el único modo de pedir un borrado.

### Fila en edición (C19)
Una fila que se abre en su lugar para resolver algo sin salir de la lista. Se usa al restaurar una cuenta archivada cuyo nombre ya está en uso. La fila pasa a `superficie` entre dos rayas y muestra, bajo el nombre, la explicación en `etiqueta` secundaria, un campo subrayado y la acción primaria con «Cancelar» en texto. Al cerrarse vuelve a ser una fila normal.

### Campo dependiente
Un campo que solo existe con cierta opción (el cupo de una tarjeta) no aparece ni desaparece de golpe: se despliega en su lugar, como se describe en Layout → Movimiento. Al plegarse, su valor se descarta.

### Navegación (C14)
- **Escritorio:** columna de 232 px. Arriba la marca «TINO» (titulo-2, 700, tracking amplio), luego «Registrar» como único botón en tinta (con la marca de tecla «N» en mono cifra-xs, borde `secundario`, radio de muestra) y después las entradas de 40 px con icono de 20 px. Inactiva: `secundario`, pasa a `texto` al pasar el cursor. Activa: fondo `hundido`, peso 600, radio de campo. Al pie, la TRM de referencia (`TrmReferencia`), cambiar tema y salir. «Registrar» y la tecla N abren la captura sobre la página actual, sin cambiar la URL.
- **Portada:** `/` lleva a `/resumen`, la primera entrada del menú y de la barra (también tras iniciar sesión).
- **Móvil:** barra inferior de cinco pestañas con icono y rótulo de 11 px. «Registrar» va al centro en un cuadro de 40 px en tinta y abre la captura a pantalla completa; «Más» abre una hoja con el resto.
- **Deshabilitado:** los destinos sin construir se muestran en `secundario` con `aria-disabled` y el título «Próximamente».
- **Contador de avisos:** el número de sin leer en cifra-xs `marca-texto` a la derecha de «Avisos» (menú lateral y hoja «Más») y un punto de 8 px en `marca` (radio de campo: círculo sin salir de los radios) arriba a la derecha del icono de «Más», con «{3} avisos sin leer» oculto. Con 0, ni número ni punto. El layout lo lee en el servidor (`GET /avisos/conteo`, una vez por petición) dentro de `<Suspense>` y lo pasa como nodo, como la TRM; si falla, no se muestra. Se refresca con la revalidación de cualquier acción.

### Acceso (`/login`, `/registro`)
Fuera de la aplicación: sin menú ni barra. Una columna centrada (`ColumnaAcceso`, máx. 380 px, 48 px de margen vertical): la marca «TINO» en grande y el lema «Tu libro de cuentas personal.» en secundario; debajo, sobre una raya, el contenido; al pie, la nota de privacidad («Sin conexión con tu banco…») en secundario. El formulario usa `CampoSubrayado` (correo, contraseña con «¿La olvidaste?» en `marca-texto` 600 a la derecha del rótulo) y `MensajeError`; el botón primario ocupa todo el ancho («Entrar» / «Entrando…»). «Continuar con Google» es un botón secundario deshabilitado («Próximamente») con un monograma «G» circular, separado del correo por `SeparadorCorreo` («o con tu correo» en `etiqueta` secundaria entre dos divisiones). El cambio de página va en `etiqueta` secundaria con el enlace en `marca-texto` 600. Sus medidas sueltas están en «Desvíos registrados».

### Botón de tema (`BotonTema`)
Solo en acceso y en `/estilos` (en la aplicación, cambiar tema va al pie del menú). Fijo arriba a la derecha (16 px): cuadro de 44 px con fondo `superficie`, borde `linea` y radio de campo; luna o sol de 20 px según el tema, elegido por CSS desde `data-theme` para no desajustar la hidratación. Guarda la elección en `tino-tema`.

### Iconos
Lucide, 20 px, trazo 1,5, en `currentColor` (el color del texto al que acompañan). Hay uno por destino de navegación, uno por tipo de cuenta y uno por tipo de aviso (recurrente ⟳, cobro ↗, deuda ↙, precio manual el de Inversiones), y solo se definen en `src/components/iconos.tsx`. Los iconos auxiliares dentro de controles (`+`, check, flechas) van a 16 o 18 px. El icono de tipo de cuenta va a 16 px cuando acompaña a una `etiqueta` (la cuenta de una meta: `IconoCuenta tamano={16}`) y a 22 px junto al título del detalle de una cuenta.

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
   - `11/14` escrito a mano en la barra de pestañas (el antiguo `rotulo`, que ahora es 12/16).

   El documento de referencia usa 17 px en filas de cuenta y textos de introducción. Si se queda, debe pasar a token (por ejemplo `cifra-fila` o `cuerpo-l`).
2. **Espaciados fuera de la escala base 4.** Menú, layout y lista de cuentas ya están en la escala. Quedan en acceso (`acceso/*`: 20 px `pt-5`, 28 px `gap-7` y otros). Los 30 px de sangría de la antelación (`pl-[30px]`) no son un paso: alinean con el rótulo de la casilla (18 + 12). Los 76 px de «Sin activos/pasivos» en escritorio (`pl-[76px]`) no son un paso de espaciado: alinean el texto con la columna del nombre (28 + 12 + 24 + 12).
3. **Radios circulares.** `rounded-full` en el círculo del radio de opción única y en el monograma «G» del botón de Google. El círculo del radio sigue la convención nativa del control; queda por decidir si se acepta como excepción explícita.
4. **Peso 700 y tracking 0.16em fuera de la escala** en la marca «TINO» (menú lateral, acceso y `/estilos`). Viene del documento de referencia. Si se queda, debe ser un token de marca, no un estilo suelto.
5. **Alturas sueltas.** Botones de acceso de 52 px, frente a los 48 px de C6. También 52 px (`h-13`, `min-h-13`) en los renglones vacíos de `DiaUnoInversiones` y en las filas de la hoja «Más» (`menu/barra-pestanas.tsx`), fuera de las alturas de control (40, 44, 48, 56).
6. **Numeración.** El código llama C26 a la confirmación de borrado, pero en el catálogo C26 es «Condonar». Hay que alinear la referencia.
