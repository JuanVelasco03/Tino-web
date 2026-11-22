# SPEC 09 — Deudas y préstamos

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 08, Tino-API SPEC 08
> **Fecha:** 2026-11-21
> **Objetivo:** Que el usuario lleve en `/deudas` lo que le deben y lo que debe a cada persona (consolidado, lista, detalle con historial, alta, desembolso, abono con capital e interés aparte, edición y condonación con deshacer), con todo calculado por la API.

## Por qué existe este spec

Es la primera pantalla maestro-detalle: en escritorio la lista y el detalle conviven; en móvil son dos vistas de la misma URL. Fija estos patrones:

- **Maestro-detalle por URL.** `?prestamo=<id>` elige la persona. Escritorio sin parámetro muestra la primera de la lista; móvil sin parámetro muestra solo la lista.
- **Una propuesta de la API editable.** El abono pide el reparto a `GET /prestamos/:id/propuesta-abono` y el usuario lo ajusta antes de registrar.
- **Una vista previa armada en el cliente** («Qué cambia» de la condonación), por mandato del contrato, con `bigint`. Es la única resta de montos de la web.
- **Movimientos de préstamo editables en `/movimientos`.** La cuenta de préstamo no está entre las activas: el panel de edición deja de tratarla como archivada.

Diseño: `referencias/export-deudas/` (`Deudas.dc.html`, estados Camila, Mamá con fecha pasada y condonar, escritorio y móvil; `Vacios.dc.html`, pantalla «deudas» y «Cuentas» de día uno; `Deudas Lienzo.dc.html`). Alta, desembolso, abono y edición no están dibujados.
Inventario: `../Tino-API/specs/necesidades/deudas.md`.
Contrato: `../Tino-API/docs/api/prestamos.md` (Tino-API SPEC 08); `movimientos.md` para deshacer y editar; `cuentas.md` para `patrimonioNeto`.

## Alcance

**Entra:**

- Ruta `/deudas` con «Deudas y préstamos» habilitado en el menú lateral y en la hoja «Más».
- **Consolidado:** «Te deben», «Debes» y «Posición neta», con sus subtítulos y la leyenda de la posición.
- **Lista** agrupada en «Te deben», «Debes» y «Saldadas» (los grupos vacíos no salen), con total por grupo salvo en Saldadas. Cada fila: icono del sentido, nombre, «Desde el {14 ago} · {89} días» o el cierre, la fecha acordada vencida, capital y «te debe» / «le debes» / «saldada».
- **Detalle** por `?prestamo=<id>`: tipo, nombre, capital con su rótulo, resumen (prestado, abonos, capital pendiente), condiciones (tasa, intereses cobrados o pagados, causados, fecha acordada), aviso de fecha vencida e historial. Cada fila del historial abre su movimiento en `/movimientos`.
- **Alta y desembolso** en un panel (`?nuevo=prestamo_otorgado|deuda_contraida`). Si la persona ya tiene préstamo en ese sentido, el panel registra un desembolso sobre él (y reabre uno saldado).
- **Abono** en un panel (`?prestamo=<id>&abono=1`): total y fecha, propuesta de la API, capital e interés editables.
- **Edición** en un panel (`?prestamo=<id>&editar=1`): nombre y fecha acordada.
- **Condonar** en el detalle (escritorio y móvil) para un préstamo otorgado con capital: todo o una parte, categoría de gasto, «Qué cambia» y aviso de 5 s con «Deshacer».
- **Día uno:** consolidado en 0, «Nadie anotado todavía.» y las dos entradas al alta.
- En el estado vacío de Cuentas, el enlace «Agregar una deuda con alguien» al alta con «Alguien me prestó» (N-93).
- **Movimientos de préstamo en `/movimientos`:** la edición los reconoce con `GET /prestamos`. La cuenta del préstamo queda fija y el tipo bloqueado. Monto, fecha, cuenta propia, categoría (condonación) y nota se editan.
- Carga y error de `/deudas`.
- Revalidación: toda acción de Deudas revalida `/deudas`, `/movimientos`, `/cuentas` y `/resumen`. Editar o borrar movimientos y cambiar cuentas revalida `/deudas`.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `ConsolidadoDeudas`, `ListaPrestamos`, `DetallePrestamo`, `CondonarPrestamo`, `PanelPrestamo`, `PanelAbono`, `PanelEdicionPrestamo`, `DiaUnoDeudas`.

**Fuera de alcance (specs futuros):**

- TRM en el menú, contador de avisos y entradas a Inversiones, Metas y Avisos (N-01, N-02, N-03).
- Préstamos en USD (N-100) y persona en la captura rápida (N-101).
- Préstamos como líneas en la pantalla Cuentas.
- Cambiar la tasa, eliminar un préstamo, condonar una deuda contraída, abonos recurrentes.
- Historial de cambios del préstamo (nombre, fecha acordada).
- Elegir la categoría del interés de un abono.
- Filtrar `/movimientos` por persona.
- Aviso con «Deshacer» tras alta, desembolso, abono o edición.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume los ocho endpoints de `docs/api/prestamos.md`. Para cuentas, categorías y patrimonio consume `GET /captura` y `GET /cuentas` (con `cargar()` de `services/captura.ts`, SPEC 05). Para deshacer una condonación, `DELETE /movimientos/:id`.

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/prestamos.ts`: `Ref`, `TipoPrestamo`, `EstadoPrestamo`, `PrestamoResumenDto`, `PrestamosDto`, `MovimientoPrestamoDto`, `PrestamoDetalleDto`, `PrestamoCuerpo`, `DesembolsoCuerpo`, `PrestamoCambio`, `PropuestaAbonoDto`, `AbonoCuerpo` y `CondonacionCuerpo`, tomados de `docs/api/prestamos.md`. Montos como `string` en el borde y como `bigint` desde el repositorio hacia dentro. `tasaMensual` sigue como `string` (es un porcentaje, no un monto). `condonar` devuelve `Movimiento` con `aMovimiento` de `movimientos.ts`.

### Modelo de la web

```ts
type Prestamo = {
  id: string; nombre: string; tipo: TipoPrestamo; estado: EstadoPrestamo;
  capitalPendiente: bigint; desde: string | null; fechaAcordada: string | null;
  vencido: boolean; cierre: { fecha: string; forma: "pago" | "condonacion" } | null;
  interesesCausados: bigint;
};

type Prestamos = {
  fechaHoy: string;
  teDeben: { total: bigint; personas: number; interesesCausados: bigint };
  debes: { total: bigint; personas: number; interesesCausados: bigint; conIntereses: boolean };
  posicionNeta: bigint;
  prestamos: Prestamo[];
};

type MovimientoPrestamo = {
  fecha: string; clase: "desembolso" | "abono" | "condonacion" | "interes";
  cuenta: Ref | null; categoria: Ref | null;
  capital: bigint;            // con signo
  interes: bigint; saldoCapital: bigint;
  movimientoId: string | null; movimientoInteresId: string | null;
};

type PrestamoDetalle = Prestamo & {
  fechaHoy: string; tasaMensual: string;
  totalPrestado: bigint; totalAbonado: bigint; totalCondonado: bigint;
  interesesCobrados: bigint; ultimoAbono: string | null;
  historial: MovimientoPrestamo[]; creadoEn: string;
};

type PropuestaAbono = {
  fecha: string; monto: bigint; capital: bigint; interes: bigint;
  interesesCausados: bigint; capitalPendiente: bigint;
};

/** Valores de los formularios (texto, como el de cuentas y la captura). */
type ValoresAlta = {
  tipo: TipoPrestamo; nombre: string; monto: string; cuentaId: string | null;
  fecha: string; tasaMensual: string; fechaAcordada: string;   // "" = sin fecha acordada
};
type ValoresAbono = { cuentaId: string | null; fecha: string; total: string; capital: string; interes: string };
type ValoresEdicion = { nombre: string; fechaAcordada: string };  // "" = sin fecha acordada

type CampoAlta = "tipo" | "nombre" | "monto" | "cuentaId" | "fecha" | "tasaMensual" | "fechaAcordada";
type CampoAbono = "cuentaId" | "fecha" | "total" | "capital" | "interes";
type CampoEdicion = "nombre" | "fechaAcordada";
```

### Dominio

```ts
// src/domain/prestamo/presentacion.ts
diasDesde(desde: string, fechaHoy: string): number;                 // días de calendario
textoVencido(fechaAcordada: string, fechaHoy: string): string;
// "Pasó la fecha acordada ayer" · "… hace 27 días" (< 30) · "… hace 1 mes" · "… hace 4 meses" (meses completos).
ayudaVencido(d: Pick<PrestamoDetalle, "fechaAcordada" | "ultimoAbono">): string;
// ultimoAbono posterior a fechaAcordada → "Acordaron el {30 jun}. Vas abonando: el último fue el {6 nov}."
// si no → "Acordaron el {15 oct}. Si cambió el plan, puedes mover la fecha."
formatearTasa(tasa: string): string;                                // "0" → "Sin intereses"; "1.5" → "1,5 % mensual sobre saldo"
textoCierre(tipo: TipoPrestamo, cierre: NonNullable<Prestamo["cierre"]>): string;
// pago: "Pagó todo el {20 sep}" (otorgado) / "Pagaste todo el {20 sep}" (contraída); condonación: "Condonado el {11 nov}".
descripcionHistorial(tipo: TipoPrestamo, fila: MovimientoPrestamo): string;
// ver tabla «Historial»
subtituloTeDeben(t: Prestamos["teDeben"]): string;
// 0 personas "Nadie te debe"; "{1 persona} · +{6.667} de intereses sin cobrar"; sin causados, "{2 personas}".
subtituloDebes(d: Prestamos["debes"]): string;
// 0 personas "No le debes a nadie"; "A {1 persona} · sin intereses"; con intereses "A {1 persona} · +{4.000} de intereses por pagar".
leyendaNeta(c: Pick<Prestamos, "teDeben" | "debes" | "posicionNeta">): string | null;
// > 0 "Te deben más de lo que debes."; < 0 "Debes más de lo que te deben."; 0 con saldos "Lo que te deben cubre exactamente lo que debes."; todo en 0 → null.

// src/domain/prestamo/condonacion.ts
montoCondonacion(modo: "todo" | "parte", valor: string, capitalPendiente: bigint): { monto: bigint } | { error: string };
// todo → capitalPendiente. parte: aDigitos; vacío o 0 "Escribe un valor en pesos, sin decimales."; > capital "No puedes condonar más de lo pendiente." (no se recorta).
vistaPreviaCondonacion(capitalPendiente: bigint, monto: bigint, patrimonioNeto: bigint):
  { gasto: bigint; queda: bigint; patrimonioAntes: bigint; patrimonioDespues: bigint };
// La resta la asigna el contrato al cliente. Solo presentación.

// src/domain/prestamo/formulario.ts
VALORES_ALTA(tipo: TipoPrestamo, fechaHoy: string, cuentaPredeterminada: string | null): ValoresAlta;
personaExistente(nombre: string, prestamos: readonly Prestamo[], tipo: TipoPrestamo): Prestamo | null;
// recorta y compara sin mayúsculas (toLocaleLowerCase("es")), en el mismo sentido; saldados incluidos.
cuerpoAlta(v: ValoresAlta): PrestamoCuerpo | null;            // null si el monto no se puede enviar; tasa con coma → punto; "" → "0"
cuerpoDesembolso(v: ValoresAlta): DesembolsoCuerpo | null;
VALORES_ABONO(fechaHoy: string, cuentaPredeterminada: string | null): ValoresAbono;
aplicarPropuesta(v: ValoresAbono, p: PropuestaAbono): ValoresAbono;   // capital e interés desde la propuesta
totalAbono(v: ValoresAbono): bigint | null;                          // capital + interés escritos, para el botón; null si alguno no es entero
cuerpoAbono(v: ValoresAbono, conInteres: boolean): AbonoCuerpo | null; // sin interés → interes "0", capital = total
cambioDesde(antes: ValoresEdicion, despues: ValoresEdicion): PrestamoCambio | null;
// solo los campos cambiados; "" → fechaAcordada null; sin cambios → null (no se envía, evita SIN_CAMBIOS).
```

Signo y color de un importe:

- Te debe: sin signo, en tinta. Le debes: `−` en `salida-texto`. Saldada: «0» en secundario.
- Total «Debes» con `−` en `salida`. Posición neta con `−` si es negativa, en tinta, con doble raya.
- Historial: capital con signo (`−` en abonos y condonaciones); interés con `+` en `entrada-texto` (te debe) o `−` en `salida-texto` (le debes); sin interés, «—» en terciario.

### Historial

| Clase | Otorgado | Contraída |
|---|---|---|
| `desembolso` | «Le prestaste · desde {Nequi}» | «Te prestó · a {Bancolombia}» |
| `abono` | «Abonó · a {Nequi}»; con `saldoCapital` 0, «Pagó todo · a {Nequi}» | «Abonaste · desde {Bancolombia}»; con 0, «Pagaste todo · desde {…}» |
| `interes` | «Intereses · a {Nequi}» | «Intereses · desde {Nequi}» |
| `condonacion` | «Condonaste · gasto en {Otros}» | — |

Cada fila es un enlace a `/movimientos?mes={mesDeFecha(fecha)}&movimiento={movimientoId ?? movimientoInteresId}`.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6).

**Escritorio:**

```
Deudas y préstamos                                               [+ Nuevo préstamo o deuda]  secundario, enlace
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TE DEBEN                     │ DEBES                        │ POSICIÓN NETA
500.000         cifra-l      │ −500.000     cifra-l salida  │ 0          cifra-l, doble raya
1 persona · +6.667 de …      │ A 1 persona · sin intereses  │ Lo que te deben cubre exactamente lo que debes.

✓ Condonado. Se registró un gasto de 500.000 en Otros.                         Deshacer   (aviso, 5 s)

┌────── 400 px ──────┐   ┌──────────────────────────── detalle ────────────────────────────┐
TE DEBEN        500.000   Préstamo otorgado · te debe                              TE DEBE
━━━━━━━━━━━━━━━━━━━━━━━   Camila Ortiz   titulo-2                                  500.000  cifra-l
↗ Camila Ortiz  500.000   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Desde el 14 ago · 89 días  te debe   Le prestaste       600.000   Intereses   1 % mensual sobre saldo
  ⏱ Fecha acordada: 15 oct             Abonos a capital  −100.000   Intereses cobrados       12.000
DEBES          −500.000                Capital pendiente  500.000   Causados sin cobrar       6.667
━━━━━━━━━━━━━━━━━━━━━━━   ═════════════════════════════════════   Fecha acordada           15 oct
↙ Mamá         −500.000                                             ⏱ Pasó la fecha acordada hace 27 días. Acordaron …
SALDADAS                  FECHA   HISTORIAL                       CAPITAL     INTERÉS   SALDO CAPITAL
━━━━━━━━━━━━━━━━━━━━━━━   14 ago  Le prestaste · desde Nequi      600.000          —        600.000
✓ Andrés Gil         0    02 oct  Abonó · a Nequi                −100.000    +12.000        500.000
  Pagó todo el 20 sep  saldada
                          [Registrar abono] [Cambiar fecha acordada]             Condonar lo pendiente…
└── 400 | 48 | flexible ──┘
```

- **Distribución:** consolidado a todo el ancho, en tres columnas iguales con raya fuerte arriba y renglón entre columnas. Debajo, lista y detalle en `400px | minmax(0,1fr)`, 48 px entre ellas. 32 px entre bloques.
- **Consolidado:** rótulo en `rotulo`, cifra en cifra-l, subtítulo en `etiqueta` secundaria.
- **Grupo:** rótulo y total (cifra-s) sobre raya fuerte; «Saldadas» con rótulo en secundario y sin total.
- **Fila de la lista:** enlace a `?prestamo=<id>` (`scroll: false`), rejilla `20px | flexible | auto`, 12 px entre columnas, renglón abajo. Icono de 20 px (↗ otorgado, ↙ contraída, ✓ saldada) en secundario. Nombre en cuerpo 600 (secundario si saldada). Debajo, «Desde el {14 ago} · {89} días» o `textoCierre`, en `etiqueta` secundaria. Si `vencido`, «Fecha acordada: {15 oct}» con reloj de 16 px en `marca-texto`. A la derecha, capital en cifra-s 500 y «te debe» / «le debes» / «saldada» en cifra-xs secundaria. La fila elegida lleva fondo `hundido`; al pasar el cursor, también.
- **Cabecera del detalle:** tipo («Préstamo otorgado · te debe», «Deuda contraída · le debes», «Saldada») en `etiqueta` secundaria y nombre en titulo-2. A la derecha, rótulo («Te debe», «Le debes», «Saldo») y capital en cifra-l con su color. Raya fuerte abajo.
- **Resumen y condiciones** en dos columnas iguales, 32 px entre ellas. Resumen: «Le prestaste» / «Te prestó» (`totalPrestado`), «Abonos a capital» o «Abonos y condonación» si `totalCondonado` > 0 (`totalAbonado`, con `−`), y «Capital pendiente» en 600 sobre doble raya. Condiciones en `etiqueta` secundaria con valor a la derecha: «Intereses» (`formatearTasa`). Con tasa > 0: «Intereses cobrados» / «Intereses pagados» (`interesesCobrados`) y, si no está saldado, «Causados sin cobrar» / «Causados sin pagar» (`interesesCausados`). Siempre «Fecha acordada» o «—».
- **Aviso de fecha vencida** (`vencido`): reloj en `marca-texto`, `textoVencido` en `marca-texto` 600 y `ayudaVencido` en `etiqueta` secundaria.
- **Historial:** rejilla `64px | flexible | 130px | 110px | 140px` con rótulos sobre raya fuerte. Fecha en cifra-xs secundaria, descripción en cuerpo, cifras en cifra-s y saldo en 500. Cada fila es un enlace (fondo `hundido` al pasar).
- **Acciones** (no saldado): «Registrar abono» (primario, enlace a `&abono=1`), «Cambiar fecha acordada» (secundario, enlace a `&editar=1`) y, a la derecha, «Condonar lo pendiente…» (botón de texto subrayado en secundario) solo si es otorgado. Una saldada no tiene acciones.
- **Condonar** (`CondonarPrestamo`, cliente): reemplaza la fila de acciones. Raya fuerte arriba y dos columnas `minmax(0,1fr) | 320px`, 32 px entre ellas.
  - Izquierda: «Condonar a {Camila}» (titulo-2); el texto explicativo según el modo; `OpcionUnica` «Todo lo pendiente {500.000}» / «Solo una parte»; con «parte», un campo en cifra-campo con «COP» sobre raya fuerte y su `MensajeError`; «Categoría del gasto» con `ChipCategoria` de todas las categorías de gasto, ninguna elegida; si hay causados y el modo es «todo», la nota de intereses.
  - Derecha: «Qué cambia» (`rotulo` sobre raya fuerte) con «Gasto de hoy · {categoría}» (`−` en `salida-texto`), «{Camila} te deberá» y «Patrimonio neto {antes} → {después}», de `vistaPreviaCondonacion`. Sin categoría elegida, «Gasto de hoy». Abajo, «Condonar {500.000}» (primario, deshabilitado sin monto válido o sin categoría) y «Cancelar» (secundario).
  - Error de la API: `MensajeError` bajo los botones con su `mensaje`. Con `PRESTAMO_SALDADO` se refresca la página.
- **Aviso de condonación:** fila de 44 px bajo el consolidado: check de 16 px, «Condonado. Se registró un gasto de {500.000} en {Otros}.» y «Deshacer» (botón de texto). Dura 5 s o hasta la siguiente acción. «Deshacer» envía `DELETE /movimientos/:id` con el `id` que devolvió `condonar`; si falla, el `mensaje` de la API va en el aviso.

**Móvil (390 px):**

- **Lista** (sin `?prestamo`): título; consolidado en filas («Te deben», «Debes» en cifra-m y «Posición neta» 600 en cifra-m sobre doble raya), con la leyenda debajo en `etiqueta` secundaria; los grupos con las mismas filas; al pie, «+ Nuevo préstamo o deuda» (`EnlaceTexto`).
- **Detalle** (con `?prestamo`): «‹ Deudas» (enlace a `/deudas`); tipo, nombre en titulo-2; raya fuerte, rótulo y capital en cifra-l; el aviso de fecha vencida; resumen y condiciones en una columna; historial en `minmax(0,1fr) | 84px | 84px` (descripción con «{fecha} · interés +12.000» debajo en cifra-xs, capital y saldo); «Registrar abono» (primario) y «Cambiar fecha acordada» (secundario) a todo el ancho; «Condonar lo pendiente…» debajo, como botón de texto. Condonar abre el mismo bloque en una columna, con «Qué cambia» bajo la categoría y los botones a todo el ancho.

**Día uno** (`prestamos: []`): consolidado en 0 en terciario (doble raya en renglón) y sin leyenda; «Nadie anotado todavía.» (cuerpo 600) con su explicación en secundario; sobre raya fuerte, dos filas de 60 px enlazadas: «Le presté a alguien» / «Queda como activo: te deben» (↗, a `?nuevo=prestamo_otorgado`) y «Alguien me prestó» / «Queda como pasivo: le debes» (↙, a `?nuevo=deuda_contraida`), con chevron a la derecha. En escritorio, el consolidado en tres columnas y el bloque a 400 px de ancho; el botón de la cabecera sigue.

**Panel de préstamo** (`PanelPrestamo`, `PanelLateral` `ancho="amplio"`; en móvil, la hoja inferior):

```
NUEVO PRÉSTAMO O DEUDA                                    Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
( ) Le presté a alguien · queda como activo: te deben          OpcionUnica
( ) Alguien me prestó · queda como pasivo: le debes
Persona  ______________________________                         CampoSubrayado, máx. 60
         [Camila Ortiz] [Andrés Gil]                            ChipCategoria, personas de ese sentido
         Suma al préstamo con Camila Ortiz.                      nota si coincide (+ «Está saldado: se reabre.»)
Monto    600.000                                      COP       CampoMonto
Sale de / Llega a  [Nequi] [Bancolombia] …                      FichaCuenta, dos por fila
Fecha    14/08/2026 ____                                        date nativo, por defecto hoy
Tasa mensual  1 ___  % mensual · vacío = sin intereses          CampoSubrayado decimal      (solo alta)
Fecha acordada  15/10/2026 ____  · opcional                     date nativo, min = fecha    (solo alta)
─────────────────────────────────────────────────────────────── pie fijo
[ Registrar préstamo ] / [ Registrar deuda ] / [ Registrar desembolso ]
```

- `?nuevo=` elige el sentido; un valor distinto de `deuda_contraida` abre «Le presté a alguien». Cambiar el sentido cambia las personas sugeridas y el rótulo de la cuenta.
- Tocar un chip escribe ese nombre. Si `personaExistente` encuentra a alguien, el panel pasa a desembolso: oculta tasa y fecha acordada y envía `POST /prestamos/:id/desembolsos`. Si no, `POST /prestamos`.
- La cuenta preselecciona la predeterminada de la captura, si la hay. Solo cuentas activas.
- **Errores:** el `mensaje` de la API va bajo su campo (`campo` → `CampoAlta`). `PRESTAMO_EXISTENTE` (otro dispositivo) va bajo «Persona». Sin campo, `MensajeError` al pie. El monto se valida antes de enviar («Escribe un valor en pesos, sin decimales.»).
- **Cerrar con cambios:** «¿Descartar los cambios?», como `PanelCuenta`.
- Al registrar, el panel se cierra hacia `/deudas?prestamo=<id>` con el `id` de la respuesta.

**Panel de abono** (`PanelAbono`, `PanelLateral`):

```
REGISTRAR ABONO · CAMILA ORTIZ                            Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Capital pendiente 500.000 · causados a hoy 6.667                etiqueta secundaria
Total    112.000                                      COP       CampoMonto
Fecha    11/11/2026 ____                                        date nativo, por defecto hoy
Capital  105.333                                                CampoSubrayado cifra, editable   (solo con tasa)
Interés    6.667   Causados al 11 nov: 6.667                    CampoSubrayado cifra, editable   (solo con tasa)
Llega a / Sale de  [Nequi] [Bancolombia] …                      FichaCuenta
─────────────────────────────────────────────────────────────── pie fijo
[ Registrar abono 112.000 ]
```

- **Con tasa > 0:** al salir del total o al cambiar la fecha, la web pide la propuesta (`GET /prestamos/:id/propuesta-abono`) y `aplicarPropuesta` llena capital e interés. Editar capital o interés no vuelve a pedirla. El botón dice «Registrar abono {totalAbono}». Mientras llega la propuesta, «Calculando…» bajo el total y el botón deshabilitado.
- **Sin tasa:** solo total, fecha y cuenta. Todo va a capital.
- `ABONO_EXCEDE_CAPITAL` de la propuesta va bajo el total. Al registrar, los errores van bajo su campo (`capital`, `fecha`, `cuentaId`); `PRESTAMO_SALDADO` refresca la página.
- La categoría del interés es la por defecto de la API (`categoriaInteresId` ausente).
- Al registrar, el panel se cierra hacia `/deudas?prestamo=<id>`. Si el abono salda el préstamo, la persona pasa a «Saldadas» y el detalle sigue abierto.

**Panel de edición** (`PanelEdicionPrestamo`, `PanelLateral`): «Editar préstamo», «Persona» (`CampoSubrayado`, máx. 60) y «Fecha acordada» (date nativo) con «Quitar fecha» (botón de texto) que la vacía. «Guardar cambios», deshabilitado si `cambioDesde` es `null`. Envía `PATCH` y se cierra hacia `/deudas?prestamo=<id>`. Errores bajo su campo.

### Textos literales

| Caso | Texto |
|---|---|
| Título | «Deudas y préstamos» · «Nuevo préstamo o deuda» |
| Consolidado | «Te deben» · «Debes» · «Posición neta» |
| Subtítulos | «Nadie te debe» · «{1 persona} · +{6.667} de intereses sin cobrar» · «No le debes a nadie» · «A {1 persona} · sin intereses» · «A {1 persona} · +{4.000} de intereses por pagar» |
| Leyenda | «Te deben más de lo que debes.» · «Debes más de lo que te deben.» · «Lo que te deben cubre exactamente lo que debes.» |
| Grupos | «Te deben» · «Debes» · «Saldadas» |
| Fila | «Desde el {14 ago} · {89} días» · «Fecha acordada: {15 oct}» · «te debe» · «le debes» · «saldada» |
| Cierre | «Pagó todo el {20 sep}» · «Pagaste todo el {20 sep}» · «Condonado el {11 nov}» |
| Detalle | «Préstamo otorgado · te debe» · «Deuda contraída · le debes» · «Saldada» · «Te debe» · «Le debes» · «Saldo» |
| Resumen | «Le prestaste» · «Te prestó» · «Abonos a capital» · «Abonos y condonación» · «Capital pendiente» |
| Condiciones | «Intereses» · «Sin intereses» · «{1,5} % mensual sobre saldo» · «Intereses cobrados» · «Intereses pagados» · «Causados sin cobrar» · «Causados sin pagar» · «Fecha acordada» · «—» |
| Vencida | «Pasó la fecha acordada ayer» · «… hace {27} días» · «… hace 1 mes» · «… hace {4} meses» · «Acordaron el {15 oct}. Si cambió el plan, puedes mover la fecha.» · «Acordaron el {30 jun}. Vas abonando: el último fue el {6 nov}.» |
| Historial | «Fecha» · «Historial» · «Capital» · «Interés» · «Saldo capital» (móvil «Saldo») · descripciones de la tabla «Historial» |
| Acciones | «Registrar abono» · «Cambiar fecha acordada» · «Condonar lo pendiente…» |
| Condonar | «Condonar a {Camila}» · «Todo lo pendiente» · «Solo una parte» · «Valor a condonar» · «COP» · «Categoría del gasto» · «Qué cambia» · «Gasto de hoy · {Otros}» · «{Camila} te deberá» · «Patrimonio neto» · «Condonar {500.000}» · «Cancelar» |
| Condonar, explicación | todo: «Lo que {Camila} te debe deja de ser un activo y se registra como un gasto tuyo con fecha de hoy. El préstamo se cierra y su historial se conserva.» · parte: «La parte que condonas deja de ser un activo y se registra como un gasto tuyo con fecha de hoy. El resto sigue pendiente y sus intereses siguen corriendo.» |
| Condonar, intereses | «Los intereses causados sin cobrar ({6.667}) también se dejan de cobrar. No se registran como gasto porque nunca entraron a tu patrimonio.» |
| Aviso | «Condonado. Se registró un gasto de {500.000} en {Otros}.» · «Deshacer» |
| Día uno | «Nadie anotado todavía.» · «Aquí llevas lo que prestas y lo que te prestan, persona por persona, con abonos e intereses aparte.» · «Le presté a alguien» · «Queda como activo: te deben» · «Alguien me prestó» · «Queda como pasivo: le debes» |
| Cuentas, día uno | «Agregar una deuda con alguien» |
| Panel préstamo | «Nuevo préstamo o deuda» · «Le presté a alguien» · «Alguien me prestó» · «Persona» · «Suma al préstamo con {Camila Ortiz}.» · «Está saldado: se reabre.» · «Monto» · «Sale de» · «Llega a» · «Fecha» · «Tasa mensual» · «% mensual · vacío = sin intereses» · «Fecha acordada» · «Opcional» |
| Panel préstamo, acciones | «Registrar préstamo» · «Registrar deuda» · «Registrar desembolso» · «Registrando…» |
| Panel abono | «Registrar abono · {Camila Ortiz}» · «Capital pendiente {500.000} · causados a hoy {6.667}» · «Total» · «Fecha» · «Capital» · «Interés» · «Causados al {11 nov}: {6.667}» · «Llega a» / «Sale de» · «Calculando…» · «Registrar abono {112.000}» · «Registrando…» |
| Panel edición | «Editar préstamo» · «Persona» · «Fecha acordada» · «Quitar fecha» · «Guardar cambios» / «Guardando…» |
| Monto inválido | «Escribe un valor en pesos, sin decimales.» |
| Error | «No pudimos cargar tus deudas.» + «Reintentar» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Deudas | N-05 | `entradas.ts` → `/deudas`; `GET /prestamos` |
| Consolidado | N-06, N-07, N-08, N-09 | `teDeben` → `subtituloTeDeben` |
| Consolidado | N-10, N-11, N-12 | `debes` (`conIntereses`) → `subtituloDebes` |
| Consolidado | N-13, N-14 | `posicionNeta` → `leyendaNeta` |
| Lista | N-15, N-16, N-17 | `prestamos` agrupados por `estado` sin reordenar; totales de `teDeben.total` y `debes.total` |
| Lista | N-18, N-19, N-20 | `nombre`, `estado`, `capitalPendiente` |
| Lista | N-21 | `desde`, `fechaHoy` → `diasDesde` |
| Lista | N-22 | `cierre` → `textoCierre` |
| Lista | N-23 | `vencido`, `fechaAcordada` |
| Lista | N-24 | `?prestamo=<id>` → `GET /prestamos/:id` |
| Detalle | N-25, N-26, N-27 | `tipo`, `estado`, `nombre`, `capitalPendiente` |
| Detalle | N-28, N-29, N-30 | `totalPrestado`, `totalAbonado`, `totalCondonado` |
| Detalle | N-31, N-32, N-33 | `tasaMensual` → `formatearTasa`; `interesesCobrados`; `interesesCausados` |
| Detalle | N-34, N-35, N-36 | `fechaAcordada`, `vencido`, `ultimoAbono` → `textoVencido`, `ayudaVencido` |
| Detalle | N-37 a N-42 | `historial` (orden de la API) → `descripcionHistorial` |
| Abono | N-43 a N-46 | `PanelAbono`; cuentas de `GET /cuentas` |
| Abono | N-47, N-48 | `GET /prestamos/:id/propuesta-abono` → `aplicarPropuesta`; campos editables |
| Abono | N-49 | `POST /prestamos/:id/abonos`, sin `categoriaInteresId` |
| Abono | N-50 a N-53 | `ABONO_VACIO`, `MONTO_INVALIDO`, `ABONO_EXCEDE_CAPITAL`, `CUENTA_*`, `FECHA_ANTERIOR_AL_PRESTAMO` bajo su campo |
| Abono | N-54 | `estado: "saldado"` en la respuesta y en `GET /prestamos` |
| Todas | N-55 | Revalidación de `/deudas`, `/movimientos`, `/cuentas` y `/resumen` |
| Edición | N-56, N-57, N-58 | `PATCH /prestamos/:id` con `cambioDesde`; `NOMBRE_*`, `PRESTAMO_EXISTENTE`, `FECHA_INVALIDA` |
| Detalle | N-59 | Filas del historial → `/movimientos?mes=&movimiento=` con `movimientoId` / `movimientoInteresId` |
| Detalle | N-60, N-61 | `estado`, `tipo`, `capitalPendiente` → acciones visibles |
| Condonar | N-62, N-63, N-64 | `montoCondonacion`; `CONDONACION_EXCEDE_CAPITAL` |
| Condonar | N-65, N-66 | Categorías de gasto de `GET /captura` |
| Condonar | N-67 | `patrimonioNeto` de `GET /cuentas` → `vistaPreviaCondonacion` |
| Condonar | N-68, N-69, N-70 | `POST /prestamos/:id/condonaciones` |
| Condonar | N-71, N-72 | Aviso con el `MovimientoDto`; `DELETE /movimientos/:id` |
| Todas | N-73, N-74 | `PRESTAMO_NO_ENCONTRADO` → vuelve a `/deudas`; `PRESTAMO_SALDADO` → refresca |
| Alta | N-75, N-76, N-92 | `?nuevo=prestamo_otorgado|deuda_contraida` |
| Alta | N-77, N-78, N-84 | Personas de `GET /prestamos` → `personaExistente`; `POST /prestamos` o `POST /prestamos/:id/desembolsos` |
| Alta | N-79 a N-83 | `PrestamoCuerpo` con `cuerpoAlta` |
| Alta | N-85 a N-89 | Errores con `campo` de la API → campo del formulario |
| Día uno | N-90, N-91 | `prestamos: []` → `DiaUnoDeudas` |
| Cuentas | N-93 | Enlace en el estado vacío de `ListaCuentas` |
| Movimientos | N-95, N-96 | Edición con `GET /prestamos`: cuenta del préstamo fija, tipo bloqueado; `MOVIMIENTO_DE_PRESTAMO`, `CAPITAL_NEGATIVO` |
| Todas | N-94, N-97, N-98, N-99 | Reglas de la API; la web muestra |
| Todas | — | `loading.tsx`, `error.tsx`; `formatearDinero` |
| Ya cubierto | N-04, N-66, N-67 | SPEC 04, SPEC 05, SPEC 03 |
| Fuera de alcance | N-01, N-02, N-03, N-100, N-101 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/deudas/
  page.tsx                                         # nuevo: GET /prestamos, ?prestamo=, ?nuevo=, &abono=1, &editar=1
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
  acciones.ts                                      # nuevo: crear, desembolsar, proponerAbono, abonar, editar, condonar, deshacerCondonacion
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/deudas"
src/app/(aplicacion)/cuentas/acciones.ts           # + revalida /deudas
src/app/(aplicacion)/cuentas/archivadas/acciones.ts # + revalida /deudas
src/app/(aplicacion)/movimientos/page.tsx          # edición: + préstamos de GET /prestamos
src/app/estilos/page.tsx                           # + muestras de deudas
src/app/estilos/muestras-interactivas.tsx          # + condonar y paneles de muestra
src/components/deudas/
  consolidado-deudas.tsx                           # nuevo: tres cifras (escritorio) o filas (móvil)
  lista-prestamos.tsx                              # nuevo: grupos y filas
  detalle-prestamo.tsx                             # nuevo: cabecera, resumen, condiciones, historial, acciones
  condonar-prestamo.tsx                            # nuevo, cliente: opciones, categoría, qué cambia, aviso, deshacer
  panel-prestamo.tsx                               # nuevo, cliente: alta y desembolso
  panel-abono.tsx                                  # nuevo, cliente: total, propuesta, capital e interés
  panel-edicion-prestamo.tsx                       # nuevo, cliente: nombre y fecha acordada
  dia-uno-deudas.tsx                               # nuevo
src/components/cuentas/lista-cuentas.tsx           # + «Agregar una deuda con alguien»
src/components/movimientos/usar-edicion.ts         # cuenta de préstamo fija, tipo bloqueado
src/components/captura/panel-captura.tsx           # muestra la cuenta fija del préstamo
src/components/menu/entradas.ts                    # Deudas y préstamos → /deudas
src/domain/prestamo/presentacion.ts                # nuevo (+ presentacion.test.ts)
src/domain/prestamo/condonacion.ts                 # nuevo (+ condonacion.test.ts)
src/domain/prestamo/formulario.ts                  # nuevo (+ formulario.test.ts)
src/domain/movimiento/edicion.ts                   # cuentaArchivada ignora préstamos; + cuentaDePrestamo (+ prueba)
src/services/prestamos.ts                          # nuevo
src/repositories/api/prestamos.ts                  # nuevo (+ prestamos.test.ts)
DESIGN.md                                          # + consolidado, lista, detalle, condonar, paneles, día uno
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos, y reciben las server actions por prop (como `AccionesCuenta`). Nunca importan `repositories/`.

## Plan de implementación

1. `domain/prestamo/presentacion.ts` + pruebas: `diasDesde`, `textoVencido` (ayer, 27 días, 1 mes, 4 meses, fin de mes), `ayudaVencido` (con y sin abono posterior), `formatearTasa` («0», «1», «1.5», «0.25»), `textoCierre` (pago por tipo, condonación), `descripcionHistorial` (las cuatro clases, por tipo, «Pagó todo»), subtítulos y `leyendaNeta` (positiva, negativa, cero con saldos, todo en cero).
2. `domain/prestamo/condonacion.ts` + pruebas: todo, parte válida, vacío, cero, mayor que el capital (error, sin recorte), vista previa. `domain/prestamo/formulario.ts` + pruebas: valores por defecto, `personaExistente` (mayúsculas, espacios, otro sentido, saldado), `cuerpoAlta` (tasa con coma, tasa vacía, sin fecha acordada, monto inválido → `null`), `cuerpoDesembolso`, `aplicarPropuesta`, `totalAbono`, `cuerpoAbono` con y sin interés, `cambioDesde` (solo nombre, quitar fecha, sin cambios → `null`).
3. `repositories/api/prestamos.ts` + prueba con el JSON de `docs/api/prestamos.md` (string → `bigint`, capital con signo) y con las rutas de las ocho llamadas. `services/prestamos.ts`: `401` → `/login`; lectura; escrituras con `Resultado` que nunca lanza al cliente.
4. Ruta de solo lectura: `page.tsx`, `loading.tsx`, `error.tsx`. «Deudas y préstamos» en `entradas.ts`. `/deudas` en `RUTAS_AFECTADAS` y en las acciones de cuentas. `ConsolidadoDeudas`, `ListaPrestamos`, `DetallePrestamo` (sin condonar) y `DiaUnoDeudas`, en escritorio y móvil. Un `?prestamo` desconocido vuelve a `/deudas`. Al terminar, la pantalla se ve con datos reales y las filas del historial abren su movimiento.
5. `PanelPrestamo` con `crear` y `desembolsar` en `acciones.ts`: sentido, personas sugeridas, modo desembolso, errores por campo y descarte. Botón de la cabecera, enlace móvil, entradas de día uno y el enlace de Cuentas (N-93).
6. `PanelAbono` con `proponerAbono` y `abonar` en `acciones.ts`: propuesta, campos editables, sin tasa, errores y `PRESTAMO_SALDADO`.
7. `PanelEdicionPrestamo` con `editar` en `acciones.ts`.
8. `CondonarPrestamo` con `condonar` y `deshacerCondonacion` en `acciones.ts`: todo o parte, categoría, «Qué cambia» con `patrimonioNeto`, aviso de 5 s y deshacer, en escritorio y móvil.
9. Movimientos de préstamo en `/movimientos`: `page.tsx` carga los préstamos al abrir una edición; `cuentaArchivada` los ignora; la cuenta del préstamo se muestra fija y el tipo queda bloqueado. `MOVIMIENTO_DE_PRESTAMO` y `CAPITAL_NEGATIVO` muestran su `mensaje`.
10. `/estilos`: consolidado (con saldos y en cero), lista con los tres grupos, detalle (Camila, Mamá vencida, Andrés saldado), condonar (todo y parte con error), aviso, día uno y los tres paneles, en claro y oscuro.
11. `DESIGN.md`: consolidado de deudas, lista de préstamos, detalle de préstamo, condonar, paneles de préstamo, abono y edición, y día uno de deudas.

## Criterios de aceptación

Datos de prueba: los del diseño (`Deudas.dc.html`: Camila Ortiz, Mamá, Andrés Gil) con `fechaHoy` 2026-11-11.

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] «Deudas y préstamos» está habilitado y activo en el menú lateral y en la hoja «Más», y lleva a `/deudas`.
- [ ] El consolidado dice «Te deben 500.000» con «1 persona · +6.667 de intereses sin cobrar», «Debes −500.000» en terracota con «A 1 persona · sin intereses», y «Posición neta 0» con «Lo que te deben cubre exactamente lo que debes.».
- [ ] La lista muestra «Te deben», «Debes» y «Saldadas» en ese orden. Camila dice «Desde el 14 ago · 89 días», «Fecha acordada: 15 oct», «500.000» y «te debe». Andrés dice «Pagó todo el 20 sep», «0» y «saldada», y su grupo no tiene total.
- [ ] En escritorio, `/deudas` sin parámetro muestra el detalle de la primera persona con su fila resaltada. Tocar otra fila cambia el detalle sin desplazar la página.
- [ ] El detalle de Camila dice «Préstamo otorgado · te debe», «Le prestaste 600.000», «Abonos a capital −100.000», «Capital pendiente 500.000», «1 % mensual sobre saldo», «Intereses cobrados 12.000», «Causados sin cobrar 6.667» y «Pasó la fecha acordada hace 27 días.».
- [ ] El detalle de Mamá dice «Deuda contraída · le debes», «Sin intereses», sin filas de intereses, «Pasó la fecha acordada hace 4 meses.» y «Acordaron el 30 jun. Vas abonando: el último fue el 6 nov.». No ofrece «Condonar lo pendiente…».
- [ ] El historial de Camila muestra «Le prestaste · desde Nequi» y «Abonó · a Nequi» con «+12.000» en verde y «500.000» de saldo. Tocar una fila abre ese movimiento en `/movimientos`.
- [ ] El detalle de Andrés dice «Saldada», «Saldo 0» y no tiene acciones.
- [ ] Un `?prestamo` que no existe vuelve a `/deudas`.
- [ ] En 390 px, `/deudas` muestra solo la lista con «+ Nuevo préstamo o deuda» al pie. Tocar Mamá abre su detalle con «‹ Deudas», botones a todo el ancho y sin scroll horizontal.
- [ ] «Nuevo préstamo o deuda» abre el panel con «Le presté a alguien». Prestar 200.000 a «Laura» desde Nequi, con tasa vacía, cierra el panel en el detalle de Laura con «Sin intereses»; Nequi baja 200.000 en `/cuentas` y el patrimonio neto no cambia.
- [ ] En el panel, escribir «camila ortiz» muestra «Suma al préstamo con Camila Ortiz.» y oculta tasa y fecha acordada. Registrar 100.000 deja a Camila en 600.000.
- [ ] Elegir «Andrés Gil» muestra «Está saldado: se reabre.». Registrar 50.000 lo pasa a «Te deben» con «Desde el 11 nov».
- [ ] Una fecha acordada anterior a la fecha o una tasa «1,234» muestran el `mensaje` de la API bajo su campo.
- [ ] «Registrar abono» en Camila con total 112.000 propone capital 105.333 e interés 6.667. Cambiar el interés a 0 deja el botón en «Registrar abono 105.333». Registrar deja el interés como ingreso en `/movimientos` y el capital como transferencia.
- [ ] En Mamá (sin tasa), el panel de abono no tiene capital ni interés. Abonar 500.000 la pasa a «Saldadas» con «Pagaste todo el 11 nov».
- [ ] Un abono con capital mayor que el pendiente muestra «El abono a capital supera lo pendiente.» y no se registra.
- [ ] «Cambiar fecha acordada» abre «Editar préstamo». «Quitar fecha» y guardar dejan «Fecha acordada —» y quitan el aviso de vencida. Renombrar a «Camila O.» cambia el nombre en la lista. Sin cambios, «Guardar cambios» está deshabilitado.
- [ ] «Condonar lo pendiente…» en Camila muestra «Todo lo pendiente 500.000», ninguna categoría elegida y «Condonar 500.000» deshabilitado. Al elegir «Otros», «Qué cambia» dice «Gasto de hoy · Otros −500.000», «Camila te deberá 0» y «Patrimonio neto {antes} → {antes − 500.000}».
- [ ] «Solo una parte» con 600.000 muestra «No puedes condonar más de lo pendiente.» y no se envía. Con 200.000, «Camila te deberá 300.000».
- [ ] Condonar todo pasa a Camila a «Saldadas» con «Condonado el 11 nov», muestra «Condonado. Se registró un gasto de 500.000 en Otros.» y el gasto aparece en `/movimientos` con fecha de hoy. «Deshacer» dentro de 5 s la devuelve a «Te deben» con 500.000.
- [ ] Condonar funciona en 390 px con el bloque en una columna.
- [ ] Sin préstamos se ve el consolidado en 0 sin leyenda, «Nadie anotado todavía.» y las dos entradas. «Alguien me prestó» abre el panel con ese sentido.
- [ ] En Cuentas sin cuentas, «Agregar una deuda con alguien» abre el alta en `/deudas` con «Alguien me prestó».
- [ ] En `/movimientos`, abrir el desembolso de Camila muestra la cuenta «Camila Ortiz» fija y el tipo bloqueado, sin el aviso de cuenta archivada. Cambiar el monto a 650.000 deja a Camila en 550.000 en `/deudas` sin recargar a mano.
- [ ] Borrar en `/movimientos` el desembolso de un préstamo con abonos muestra el `mensaje` de `CAPITAL_NEGATIVO` y no se borra.
- [ ] Con la API apagada, `/deudas` muestra «No pudimos cargar tus deudas.» y «Reintentar».
- [ ] `/estilos` muestra consolidado, lista, detalle, condonar, aviso, día uno y los tres paneles en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`. La tasa nunca se convierte a número en la web.
- [ ] La web no calcula capital, intereses, totales, estado ni vencido: salen de `PrestamosDto` y `PrestamoDetalleDto`. Las únicas operaciones sobre montos son `vistaPreviaCondonacion` y `totalAbono`.

## Decisiones

- **Sí:** un solo spec para la pantalla y todos sus formularios, por decisión del autor. **No:** separar condonar y edición en otro spec.
- **Sí:** ruta `/deudas` con `?prestamo=<id>`, como el panel por URL de cuentas y recurrentes. **No:** ruta dinámica `/deudas/[id]`.
- **Sí:** escritorio sin parámetro muestra la primera persona; la página trae ese detalle también en móvil, donde no se ve. **No:** detectar el formato en el servidor. Cuesta una lectura extra en móvil.
- **Sí:** alta, desembolso, abono y edición en `PanelLateral` por URL. **No:** formularios en línea en el detalle. Condonar sí va en línea, como el diseño.
- **Sí:** un solo panel para alta y desembolso: campo «Persona» con chips de las personas de ese sentido. Si el nombre coincide, desembolso. **No:** un botón «Prestar más» en el detalle, que no está dibujado. **No:** depender del error `PRESTAMO_EXISTENTE` para descubrir a la persona.
- **Sí:** chips de personas con `ChipCategoria`. **No:** un componente de chip nuevo.
- **Sí:** abono con total → propuesta de la API → capital e interés editables. **No:** dos campos sin propuesta. **No:** elegir la categoría del interés.
- **Sí:** sin tasa, el abono no muestra capital ni interés. **No:** un campo de interés que siempre iría en 0.
- **Sí:** `totalAbono` suma capital e interés escritos por el usuario, solo para el texto del botón. La API valida el abono.
- **Sí:** «Ver movimientos» se quita. Las filas del historial enlazan a su movimiento en todos los estados. **No:** un botón a `/movimientos` sin filtro. **No:** filtrar por persona, que la API no ofrece.
- **Sí:** renombrar y cambiar la fecha acordada en el mismo panel, abierto por «Cambiar fecha acordada». **No:** un panel aparte para el nombre.
- **Sí:** aviso de 5 s con «Deshacer» solo al condonar, como el diseño. **No:** deshacer alta, desembolso o abono. Se corrigen desde el historial → `/movimientos`.
- **Sí:** condonar con todas las categorías de gasto y ninguna elegida; el botón espera la elección. **No:** preelegir «Otros». Nada se clasifica por omisión.
- **Sí:** una parte mayor que el pendiente se rechaza con error en el campo (RN-13). **No:** recortarla en silencio, como hace el diseño.
- **Sí:** condonar también en móvil, con un botón de texto bajo las acciones. **No:** solo en escritorio.
- **Sí:** el texto de condonar cambia según el modo. El del diseño («El préstamo se cierra») solo es cierto al condonar todo.
- **Sí:** «Qué cambia» resta en el cliente con `patrimonioNeto` de `GET /cuentas`, como manda el contrato.
- **Sí:** el enlace de Cuentas en día uno (N-93). **No:** otros cambios en Cuentas.
- **Sí:** arreglar la edición de movimientos de préstamo en este spec con `GET /prestamos`. **No:** enmendar `MovimientoDto` con un indicador de préstamo. **No:** dejarlos en solo lectura con el aviso de archivada, que es falso.
- **Sí:** los intereses de un préstamo se editan en `/movimientos` como un movimiento normal: sus cuentas son propias y la web no los distingue. Un cambio de tipo lo rechaza la API (`MOVIMIENTO_DE_PRESTAMO`).
- **Sí:** «Pasó la fecha acordada hace N días» por debajo de 30 días y en meses completos desde ahí. La ayuda cita siempre la fecha («Acordaron el 30 jun»). **No:** «Acordaron terminar en junio», que necesita otra regla.
- **Sí:** textos relativos con `fechaHoy` de la respuesta, nunca `new Date()`.
- **Sí:** cifras del consolidado en cifra-l, nombre del detalle en titulo-2, capital del detalle en cifra-l también en móvil, filas en cifra-s y campo de condonar en cifra-campo. **No:** los 17, 24, 28 y 40 px del diseño, que no son medidas del sistema.
- **Sí:** botones de 48 px y 32 px entre bloques. **No:** los 44 px y 36 / 56 px del diseño.
- **Sí:** la leyenda de la posición neta se omite con todo en cero. **No:** «Lo que te deben cubre exactamente lo que debes.» cuando no hay nada pendiente.
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble toque en «Condonar» o «Registrar abono» | El botón se deshabilita mientras la acción está en curso. Si ya cambió el estado, la API responde `PRESTAMO_SALDADO` o `CONDONACION_EXCEDE_CAPITAL` y la página se refresca. |
| La propuesta llega tarde y pisa lo que el usuario ya editó | Cada pedido lleva su total y fecha. Solo se aplica la respuesta del último pedido, y nunca tras editar capital o interés. |
| `fechaHoy` de la API y el día del navegador difieren (zona) | Todo texto relativo usa `fechaHoy` de la respuesta. |
| «Deshacer» tras revalidar: el detalle ya cambió | El aviso guarda el `id` del gasto en el cliente, independiente del detalle. |
| Condonar con un `patrimonioNeto` viejo | La página lo lee en cada carga y toda acción revalida `/cuentas` y `/deudas`. La vista previa es informativa. |
| Una cuenta del historial está archivada | El historial muestra su nombre. Abrir el movimiento usa el modo solo lectura de SPEC 06. |
| Abrir la edición en `/movimientos` cuesta una lectura más (`GET /prestamos`) | Solo se pide al abrir una edición, no al listar. |
| Formulario de alta largo en la hoja móvil | `PanelLateral` desplaza el contenido con el pie fijo. Se verifica en 390 px. |

## Lo que **no** entra en este spec

- TRM, avisos y entradas a secciones futuras.
- Préstamos en USD y persona en la captura rápida.
- Préstamos como líneas en Cuentas.
- Cambiar la tasa, eliminar un préstamo, condonar una deuda contraída y abonos recurrentes.
- Historial de cambios del préstamo y categoría elegible para el interés.
- Filtro de movimientos por persona y deshacer fuera de la condonación.

Cada uno, si llega, va en su propio spec.
