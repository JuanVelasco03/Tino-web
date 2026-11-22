# SPEC 11 — Avisos

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 05, SPEC 08, SPEC 09, SPEC 10, Tino-API SPEC 12
> **Fecha:** 2026-11-22
> **Objetivo:** Que el usuario vea en `/avisos` sus avisos de recurrentes, cobros, deudas y precios manuales (agrupados, leídos o no, con su acción) y su antelación por tipo, con el número de sin leer en el menú, armando en la web solo las frases a partir de los campos de la API.

## Por qué existe este spec

Es la primera pantalla cuyo contenido no se guarda: la API deriva los avisos en cada lectura y manda campos, no frases. Fija estos patrones:

- **Frases armadas en el cliente.** Título, detalle largo (escritorio) y corto (móvil), monto con su sentido, plazo, grupo y hora salen de funciones puras de `domain/aviso/` con los campos de `AvisoDto`. La web no calcula leído, resuelto, montos ni capital.
- **Estado optimista.** Alternar leído, «Marcar todo» y cambiar la antelación cambian la pantalla al instante con `useOptimistic` y vuelven atrás si la API falla.
- **Un dato en el layout.** El número de sin leer se lee en el layout (como la TRM, SPEC 10) y se refresca con la revalidación de cualquier acción.
- **Una acción de otro módulo dentro de la fila.** «Confirmar» y «Ajustar» llaman a `POST /recurrentes/:id/confirmar` desde `/avisos`. «Registrar abono» y «Registrar precio» navegan a los paneles que ya existen.

Diseño: `referencias/export-avisos/` (`Avisos.dc.html`, escritorio claro y oscuro, móvil lista y antelación; `Avisos Lienzo.dc.html`). El estado vacío, el ajuste en la fila, los avisos de precio manual y de deuda pendiente no están dibujados.
Inventario: `../Tino-API/specs/necesidades/avisos.md`.
Contrato: `../Tino-API/docs/api/avisos.md` (Tino-API SPEC 12); `recurrentes.md` para confirmar.

## Alcance

**Entra:**

- Ruta `/avisos` con «Avisos» habilitado en el menú lateral y en la hoja «Más».
- **Contador de sin leer** (N-02): número junto a «Avisos» en el menú lateral y en la hoja «Más», y un punto de marca sobre la pestaña «Más». Sin número ni punto si es 0.
- **Cabecera:** «Avisos», «{3} sin leer» o «Todo leído», y «Marcar todo como leído» (atenuado y deshabilitado sin sin leer).
- **Lista** agrupada en «Hoy», «Ayer», «Esta semana» y «Antes» (los grupos vacíos no salen), en el orden de la API. Cada fila: punto de no leído, icono del tipo (solo escritorio), título, detalle (largo en escritorio, corto en móvil), monto con su sentido, momento y acción si el aviso no está resuelto.
- **Alternar leído:** tocar la fila alterna leído y no leído (`PATCH /avisos/:clave`), con estado optimista.
- **Marcar todo:** `POST /avisos/leer-todos`, con estado optimista.
- **Acciones:** «Confirmar» (recurrente fijo) confirma en la fila. «Ajustar» (recurrente variable) abre un campo de monto en la fila y confirma con ese monto. «Registrar abono» (cobro) lleva a `/deudas?prestamo=<id>&abono=1`. «Registrar precio» (precio manual) lleva a `/inversiones?inversion=<id>&precio=<activoId>`. Deuda no lleva acción.
- **Antelación por tipo:** los cuatro tipos con casilla de activo, descripción y opciones. Marcar o desmarcar la casilla y elegir una opción se guardan (`PATCH /avisos/config/:tipo`), con estado optimista. Elegir una opción activa el tipo.
- **Distribución:** desde 1280 px (xl), lista y antelación lado a lado. Por debajo, la lista con el botón «Configurar», y la antelación en `/avisos?antelacion=1` con «‹ Avisos».
- **Vacío:** «Sin avisos.» con su explicación. La antelación sigue a la vista o a un toque.
- Carga y error de `/avisos`.
- Revalidación: las acciones de avisos revalidan `/avisos`. Confirmar revalida además las rutas de la captura. Las acciones de recurrentes, deudas, inversiones, captura y movimientos revalidan `/avisos`.
- `EstadoVacio` con acción opcional.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `ListaAvisos`, `FilaAviso`, `AntelacionAvisos`, `Casilla`, `IconoAviso` y el contador del menú.

**Fuera de alcance (specs futuros):**

- Avisos de la tarjeta de crédito: pago, corte, «Ver tarjeta» y su deuda actual (N-41, N-42, N-43).
- Metas (N-04).
- Push, correo o cualquier aviso fuera de la app.
- Hora de aviso editable.
- «Deshacer» tras confirmar desde un aviso.
- Volver a `/avisos` al cerrar el panel de abono o el bloque de precio.
- Refrescar el contador sin una acción ni una navegación completa (sondeo, tiempo real).
- Resaltar la ocurrencia en `/recurrentes` desde un aviso.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume los cinco endpoints de `docs/api/avisos.md` y `POST /recurrentes/:id/confirmar` (con `confirmar` de `repositories/api/recurrentes.ts`, SPEC 08).

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/avisos.ts`: `Ref`, `TipoAviso`, `AvisoBaseDto`, `AvisoRecurrenteDto`, `ResolucionPrestamoDto`, `AvisoCobroDto`, `AvisoDeudaDto`, `AvisoPrecioDto`, `AvisoDto`, `AvisoConfigDto`, `AvisosDto`, `ConteoAvisosDto`, `MarcaCuerpo` y `ConfigCuerpo`, tomados de `docs/api/avisos.md`. Montos como `string` en el borde y como `bigint` desde el repositorio hacia dentro. `dias` y `opciones` son `number` (días, no montos). La `clave` va codificada con `encodeURIComponent` en la ruta del `PATCH`.

### Modelo de la web

```ts
type AvisoBase = { clave: string; tipo: TipoAviso; instante: string; leido: boolean; resuelto: boolean };

type AvisoRecurrente = AvisoBase & {
  tipo: "recurrente";
  recurrente: { id: string; concepto: string; tipo: "gasto" | "ingreso" | "transferencia"; variable: boolean };
  vencimiento: string; cuenta: Ref | null; monto: bigint; estimado: boolean;
  resolucion: { forma: "confirmada" | "omitida"; fecha: string } | null;
};

type ResolucionPrestamo = { forma: "abono" | "condonacion"; fecha: string; monto: bigint; cuenta: Ref | null };

type AvisoCobro = AvisoBase & {
  tipo: "cobro"; prestamo: Ref; fechaAcordada: string; recordatorio: string;
  monto: bigint; capitalPendiente: bigint; proximoRecordatorio: string | null;
  resolucion: ResolucionPrestamo | null;
};

type AvisoDeuda = AvisoBase & {
  tipo: "deuda"; prestamo: Ref; fechaAcordada: string;
  monto: bigint; capitalPendiente: bigint; resolucion: ResolucionPrestamo | null;
};

type AvisoPrecio = AvisoBase & {
  tipo: "precio_manual"; activo: { id: string; simbolo: string; nombre: string };
  inversion: Ref; precioFecha: string; resolucion: { fecha: string } | null;
};

type Aviso = AvisoRecurrente | AvisoCobro | AvisoDeuda | AvisoPrecio;

type AvisoConfig = { tipo: TipoAviso; activo: boolean; dias: number; opciones: number[] };

type Avisos = {
  fechaHoy: string; zonaHoraria: string; horaAvisos: string;
  noLeidos: number; avisos: Aviso[]; config: AvisoConfig[];
};
```

### Dominio

```ts
// src/domain/aviso/presentacion.ts
fechaLocal(instante: string, zona: string): string;          // ISO UTC → "YYYY-MM-DD" en la zona, con Intl
horaLocal(instante: string, zona: string): string;           // → "08:00"
diasEntre(desde: string, hasta: string): number;             // días de calendario, con signo
type Grupo = "Hoy" | "Ayer" | "Esta semana" | "Antes";
grupoDe(fechaAviso: string, fechaHoy: string): Grupo;        // 0 Hoy · 1 Ayer · 2 a 6 Esta semana · 7 o más Antes
agrupar(avisos: readonly Aviso[], fechaHoy: string, zona: string): { grupo: Grupo; avisos: Aviso[] }[];
// en el orden de Grupo, sin reordenar dentro; sin grupos vacíos
momento(a: Aviso, fechaHoy: string, zona: string): string;
// Hoy "08:00" · Ayer "mar 10 nov · 08:00" · más antiguo "lun 9 nov" (formatearDiaSemana)
tituloAviso(a: Aviso, zona: string): string;                 // ver «Títulos»
detalleAviso(a: Aviso, formato: "largo" | "corto"): string;  // ver «Detalles»
montoAviso(a: Aviso): { texto: string; sentido: "entrada" | "salida" } | null;
// recurrente: gasto y transferencia salen, ingreso entra; "≈ " delante si estimado. Cobro entra. Deuda sale. Precio → null.
// salida con "−"; entrada sin signo (formatearDinero)
type AccionAviso =
  | { clase: "confirmar"; rotulo: "Confirmar" }
  | { clase: "ajustar"; rotulo: "Ajustar" }
  | { clase: "enlace"; rotulo: "Registrar abono" | "Registrar precio"; href: string };
accionAviso(a: Aviso): AccionAviso | null;                   // null si resuelto o si es deuda
textoNoLeidos(n: number): string;                            // 0 "Todo leído" · "1 sin leer" · "3 sin leer"
marcarTodos(avisos: readonly Aviso[]): Aviso[];              // estado optimista de «Marcar todo»
alternar(avisos: readonly Aviso[], clave: string): Aviso[];  // estado optimista de la fila
contarNoLeidos(avisos: readonly Aviso[]): number;            // solo para la cabecera optimista

// src/domain/aviso/antelacion.ts
TIPOS: Record<TipoAviso, { rotulo: string; descripcion: string; prefijo: string }>;
rotuloOpcion(tipo: TipoAviso, dias: number): string;         // ver «Antelación»
aplicarCambio(config: readonly AvisoConfig[], tipo: TipoAviso, cambio: ConfigCuerpo): AvisoConfig[];
// estado optimista: `dias` sin `activo` → activo true, como la API
zonaLegible(zona: string): string;
// Intl.DateTimeFormat("es-CO", { timeZone, timeZoneName: "longGeneric" }) → "hora de Colombia"; si falla, la zona tal cual
```

El plazo de los títulos es `diasEntre(fechaLocal(instante, zona), fecha)`, como manda el contrato. Todo texto relativo usa `fechaHoy` y `zonaHoraria` de la respuesta, nunca `new Date()`.

### Títulos

| Tipo | Plazo 0 | Plazo 1 | Plazo n |
|---|---|---|---|
| `recurrente` gasto o transferencia | «{Gas Vanti} vence hoy» | «… vence mañana» | «… vence en {3} días» |
| `recurrente` ingreso | «{Salario} llega hoy» | «… llega mañana» | «… llega en {3} días» |
| `deuda` | «Abono a {Mamá} hoy» | «Abono a {Mamá} mañana» | «Abono a {Mamá} en {3} días» |

- `cobro`: el primero (`recordatorio` = `fechaAcordada`), «{Camila}: hoy es la fecha acordada». Los siguientes, «{Camila}: van {30} días de la fecha acordada» con `diasEntre(fechaAcordada, recordatorio)`.
- `precio_manual`: «{VOO} lleva {7} días sin precio», con `diasEntre(precioFecha, fechaLocal(instante))`.
- Un plazo negativo (no debería llegar) se trata como 0.

### Detalles

Fechas con `formatearFechaSinAnio` («8 nov»), montos con `formatearDinero`. «desde {cuenta}» en gasto, transferencia y abonaste; «a {cuenta}» en ingreso y abonó. Sin cuenta, se omite el tramo.

| Aviso | Largo (escritorio) | Corto (móvil) |
|---|---|---|
| Recurrente fijo, pendiente | «Vence el {12 nov}, desde {Bancolombia}. Sigue por confirmar.» (ingreso: «Llega el {12 nov}, a {Nequi}. Sigue por confirmar.») | «Vence el {12 nov} · por confirmar.» / «Llega el {12 nov} · por confirmar.» |
| Recurrente variable, pendiente | «Vence el {14 nov}, desde {Nequi}. Importe estimado: ajústalo cuando llegue el recibo.» | «Estimado · ajústalo cuando llegue el recibo.» |
| Recurrente confirmado | «Se confirmó el {8 nov} desde {Bancolombia}.» | «Confirmado el {8 nov}.» |
| Recurrente omitido | «Se omitió el {8 nov}.» | «Omitido el {8 nov}.» |
| Cobro pendiente | «Te debe {500.000}. El próximo recordatorio es el {14 nov}.» (sin próximo: «Te debe {500.000}.») | «Te debe {500.000} · próximo recordatorio {14 nov}.» / «Te debe {500.000}.» |
| Cobro, abono | «Abonó {100.000} el {6 nov} a {Nequi}. Quedan {500.000}.» (capital 0: «… Ya no te debe nada.») | «Abonó el {6 nov} · quedan {500.000}.» / «Abonó el {6 nov} · saldado.» |
| Cobro, condonación | «Condonaste {100.000} el {6 nov}. Quedan {400.000}.» (capital 0: «… Ya no te debe nada.») | «Condonado el {6 nov} · quedan {400.000}.» / «Condonado el {6 nov} · saldado.» |
| Deuda pendiente | «Acordaron el {15 nov}. Le debes {500.000}.» | «Fecha acordada {15 nov} · le debes {500.000}.» |
| Deuda, abono | «Abonaste {100.000} el {6 nov} desde {Nequi}. Quedan {500.000}.» (capital 0: «… Ya no le debes nada.») | «Abonaste el {6 nov} · quedan {500.000}.» / «Abonaste el {6 nov} · saldada.» |
| Deuda, condonación | «Te condonó {100.000} el {6 nov}. Quedan {400.000}.» | «Condonado el {6 nov} · quedan {400.000}.» |
| Precio pendiente | «{Vanguard S&P 500} en {XTB}: el último precio es del {3 nov}. Regístralo para valorar la inversión a mercado.» | «Último precio {3 nov} · {XTB}.» |
| Precio resuelto | «Registraste un precio nuevo el {12 nov}.» | «Precio nuevo el {12 nov}.» |

«Quedan» usa `capitalPendiente` (hoy); el monto de la resolución es `resolucion.monto`.

### Antelación

| Tipo | Rótulo | Descripción | Prefijo | Opciones |
|---|---|---|---|---|
| `recurrente` | «Recurrentes por confirmar» | «Cuando aparecen en la bandeja, antes de vencer.» | «Avisar» | 1 «1 día antes» · 3 «3 días antes» · 5 «5 días antes» · 7 «1 semana antes» |
| `cobro` | «Cobros pendientes» | «El día acordado con quien te debe.» | «Repetir después» | 0 «Nunca» · 14 «Cada 2 semanas» · 30 «Cada mes» |
| `deuda` | «Lo que debes» | «Antes de la fecha que acordaste con quien te prestó.» | «Avisar» | 1 «1 día antes» · 3 «3 días antes» · 7 «1 semana antes» |
| `precio_manual` | «Precio manual sin actualizar» | «Inversiones con cotización ingresada a mano.» | «Después de» | 3 «3 días» · 7 «7 días» · 14 «14 días» |

Las opciones salen de `opciones` de la API, en su orden. Un valor que no está en la tabla se muestra como «{n} días» (con «antes» si el prefijo es «Avisar»).

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6).

**Escritorio (≥ 1280 px):**

```
Avisos   titulo-1                                                     [Marcar todo como leído]  secundario
3 sin leer   etiqueta secundaria
┌──────────────────────────── lista ───────────────────────────┐  56  ┌──────── 420 px ────────┐
HOY                                                                  ANTELACIÓN POR TIPO   Avisos a las 08:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● ⟳  Gas Vanti vence en 3 días                ≈ −32.400   08:00      ■ Recurrentes por confirmar
     Vence el 14 nov, desde Nequi. Importe estimado: …      Ajustar       Cuando aparecen en la bandeja, antes de vencer.
ESTA SEMANA                                                              Avisar [1 día antes] [3 días antes✓] …
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ■ Cobros pendientes
● ⟳  Internet Claro hogar vence en 3 días       −89.900   lun 9 nov      El día acordado con quien te debe.
     Vence el 12 nov, desde Bancolombia. Sigue por confirmar. Confirmar   Repetir después [Nunca] [Cada 2 semanas] [Cada mes✓]
  ⟳  Gimnasio vence en 3 días                   −95.000   jue 5 nov  ■ Lo que debes …
     Se confirmó el 8 nov desde Bancolombia.                         □ Precio manual sin actualizar …
ANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↙  Abono a Mamá en 3 días                    −100.000   mar 3 nov
     Abonaste 100.000 el 6 nov desde Nequi. Quedan 500.000.
  ↗  Camila: hoy es la fecha acordada           500.000   jue 15 oct
     Te debe 500.000. El próximo recordatorio es el 14 nov.  Registrar abono
└── minmax(0,1fr) | 56 | 420 ──┘
```

- **Distribución:** cabecera a todo el ancho; debajo, `minmax(0,1fr) | 420px`, 56 px entre columnas, alineadas arriba. 32 px entre bloques.
- **Cabecera:** «Avisos» en titulo-1 y `textoNoLeidos` en `etiqueta` secundaria. «Marcar todo como leído» (`Boton` secundario) a la derecha, deshabilitado con 0 sin leer (texto `terciario`).
- **Grupo:** rótulo en `rotulo` sobre raya fuerte.
- **Fila** (`FilaAviso`): un `<li>` en rejilla `12px | 20px | minmax(0,1fr) | auto | auto`, 12 px entre columnas, renglón abajo. Un `<button>` ocupa punto, icono, título, detalle, monto y momento, y alterna leído. La acción va en la última columna, bajo el momento, fuera del botón. Fondo `hundido` al pasar sobre el botón.
  - Punto de 8 px: `marca` si no leído; transparente (conserva el espacio) si leído. Texto oculto «No leído» / «Leído» para lectores de pantalla.
  - Icono de 20 px en secundario (`IconoAviso`): recurrente ⟳ (el de Recurrentes), cobro ↗, deuda ↙, precio manual el de Inversiones.
  - Título en cuerpo: no leído 600 en `texto`; leído 400 en `secundario`. Detalle largo en `etiqueta` secundaria.
  - Monto en cifra-s: salida con `−` en `salida-texto`, entrada sin signo en tinta. Sin monto, la columna queda vacía.
  - Momento en cifra-xs secundaria, mínimo 110 px de ancho, alineado a la derecha.
  - Acción en `etiqueta` 600 `marca-texto` (botón de texto o enlace, 44 px de área táctil).
  - El botón tiene la etiqueta accesible «Marcar como leído» o «Marcar como no leído» además del título.
- **Antelación** (`AntelacionAvisos`): rótulo «Antelación por tipo» y, a la derecha, «Avisos a las {08:00}» (hora en mono `texto`), sobre raya fuerte. Un bloque por tipo de `config`, en su orden, con renglón abajo:
  - `Casilla` de 18 px con rótulo (cuerpo 600; secundario si inactivo) y descripción (`etiqueta` secundaria). Toda la fila de la casilla es el control.
  - Debajo, con 30 px de sangría, el prefijo en `etiqueta` secundaria y las opciones como `ChipCategoria` «como opción» (36 px; 44 px en móvil). La vigente lleva la marca de elegido. Con el tipo inactivo, prefijo y chips en `terciario` y ninguno marcado; siguen activos: elegir uno activa el tipo.
- **Ajuste en la fila** (recurrente variable): «Ajustar» despliega bajo la fila, en las columnas 3 a 5, un campo en cifra-campo con «COP» sobre raya fuerte, con el monto del aviso, y «Confirmar {35.000}» (primario) y «Cancelar» (secundario). Monto vacío, cero o con decimales: «Escribe un valor en pesos, sin decimales.» bajo el campo, sin enviar. Un solo ajuste abierto a la vez.

**Entre 768 y 1279 px:** la cabecera de escritorio con un botón de icono «Configurar» (44 px, deslizadores) junto a «Marcar todo como leído», que lleva a `?antelacion=1`. Solo la lista, con las filas de escritorio.

**Móvil (390 px):**

- **Lista** (sin `?antelacion`): «Avisos» en titulo-1 y el botón de icono «Configurar» a la derecha. Debajo, `textoNoLeidos` a la izquierda y «Marcar todo leído» (botón de texto `marca-texto`, 44 px) a la derecha. Grupos con rótulo sobre raya fuerte.
- **Fila móvil:** rejilla `10px | minmax(0,1fr) | auto`, 12 px entre columnas, sin icono. El botón ocupa punto, título, detalle corto, momento y monto (cifra-s). Debajo del momento, en la columna 2, la acción fuera del botón. El ajuste se abre a todo el ancho con los botones apilados.
- **Antelación** (`?antelacion=1`): «‹ Avisos» (enlace a `/avisos`), «Antelación por tipo» en titulo-2 y «Los avisos llegan a las {08:00}, {hora de Colombia}.» en `etiqueta` secundaria (`zonaLegible`). Los bloques por tipo con raya fuerte sobre el primero y el prefijo en su propia línea.
- En xl, `?antelacion=1` se ignora: la antelación ya está al lado.

**Vacío** (`avisos: []`): en el lugar de la lista, `EstadoVacio` con rótulo «Avisos», «Sin avisos.» y «Aquí llegan los recurrentes por vencer, los cobros y lo que debes, según la antelación de cada tipo.», sin acción. La cabecera dice «Todo leído» y el botón queda deshabilitado.

### Comportamiento

- **Alternar leído:** la fila cambia al instante (`alternar`), y la cabecera con ella. Envía `PATCH /avisos/:clave` con el valor nuevo. Si falla, vuelve atrás y muestra el `mensaje` de la API en un `MensajeError` bajo la fila. `AVISO_NO_ENCONTRADO` refresca la página (el aviso ya no está).
- **Marcar todo:** todos pasan a leídos al instante (`marcarTodos`). Envía `POST /avisos/leer-todos`. Si falla, vuelve atrás y muestra el `mensaje` bajo la cabecera.
- **Antelación:** el bloque cambia al instante (`aplicarCambio`). Envía `PATCH /avisos/config/:tipo` con `{ activo }` (casilla) o `{ dias }` (opción). Al responder, la página se revalida y la lista refleja los tipos y claves nuevos. Si falla, vuelve atrás y muestra el `mensaje` bajo el bloque.
- **Confirmar / Ajustar:** envía `POST /recurrentes/:id/confirmar` con `{ vencimiento }` o `{ vencimiento, monto }`. El botón se deshabilita y dice «Confirmando…». Al responder, la página se revalida y el aviso llega resuelto. `OCURRENCIA_CERRADA` u `OCURRENCIA_INVALIDA` muestran su `mensaje` bajo la fila y refrescan la página. Otro error, su `mensaje` bajo la fila.
- **Contador:** el layout pide `GET /avisos/conteo` una vez por petición (`cache`), dentro de `<Suspense>`. Si falla, no se muestra y la página sigue. Se refresca cuando una server action revalida (la respuesta trae el layout de nuevo) o en una carga completa.

### Menú

- `entradas.ts`: «Avisos» → `/avisos`.
- Menú lateral: a la derecha de «Avisos», el número en cifra-xs `marca-texto`. Sin número si es 0.
- Hoja «Más»: el mismo número junto a «Avisos».
- Pestaña «Más»: un punto de 8 px en `marca` arriba a la derecha del icono si hay sin leer, con texto oculto «{3} avisos sin leer».
- El número llega como un nodo del layout (como la TRM), no como dato que lean los componentes del menú.

### Textos literales

| Caso | Texto |
|---|---|
| Título | «Avisos» |
| Cabecera | «{3} sin leer» · «1 sin leer» · «Todo leído» · «Marcar todo como leído» (escritorio) · «Marcar todo leído» (móvil) · «Configurar» (etiqueta accesible) |
| Grupos | «Hoy» · «Ayer» · «Esta semana» · «Antes» |
| Fila | títulos y detalles de las tablas · «No leído» · «Leído» · «Marcar como leído» · «Marcar como no leído» |
| Acciones | «Confirmar» · «Ajustar» · «Registrar abono» · «Registrar precio» · «Confirmar {35.000}» · «Confirmando…» · «Cancelar» · «COP» |
| Antelación | «Antelación por tipo» · «Avisos a las {08:00}» · «‹ Avisos» · «Los avisos llegan a las {08:00}, {hora de Colombia}.» · rótulos, descripciones, prefijos y opciones de la tabla |
| Menú | «{3} avisos sin leer» (oculto, pestaña «Más») |
| Vacío | «Sin avisos.» · «Aquí llegan los recurrentes por vencer, los cobros y lo que debes, según la antelación de cada tipo.» |
| Monto inválido | «Escribe un valor en pesos, sin decimales.» |
| Error | «No pudimos cargar tus avisos.» + «Reintentar» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Menú | N-02 | `GET /avisos/conteo` en el layout |
| Menú | N-03 | `entradas.ts` → `/avisos` |
| Cabecera | N-06, N-08 | `noLeidos` → `textoNoLeidos`; optimista con `contarNoLeidos` |
| Cabecera | N-07 | `POST /avisos/leer-todos` |
| Lista | N-09, N-10, N-11 | `avisos` (orden y 60 días de la API) → `agrupar` con `instante`, `zonaHoraria`, `fechaHoy` |
| Lista | N-12 | `tipo` → `IconoAviso` |
| Lista | N-13 | `leido` |
| Lista | N-14 | `tituloAviso` con `instante`, `vencimiento`, `fechaAcordada`, `recordatorio`, `precioFecha` |
| Lista | N-15, N-16, N-44 | `detalleAviso` largo y corto con `cuenta`, `estimado`, `capitalPendiente`, `proximoRecordatorio`, `resolucion` |
| Lista | N-17, N-18 | `monto`, `estimado`, `recurrente.tipo`, `tipo` → `montoAviso` |
| Lista | N-19 | `instante` → `momento` |
| Lista | N-20, N-21 | `POST /recurrentes/:id/confirmar` con `vencimiento` (y `monto` al ajustar) |
| Lista | N-22 | `/deudas?prestamo=<prestamo.id>&abono=1` |
| Lista | N-23 | `/inversiones?inversion=<inversion.id>&precio=<activo.id>` |
| Lista | N-24 | `resuelto` → `accionAviso` |
| Lista | N-25 | `PATCH /avisos/:clave` |
| Lista | N-26, N-27 | Regla de la API; la web muestra |
| Vacío | N-28 | `avisos: []` → `EstadoVacio` |
| Antelación | N-29 | `horaAvisos`, `zonaHoraria` → `zonaLegible` |
| Antelación | N-30, N-31 | `config` → `TIPOS`, `rotuloOpcion` |
| Antelación | N-32, N-33 | `PATCH /avisos/config/:tipo` con `activo` o `dias` |
| Antelación | N-34, N-35 | Reglas de la API; `ANTELACION_INVALIDA` muestra su `mensaje` |
| Lista | N-36 a N-40 | Reglas de la API; la web muestra |
| Móvil | N-45 | `?antelacion=1` y «‹ Avisos» |
| Todas | — | `loading.tsx`, `error.tsx`; `formatearDinero`, `formatearFechaSinAnio`, `formatearDiaSemana` |
| Ya cubierto | N-01, N-05 | SPEC 10, SPEC 05 |
| Fuera de alcance | N-04, N-41, N-42, N-43 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/avisos/
  page.tsx                                         # nuevo: GET /avisos, ?antelacion=1
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
  acciones.ts                                      # nuevo: marcar, leerTodos, configurar, confirmar
src/app/(aplicacion)/layout.tsx                    # + contador de avisos (cache, Suspense) para el menú y la hoja
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/avisos"
src/app/(aplicacion)/recurrentes/acciones.ts       # SOLO_RECURRENTES + "/avisos"
src/app/(aplicacion)/deudas/acciones.ts            # RUTAS_DEUDAS + "/avisos"
src/app/(aplicacion)/inversiones/acciones.ts       # RUTAS_INVERSIONES + "/avisos"
src/app/estilos/page.tsx                           # + muestras de avisos
src/app/estilos/muestras-avisos.tsx                # nuevo, cliente: lista, fila, ajuste, antelación, casilla
src/components/avisos/
  lista-avisos.tsx                                 # nuevo, cliente: cabecera, grupos, optimista, marcar todo, vacío
  fila-aviso.tsx                                   # nuevo, cliente: botón de leído, acción, ajuste en línea
  antelacion-avisos.tsx                            # nuevo, cliente: tipos, casilla, opciones, optimista
src/components/casilla.tsx                         # nuevo: casilla de 18 px
src/components/estado-vacio.tsx                    # acción opcional
src/components/iconos.tsx                          # + IconoAviso
src/components/menu/entradas.ts                    # Avisos → /avisos
src/components/menu/menu-lateral.tsx               # + contador junto a Avisos
src/components/menu/barra-pestanas.tsx             # + contador en la hoja y punto en «Más»
src/domain/aviso/presentacion.ts                   # nuevo (+ presentacion.test.ts)
src/domain/aviso/antelacion.ts                     # nuevo (+ antelacion.test.ts)
src/services/avisos.ts                             # nuevo
src/repositories/api/avisos.ts                     # nuevo (+ avisos.test.ts)
DESIGN.md                                          # + lista, fila, antelación, casilla, contador
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos, y reciben las server actions por prop. Nunca importan `repositories/`. `confirmar` de `acciones.ts` usa `services/recurrentes.ts`.

## Plan de implementación

1. `domain/aviso/presentacion.ts` + pruebas: `fechaLocal` y `horaLocal` (Bogotá, borde de medianoche UTC), `diasEntre`, `grupoDe` (0, 1, 2, 6, 7), `agrupar` (orden, grupos vacíos fuera), `momento` (hoy, ayer, antes), `tituloAviso` (los cuatro tipos, plazos 0, 1 y n, ingreso, cobro repetido), `detalleAviso` (cada fila de «Detalles», largo y corto, sin cuenta, capital 0), `montoAviso` (sentidos, «≈», precio sin monto), `accionAviso` (fijo, variable, cobro, precio, deuda, resuelto), `textoNoLeidos`, `alternar`, `marcarTodos`, `contarNoLeidos`.
2. `domain/aviso/antelacion.ts` + pruebas: `TIPOS`, `rotuloOpcion` (cada opción de la tabla y un valor desconocido), `aplicarCambio` (activo, `dias` que activa), `zonaLegible` (Bogotá y zona inválida).
3. `repositories/api/avisos.ts` + prueba con el JSON de `docs/api/avisos.md` (string → `bigint`, los cuatro tipos) y con las rutas de las cinco llamadas (clave codificada). `services/avisos.ts`: `401` → `/login`; lecturas; escrituras con `Resultado` que nunca lanza al cliente.
4. Menú: «Avisos» en `entradas.ts`; contador en el layout con `cache` y `<Suspense>`; número en el menú lateral y en la hoja «Más»; punto en la pestaña «Más». `/avisos` en `RUTAS_AFECTADAS`, `SOLO_RECURRENTES`, `RUTAS_DEUDAS` y `RUTAS_INVERSIONES`.
5. Ruta de solo lectura: `page.tsx`, `loading.tsx`, `error.tsx`. `IconoAviso`, `EstadoVacio` con acción opcional, `ListaAvisos` y `FilaAviso` sin acciones ni alternar, `AntelacionAvisos` sin guardar y `Casilla`. Distribución en xl, entre 768 y 1279 px y en móvil, con `?antelacion=1`. Al terminar, la pantalla se ve con datos reales.
6. Alternar leído y «Marcar todo» con `marcar` y `leerTodos` en `acciones.ts`, optimistas, con vuelta atrás y `AVISO_NO_ENCONTRADO`.
7. Antelación con `configurar` en `acciones.ts`: casilla y opciones, optimistas, con vuelta atrás.
8. Acciones de la fila: `confirmar` en `acciones.ts`; «Confirmar», «Ajustar» con el campo en línea y su validación; enlaces «Registrar abono» y «Registrar precio».
9. `/estilos`: fila no leída, leída, con cada acción y con el ajuste abierto; lista con grupos y vacía; antelación con un tipo inactivo; casilla; contador del menú; en claro y oscuro.
10. `DESIGN.md`: lista de avisos, fila de aviso, antelación por tipo, casilla y contador del menú.

## Criterios de aceptación

Datos de prueba: los del diseño sin los avisos de tarjeta (`Avisos.dc.html`: Gas Vanti, Internet Claro hogar, Gimnasio, Mamá, Camila) con `fechaHoy` 2026-11-11, zona `America/Bogota` y deuda con antelación de 3 días. Gas Vanti e Internet sin leer; los demás, leídos.

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] «Avisos» está habilitado y activo en el menú lateral y en la hoja «Más», y lleva a `/avisos`. El menú lateral muestra «2» junto a «Avisos».
- [ ] En 390 px, la pestaña «Más» lleva un punto y la hoja muestra «2» junto a «Avisos». Con 0 sin leer no hay punto ni número.
- [ ] La cabecera dice «2 sin leer» y «Marcar todo como leído» está habilitado.
- [ ] Los grupos son «Hoy», «Esta semana» y «Antes», en ese orden; «Ayer» no sale.
- [ ] Gas Vanti dice «Gas Vanti vence en 3 días», «Vence el 14 nov, desde Nequi. Importe estimado: ajústalo cuando llegue el recibo.», «≈ −32.400» en terracota, «08:00» y «Ajustar», con punto y título en 600.
- [ ] Internet Claro hogar dice «−89.900», «lun 9 nov» y «Confirmar».
- [ ] Gimnasio dice «Se confirmó el 8 nov desde Bancolombia.», sin acción, sin punto y con el título en secundario.
- [ ] Mamá dice «Abono a Mamá en 3 días», «Abonaste 100.000 el 6 nov desde Nequi. Quedan 500.000.» y «−100.000» en terracota, sin acción.
- [ ] Camila dice «Camila: hoy es la fecha acordada», «Te debe 500.000. El próximo recordatorio es el 14 nov.», «500.000» en tinta y «Registrar abono», que abre el panel de abono de Camila en `/deudas`.
- [ ] Tocar Gas Vanti lo deja leído al instante y la cabecera dice «1 sin leer». Tras recargar sigue leído y el menú dice «1».
- [ ] Tocar Gimnasio (resuelto) lo deja no leído con punto. Tras recargar sigue así.
- [ ] Tocar «Registrar abono» en Camila navega sin alternar su leído.
- [ ] «Marcar todo como leído» deja todos sin punto, la cabecera en «Todo leído», el botón deshabilitado y el menú sin número.
- [ ] Con la API apagada después de cargar, tocar una fila la devuelve a su estado y muestra «No pudimos conectar. Intenta de nuevo.».
- [ ] «Confirmar» en Internet deja el aviso con «Se confirmó el 11 nov desde Bancolombia.», sin acción, y el movimiento aparece en `/movimientos`.
- [ ] «Ajustar» en Gas Vanti abre el campo con 32.400. Escribir 35.000 cambia el botón a «Confirmar 35.000». Confirmar deja «−35.000» sin «≈». Un monto vacío muestra «Escribe un valor en pesos, sin decimales.» y no se envía.
- [ ] Confirmar una ocurrencia ya confirmada en otra pestaña muestra el `mensaje` de `OCURRENCIA_CERRADA` y la página se refresca con el aviso resuelto.
- [ ] Un aviso de precio manual dice «{símbolo} lleva 7 días sin precio» y «Registrar precio» abre el bloque de precio de ese activo en `/inversiones`.
- [ ] En 1440 px, la antelación está a la derecha con «Avisos a las 08:00» y los cuatro tipos: «Recurrentes por confirmar» con «3 días antes» elegido, «Cobros pendientes» con «Cada mes», «Lo que debes» con «3 días antes» y «Precio manual sin actualizar» inactivo, con sus chips en terciario.
- [ ] Desmarcar «Recurrentes por confirmar» quita al instante su casilla; tras responder, Gas Vanti, Internet y Gimnasio desaparecen de la lista y el contador baja. Marcarla los devuelve.
- [ ] Elegir «14 días» en «Precio manual sin actualizar» lo activa y marca esa opción. Tras recargar sigue así.
- [ ] En 1024 px, la lista ocupa el ancho y la cabecera tiene «Configurar», que abre `?antelacion=1`.
- [ ] En 390 px, las filas muestran el detalle corto sin icono. «Configurar» abre «Antelación por tipo» con «Los avisos llegan a las 08:00, hora de Colombia.» y «‹ Avisos» vuelve. Sin scroll horizontal.
- [ ] Sin avisos se ve «Sin avisos.» con su explicación, «Todo leído» y el botón deshabilitado. La antelación sigue a la vista (xl) o tras «Configurar».
- [ ] Con la API apagada, `/avisos` muestra «No pudimos cargar tus avisos.» y «Reintentar», y el resto de pantallas carga sin número en el menú.
- [ ] Registrar un abono a Camila desde `/deudas` deja su aviso resuelto en `/avisos` sin recargar a mano.
- [ ] `/estilos` muestra lista, filas, ajuste, antelación, casilla, vacío y contador en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`.
- [ ] La web no calcula leído, resuelto, montos, capital ni qué avisos existen: salen de `AvisosDto`. Solo arma frases, plazo, grupo y momento, y el estado optimista.

## Decisiones

- **Sí:** «Confirmar» y «Ajustar» confirman en la fila con `POST /recurrentes/:id/confirmar`. **No:** navegar a `/recurrentes`, que no puede señalar la ocurrencia. Tocar el botón es la intervención del usuario que pide RN-10.
- **Sí:** sin «Deshacer» tras confirmar desde un aviso; el aviso pasa a resuelto y el movimiento se corrige en `/movimientos`. **No:** el aviso de 5 s de la bandeja.
- **Sí:** «Registrar abono» y «Registrar precio» navegan a los paneles por URL que ya existen. **No:** paneles nuevos en `/avisos`. Al cerrarlos se queda en su pantalla.
- **Sí:** la fila es un `<button>` que alterna leído y la acción es un hermano fuera de él. **No:** botón dentro de botón. **No:** que solo el punto alterne. **No:** que abrir la acción marque leído: resolver ya lo deja leído (N-26).
- **Sí:** estado optimista con `useOptimistic` en leído, «Marcar todo» y antelación, con vuelta atrás y mensaje. **No:** esperar a la API, que hace lento un toque frecuente.
- **Sí:** contador en el menú lateral, en la hoja «Más» y como punto sobre la pestaña «Más». **No:** solo en la hoja, que en móvil no se ve sin abrirla.
- **Sí:** contador leído en el layout con `cache` y `<Suspense>`, refrescado por la revalidación de las acciones. **No:** un componente cliente que lo pida en cada navegación. **No:** sondeo.
- **Sí:** `/avisos` en las rutas que revalidan recurrentes, deudas, inversiones, captura y movimientos: todas cambian fuentes de avisos.
- **Sí:** lista y antelación lado a lado desde 1280 px. Por debajo, «Configurar» y `?antelacion=1`. **No:** desde 1024 px, que deja la lista en ~220 px.
- **Sí:** `?antelacion=1` en la misma página, como `?prestamo=` y `?inversion=`. **No:** ruta anidada `/avisos/antelacion`.
- **Sí:** «Esta semana» son los avisos de 2 a 6 días atrás, como el diseño (jue 5 nov con hoy mié 11 nov). **No:** la semana de calendario.
- **Sí:** deuda con `−` en `salida-texto`, como dice el contrato («deuda sale»). **No:** el «100.000» en tinta del diseño.
- **Sí:** recurrente de ingreso con «llega» en título y detalle. **No:** «vence» en un ingreso.
- **Sí:** títulos y detalles derivados de los ejemplos del diseño y revisados por el autor en este spec. Los casos no dibujados (omitido, condonación, deuda pendiente, precio manual, cobro repetido) siguen la misma forma.
- **Sí:** detalle de un recurrente variable pendiente con «Importe estimado». **No:** «Estimado con el recibo anterior», que afirma de dónde sale el importe sin que el contrato lo diga.
- **Sí:** «hora de Colombia» con `Intl` (`longGeneric`) a partir de la zona del perfil. **No:** «hora de Bogotá» fija (choque con REGLAS §6 del inventario).
- **Sí:** opciones con `ChipCategoria` «como opción». **No:** botones de 32 px del diseño, fuera del sistema.
- **Sí:** tipo inactivo con prefijo y chips en `terciario`. **No:** la opacidad de 0,4 del diseño, que no es token.
- **Sí:** `Casilla` nueva, porque el sistema no tiene casilla de verificación. **No:** `OpcionUnica`, que es de elección exclusiva.
- **Sí:** «Marcar todo» deshabilitado con 0 sin leer. **No:** solo atenuado y clicable.
- **Sí:** vacío con `EstadoVacio` sin acción, por eso su acción pasa a opcional. **No:** distinguir «todos los tipos apagados».
- **Sí:** `AVISO_NO_ENCONTRADO`, `OCURRENCIA_CERRADA` y `OCURRENCIA_INVALIDA` refrescan la página: el estado cambió en otro lado.
- **Sí:** botones de 48 px y 32 px entre bloques. **No:** los 44 px y los 14 px del diseño.
- **Sí:** textos relativos con `fechaHoy` y `zonaHoraria` de la respuesta, nunca `new Date()`.
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El contador no se refresca tras una acción en otra pantalla | Toda acción revalida rutas; la respuesta de una server action que revalida trae el layout de nuevo. Se verifica en el paso 4 con un abono en `/deudas`; si no basta, la acción llama a `router.refresh()`. |
| El contador queda viejo si pasan las 08:00 sin acciones ni recarga | Aceptado: llega con la siguiente acción o carga completa. El sondeo va en otro spec si hace falta. |
| `GET /avisos/conteo` en cada pantalla suma una lectura | Va en `<Suspense>`: el menú no espera. La API no llama a proveedores externos (Tino-API SPEC 12). |
| Doble toque en una fila: dos `PATCH` cruzados | Cada toque envía el valor final de la fila (no «alternar»), y la revalidación deja el estado de la API. |
| Doble toque en «Confirmar» | El botón se deshabilita mientras la acción está en curso. Si ya se cerró, `OCURRENCIA_CERRADA` refresca. |
| Cambiar la antelación cambia las claves: los avisos vuelven sin leer | Documentado en el contrato. La lista se revalida tras el `PATCH`. |
| `Intl` sin el nombre de la zona en el entorno | `zonaLegible` devuelve la zona IANA tal cual. |
| Optimista y revalidación se pisan | `useOptimistic` se descarta al terminar la transición; manda el dato revalidado. |

## Lo que **no** entra en este spec

- Avisos de la tarjeta de crédito y Metas.
- Push, correo y hora de aviso editable.
- «Deshacer» tras confirmar desde un aviso.
- Volver a `/avisos` desde el panel de abono o el bloque de precio.
- Sondeo o tiempo real del contador.
- Resaltar la ocurrencia en `/recurrentes`.

Cada uno, si llega, va en su propio spec.
