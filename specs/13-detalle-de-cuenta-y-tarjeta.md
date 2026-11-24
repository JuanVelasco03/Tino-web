# SPEC 13 — Detalle de cuenta y tarjeta con ciclo

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 07, SPEC 10, Tino-API SPEC 14
> **Fecha:** 2026-11-24
> **Objetivo:** Que cada cuenta de efectivo, banco o tarjeta tenga su pantalla en `/cuentas/[id]` (historial con saldo corrido, conciliación y ajuste de saldo; o ciclo de la tarjeta con «¿Puedo comprar esto?», condiciones y «Registrar pago»), con las condiciones de la tarjeta en el panel de cuenta y los ajustes visibles y editables en `/movimientos`.

## Por qué existe este spec

La API (SPEC 14) da el detalle de una cuenta y el ciclo de la tarjeta, y vuelve obligatorias las condiciones al crear una tarjeta. Sin este spec el alta de tarjeta de la web responde `400 CONDICIONES_REQUERIDAS` y `/movimientos` recibe un tipo (`ajuste`) que no conoce. Por eso va en un solo spec, aunque toca cinco áreas (decisión del autor).

Fija estos patrones:

- **Una ruta por cuenta.** `/cuentas/[id]` pide `GET /cuentas/:id` y pinta el historial (efectivo, banco) o el ciclo (tarjeta). La inversión sigue en `/inversiones`.
- **La fila de Cuentas abre el detalle.** Editar pasa al detalle («Editar cuenta» → `?editar=1`, el mismo `PanelCuenta`).
- **Conciliar es optimista solo en el estado de la fila.** El ícono cambia al instante; saldo conciliado y pendientes salen de la API al revalidar.
- **La captura se abre prellenada.** `abrir(iniciales?)` del proveedor de captura, usado por «Registrar pago».
- **La web no calcula cifras.** Saldo corrido, conciliado, diferencia del ajuste, ciclo, compra y tasa E.A. llegan de la API. La web solo suma los `efecto` de la selección (N-23) y resta `saldoReal − saldoHoy` para la vista previa del ajuste (N-28), como manda el contrato; la API fija la diferencia al registrar.

Diseño: `referencias/export-detalle-cuenta/` (`Detalle Cuenta.dc.html`: escritorio claro y oscuro con historial, conciliar en lote y ajustar saldo; móvil con historial y ajuste; `Detalle Cuenta Lienzo.dc.html`) y `referencias/export-tarjeta/` (`Tarjeta Credito.dc.html`: escritorio y móvil, claro y oscuro; `Tarjeta Credito Lienzo.dc.html`). No están dibujados: rango libre, cuenta archivada, rango vacío, cuenta nunca conciliada, tarjeta sin condiciones, condiciones en el panel de cuenta, «Registrar pago» abierto ni el ajuste en `/movimientos`.
Inventario: `../Tino-API/specs/necesidades/detalle-cuenta.md`.
Contrato: `../Tino-API/specs/14-detalle-cuenta-tarjeta.md` y `../Tino-API/docs/api/cuentas.md`, `movimientos.md`.

## Alcance

**Entra:**

- Ruta `/cuentas/[id]` con carga y error. Préstamo, cuenta ajena o inexistente (`404 CUENTA_NO_ENCONTRADA`) → `notFound()`. Inversión → `redirect` a `/inversiones?inversion=<id>`.
- **Detalle de cuenta** (efectivo y banco): cabecera, cifras (saldo actual, conciliado, entradas, salidas), atajos de rango y rango libre, historial con saldo corrido, conciliar uno a uno y en lote, saldo al inicio del rango, panel «Ajustar saldo» (`?ajuste=1`).
- **Tarjeta**: cabecera con «Registrar pago», cupo, deuda, disponible y barra, «¿Puedo comprar esto?», línea del ciclo, ciclo en curso (saldo al corte anterior, abonos, saldo anterior pendiente, consumos, cargos, deuda al corte), condiciones. Sin condiciones: invitación a completarlas.
- **Editar cuenta** desde el detalle (`?editar=1`) con el `PanelCuenta` existente.
- **Condiciones de la tarjeta** en `PanelCuenta` (alta y edición): día de corte, día de pago, tasa M.V., cuota de manejo, cuenta de pago.
- **Archivadas:** en `/cuentas/archivadas` el nombre enlaza al detalle, que se ve en solo lectura.
- **Captura prellenada:** `abrir(iniciales?)` en `ProveedorCaptura`; «Registrar pago» abre una transferencia de la cuenta de pago a la tarjeta por `pagoSugerido`.
- **Ajustes en `/movimientos`:** el libro los muestra, la edición cambia monto, fecha, cuenta, descripción y nota, y se borran como cualquier movimiento. Captura y filtros no ofrecen el tipo.
- `TipoMovimiento` suma `"ajuste"` en `repositories/api/movimientos.ts` y `domain/movimiento/cuerpo.ts`.
- Revalidación de las rutas nuevas.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `CabeceraCuenta`, `CifrasCuenta`, `RangoHistorial`, `TablaHistorial`, `BarraSeleccion`, `PanelAjuste`, `ResumenTarjeta`, `ConsultaCompra`, `LineaCiclo`, `CicloTarjeta`, `CondicionesTarjeta` y `CamposTarjeta`.

**Fuera de alcance (specs futuros):**

- Aviso de corte de la tarjeta, historial conciliable de la tarjeta, ajuste en tarjeta o inversión, cargos automáticos, extractos pasados (fuera también en la API).
- Línea «Ajustes» en el resumen del mes: la API solo los excluye.
- Consultar el historial de cambios de un movimiento o de la tarjeta.
- Seleccionar o conciliar filas fuera del rango visible.
- Editar un movimiento desde el historial (se edita en `/movimientos`).
- Deshacer una conciliación con aviso temporal.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume `GET /cuentas/:id`, `GET /cuentas/:id/historial`, `PUT /cuentas/:id/conciliacion`, `POST /cuentas/:id/ajustes`, `GET /cuentas/:id/ciclo`, los cambios de `POST` y `PATCH /cuentas` y de `PUT /movimientos/:id`, y `POST /movimientos` (pago).

### Contrato (copiado de Tino-API, no se redefine)

- `src/repositories/api/cuentas.ts`: `CuentaDto.tarjeta` pasa a `TarjetaDto`; `CondicionesTarjeta` en `CuentaCuerpo` y `CuentaCambio` (`tarjeta?`). Nuevos `obtenerCuenta(id)` y `Ref`.
- `src/repositories/api/detalle-cuenta.ts` (nuevo): `FilaHistorialDto`, `HistorialDto`, `FilaCicloDto`, `CicloDto` y las llamadas `obtenerHistorial(id, { desde?, hasta? })`, `conciliar(id, cuerpo)`, `registrarAjuste(id, cuerpo)`, `obtenerCiclo(id, compra?)`, tomados de Tino-API SPEC 14 «Contrato HTTP».
- Montos `string` en el borde y `bigint` desde el repositorio hacia dentro (`efecto` y `saldo` de fila y `saldoAnteriorPendiente` con signo). `tasaMensual`, `tasaEfectivaAnual`, `porcentajeUsado`, `porcentajeTras`, `dias*` y `pendientes` son `number`.

### Modelo de la web

```ts
type Ref = { id: string; nombre: string };

type Tarjeta = {
  cupo: bigint; disponible: bigint; porcentajeUsado: number;
  diaCorte: number | null; diaPago: number | null;
  tasaMensual: number | null; tasaEfectivaAnual: number | null;
  cuotaManejo: bigint | null; cuentaPago: Ref | null;
};
// Cuenta (SPEC 03) cambia `tarjeta` a `Tarjeta | null`.

type FilaHistorial = {
  movimientoId: string; tipo: "gasto" | "ingreso" | "transferencia" | "ajuste";
  fecha: string; descripcion: string | null;
  efecto: bigint; saldo: bigint; conciliado: boolean;
  categoria: Ref | null; partes: { categoria: Ref; monto: bigint }[];
  contraparte: (Ref & { sentido: "desde" | "hacia" }) | null;
};

type Historial = {
  fechaHoy: string; desde: string; hasta: string | null;
  saldo: bigint; saldoHoy: bigint;
  conciliacion: { saldo: bigint | null; al: string | null; pendientes: number };
  entradas: bigint; salidas: bigint; saldoInicioRango: bigint;
  filas: FilaHistorial[];
};

type FilaCiclo = {
  movimientoId: string; tipo: "gasto" | "ingreso" | "transferencia";
  fecha: string; descripcion: string | null; monto: bigint;
  categoria: Ref | null; partes: { categoria: Ref; monto: bigint }[]; contraparte: Ref | null;
};

type Ciclo = {
  inicio: string; corte: string; pagoLimite: string;
  diasHastaCorte: number; diasHastaPago: number;
  corteAnterior: { fecha: string; saldo: bigint };
  abonos: FilaCiclo[]; saldoAnteriorPendiente: bigint; pagoSugerido: bigint;
  consumos: FilaCiclo[]; totalConsumos: bigint;
  cargos: (FilaCiclo & { clase: "intereses" | "cuota_manejo" })[]; totalCargos: bigint;
  deudaAlCorte: bigint;
};

type Compra = { monto: bigint; cabe: boolean; disponibleTras: bigint | null; porcentajeTras: number | null; falta: bigint | null };

type CicloTarjeta = { fechaHoy: string; ciclo: Ciclo | null; compra: Compra | null };

// Captura (SPEC 05)
type InicialesCaptura = {
  tipo: "transferencia"; cuentaOrigenId: string | null; cuentaDestinoId: string; monto: bigint | null;
};
```

### Dominio

```ts
// src/domain/cuenta/detalle.ts
type Atajo = "30d" | "mes" | "anterior";
rangoDeAtajo(atajo: Atajo, fechaHoy: string): { desde?: string; hasta?: string };
// "30d" → {} · "mes" → { desde: día 1 del mes } · "anterior" → { desde: día 1, hasta: último día del mes anterior }
atajoActivo(desde: string | undefined, hasta: string | undefined, fechaHoy: string): Atajo | null;
textoRango(h: Historial): string;                // formatearRango(desde, hasta ?? fechaHoy) → "12 oct – 11 nov 2026"
textoSaldoInicio(desde: string): string;         // "Saldo al {desde − 1 día}" → "Saldo al 11 oct"
textoConciliado(c: Historial["conciliacion"], formato: "largo" | "corto"): string;  // ver «Conciliado»
etiquetaFila(f: FilaHistorial): string;          // ver «Historial»
montoConSigno(n: bigint): string;                // "+100.000" · "−15.000" · "0"
sumaSeleccion(filas: readonly FilaHistorial[], ids: ReadonlySet<string>): bigint;   // Σ efecto (N-23)
pendientesDelRango(filas: readonly FilaHistorial[]): string[];                      // ids con conciliado: false
diferenciaPrevia(saldoReal: bigint, saldoHoy: bigint): bigint;                      // vista previa (N-28)
validarRango(desde: string, hasta: string): string | null;                          // hasta < desde → mensaje
validarSaldoReal(texto: string): { valor: bigint } | { error: string };

// src/domain/cuenta/tarjeta.ts
textoTasa(mensual: number | null, efectivaAnual: number | null): string;  // 198, 2652 → "1,98 % M.V. · 26,52 % E.A." · null → "Sin definir"
textoDia(dia: number | null): string;            // 15 → "15 de cada mes" · null → "Sin definir"
textoDiasHasta(dias: number): string;            // 0 → "hoy" · 1 → "mañana" · 4 → "en 4 días"
textoLineaCiclo(c: Ciclo, fechaHoy: string): string;   // "16 oct – 15 nov · pago hasta 30 nov"
posicionHoy(c: Ciclo, fechaHoy: string): number; // 0 a 100, días transcurridos del ciclo; solo presentación
detalleCargo(f: Ciclo["cargos"][number], c: Ciclo): string;  // cuota_manejo → "Cargo fijo" · intereses → "Sobre {597.980}"
etiquetaAbono(f: FilaCiclo): string;             // transferencia → "Pago desde {Bancolombia}" · otra → descripción o categoría
textoCompra(c: Compra, ciclo: Ciclo | null, disponibleHoy: bigint): { titulo: string; detalle: string };  // ver «Compra»

// src/domain/cuenta/edicion.ts (crece)
type ValoresTarjeta = { diaCorte: string; diaPago: string; tasa: string; cuotaManejo: string; cuentaPagoId: string | null };
valoresTarjetaDesde(t: Tarjeta | null): ValoresTarjeta;
tasaACentesimas(texto: string): number | null;   // "1,98" → 198 · "2" → 200 · "" → null · más de 2 decimales o > 100 → error
validarTarjeta(v: ValoresTarjeta, requerida: boolean): { condiciones: CondicionesTarjeta } | { errores: Partial<Record<CampoTarjeta, string>> };
cambiosTarjeta(original: Tarjeta | null, v: ValoresTarjeta): CondicionesTarjeta | null;  // solo lo que cambió; "" en opcional → null
type CampoTarjeta = "diaCorte" | "diaPago" | "tasaMensual" | "cuotaManejo" | "cuentaPagoId";
```

Todo texto relativo usa `fechaHoy` de la respuesta, nunca `new Date()`. Fechas con `formatearFechaSinAnio` si son del año de `fechaHoy` y con `formatearFecha` si no. Montos con `formatearDinero` y `montoConSigno`. Ninguna función suma saldos ni recalcula el ciclo: `sumaSeleccion` y `diferenciaPrevia` son las dos excepciones que el contrato asigna al cliente.

### Conciliado

| Caso | Largo (escritorio) | Corto (móvil) |
|---|---|---|
| Con saldo y pendientes | «al {31 oct} · {9} sin conciliar» | «Conciliado {148.100} · al {31 oct} · {9} sin conciliar» |
| Con saldo, sin pendientes | «al {31 oct} · todo conciliado» | «Conciliado {148.100} · al {31 oct} · todo conciliado» |
| `saldo: null` | «{16} sin conciliar», cifra «—» | «Conciliado — · {16} sin conciliar» |
| Sin movimientos | «Sin movimientos», cifra «—» | igual |

1 pendiente: «1 sin conciliar».

### Historial

`etiquetaFila` (columna «Categoría»):

| Fila | Etiqueta |
|---|---|
| Gasto o ingreso con categoría | nombre de la categoría |
| Gasto o ingreso con partes | «Dividido»; las partes en `SubRenglones` |
| Sin clasificar | «Sin clasificar» |
| Transferencia, `sentido: "desde"` | «Desde {Bancolombia}» |
| Transferencia, `sentido: "hacia"` | «Hacia {Préstamo Juan}» |
| Ajuste | «Ajuste» |

- Concepto: `descripcion`; si es `null`, la etiqueta.
- Efecto con `montoConSigno`, en `entrada-texto` si es positivo y `salida-texto` si es negativo. Saldo corrido en tinta, con «−» si es negativo.
- Una fila con fecha posterior a `fechaHoy` lleva la fecha en `marca-texto` y el rótulo «Programado» bajo la fecha (N-39).

### Compra

`textoCompra`, con `formatearDinero`:

| Caso | Título | Detalle |
|---|---|---|
| Sin valor (`compra: null`) | «Escribe el valor y te digo si cabe.» | «Se compara con el cupo disponible de hoy.» |
| Cabe, con ciclo | «Sí, cabe en el cupo.» | «Te quedarían {2.265.700} disponibles (uso {43} %). Entra al corte del {15 nov} y se paga hasta el {30 nov}.» |
| Cabe, sin ciclo | «Sí, cabe en el cupo.» | «Te quedarían {2.265.700} disponibles (uso {43} %).» |
| No cabe | «No cabe en el cupo.» | «Faltan {284.300}. Hoy tienes {2.715.700} disponibles.» |

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6). Colores del diseño mapeados a tokens: `--in` → `entrada-texto`, `--out` → `salida-texto`, `--br` → `marca-texto`, `--sk` → `hundido`, `--ln` → `linea`, `--lf` → `raya`.

**Detalle de cuenta, escritorio:**

```
Cuentas › Activos   etiqueta secundaria (enlace «Cuentas» a /cuentas)
[icono] Efectivo  titulo-1                              [Ajustar saldo] secundario   Editar cuenta (EnlaceTexto)
        Efectivo · billetera · activo   etiqueta secundaria
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SALDO ACTUAL        CONCILIADO                         │ EN EL RANGO   Entradas  +100.000
45.000  cifra-l     148.100  cifra-m                   │               Salidas   −177.200
                    al 31 oct · 9 sin conciliar        │
[Últimos 30 días] [Noviembre] [Octubre]   [📅 12 oct – 11 nov 2026]            Seleccionar pendientes
┌ barra de selección (solo con selección) ─────────────────────────────────────────────────────────────┐
│ [−] 3 seleccionados · −29.000                         [✓ Marcar como conciliados]  Cancelar         │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
[ ]  FECHA   CONCEPTO              CATEGORÍA           MOVIMIENTO      SALDO     CONC.
[ ]  11 nov  Almuerzo              Comida                 −15.000     45.000      ○
[ ]  28 oct  Retiro cajero         Desde Bancolombia     +100.000    194.200      ✓
…
                                                         Saldo al 11 oct   122.200
```

- **Distribución:** ancho del contenido de la aplicación; bloques separados 32 px.
- **Cabecera** (`CabeceraCuenta`): miga «Cuentas › Activos» («Pasivos» en la tarjeta) con `naturaleza`; `IconoCuenta` de 22 px, nombre en titulo-1 y «{Tipo} · {detalle} · {activo|pasivo}» en `etiqueta` secundaria (sin detalle: «Efectivo · activo»). A la derecha, la acción principal de la cuenta y «Editar cuenta» (`EnlaceTexto` a `?editar=1`, `scroll: false`). Raya fuerte abajo. En una archivada: rótulo «Archivada» junto al nombre, sin acciones.
- **Cifras** (`CifrasCuenta`): «Saldo actual» (`saldo`, cifra-l) y «Conciliado» (`conciliacion.saldo`, cifra-m, con `textoConciliado` largo en `etiqueta` secundaria). Separada por raya vertical, «En el rango» con «Entradas» (`montoConSigno(entradas)`, `entrada-texto`) y «Salidas» (`montoConSigno(−salidas)`, `salida-texto`), cifra-s.
- **Rango** (`RangoHistorial`): tres fichas «Últimos 30 días», «{Noviembre}» y «{Octubre}» (`formatearNombreMes` del mes de `fechaHoy` y del anterior), enlaces a la URL de `rangoDeAtajo`; la activa con borde `texto` y peso 600. Después, el botón del rango con ícono de calendario y `textoRango`: despliega en línea «Desde» y «Hasta · opcional» (`input type="date"`) y «Aplicar», que navega a `?desde=&hasta=` (sin `hasta` si está vacío). `validarRango` muestra su error bajo «Hasta» sin navegar; `RANGO_INVALIDO` o `FECHA_INVALIDA` de la API, igual. «Seleccionar pendientes» (`EnlaceTexto`) a la derecha selecciona `pendientesDelRango`; sin pendientes no aparece.
- **Barra de selección** (`BarraSeleccion`, solo con selección): fondo `hundido`, casilla «−» que limpia, «{3} seleccionados · {−29.000}» (`sumaSeleccion`, cifra-s), botón primario «Marcar como conciliados» con ícono ✓ y «Cancelar». «1 seleccionado» en singular.
- **Tabla** (`TablaHistorial`): rejilla `44px | 64px | minmax(0,1fr) | 170px | 130px | 130px | 64px` con «Fecha», «Concepto», «Categoría», «Movimiento», «Saldo» y «Conc.» en `rotulo` secundario sobre raya fuerte. Casilla de selección por fila (`Casilla` sin rótulo visible, etiqueta «Seleccionar {concepto}»). Fecha en cifra-xs secundaria, concepto en cuerpo, categoría en `etiqueta` secundaria, movimiento en cifra-s con color de signo, saldo en cifra-s, y el botón de estado de 44 px: ✓ en `entrada-texto` (etiqueta «Conciliado. Tocar para desmarcar») u ○ en `terciario` («Pendiente. Tocar para conciliar»). Fila seleccionada con fondo `hundido`. Renglón entre filas. Con partes, `SubRenglones` bajo el concepto.
- **Pie:** `textoSaldoInicio(desde)` en `etiqueta` secundaria y `saldoInicioRango` en cifra-s, a la derecha.
- **Rango vacío** (`filas: []`): «Sin movimientos en este rango.» en `etiqueta` secundaria en lugar de las filas; el pie sigue (N-37).
- **Archivada:** sin casillas, sin «Seleccionar pendientes», el estado es un ícono fijo (no botón) y no hay «Ajustar saldo».

**Detalle de cuenta, móvil (390 px):**

- «‹ Cuentas» (enlace a `/cuentas`) y, a la derecha, «Seleccionar» / «Listo» (alterna el modo selección).
- `IconoCuenta` y nombre en titulo-2; `saldo` en cifra-l y botón «Ajustar» (secundario, 44 px) a la derecha; `textoConciliado` corto en `etiqueta` secundaria.
- Los tres atajos en fichas con desplazamiento horizontal. Sin entradas, salidas ni rango libre.
- Tabla `24px | minmax(0,1fr) | 76px | 76px` con «Concepto», «Mov.» y «Saldo»: el primer hueco es el ícono de estado (toque concilia o desconcilia) o, en modo selección, la casilla. Concepto en cuerpo y «{11 nov} · {Comida}» debajo en `etiqueta` secundaria.
- Pie con el saldo al inicio.
- Con selección, barra fija abajo sobre las pestañas: «{3} seleccionados · {−29.000}» y «Marcar como conciliados».
- `?ajuste=1` abre el panel como hoja inferior.

**Panel «Ajustar saldo»** (`PanelAjuste`, `PanelLateral`; móvil, hoja inferior):

```
AJUSTAR SALDO                                              Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cuenta lo que tienes en {la billetera | la cuenta} y escribe el total.
TINO registra la diferencia como un movimiento aparte.        etiqueta secundaria
Saldo en TINO          45.000                                 cifra-m (saldoHoy)
Saldo real contado     41.500                       COP       CampoMonto
Diferencia             −3.500                                 cifra-m, color de signo
Se registrará  11 nov · Ajuste de saldo · −3.500              etiqueta
No cuenta como ingreso ni gasto en el resumen.                etiqueta secundaria
[✓] Marcar todo como conciliado hasta hoy                     Casilla, marcada por defecto
──────────────────────────────────────────────────────────────── pie fijo
[ Registrar ajuste ]   Cancelar
```

- «la billetera» en efectivo, «la cuenta» en banco.
- «Saldo en TINO» es `saldoHoy` (sin futuros, N-25). Si `saldo ≠ saldoHoy`, debajo va «Sin los movimientos programados.» en `etiqueta` secundaria.
- La diferencia es `diferenciaPrevia` (vacío → «0» en secundario). «Registrar ajuste» deshabilitado si el campo está vacío, mal escrito o la diferencia es 0 (N-31).
- `validarSaldoReal`: entero ≥ 0 sin decimales; si no, «Escribe un valor en pesos, sin decimales.» bajo el campo (N-27).
- Envía `POST /cuentas/:id/ajustes` con `{ saldoReal, conciliarHastaHoy }`. Mientras corre, «Registrando…». Al responder, cierra hacia `/cuentas/<id>` conservando el rango.
- Errores: `MONTO_INVALIDO` y `SIN_DIFERENCIA` bajo el campo; `CUENTA_ARCHIVADA` y sin campo, `MensajeError` al pie y refresca.
- Cerrar con valor escrito: «¿Descartar los cambios?».

**Tarjeta, escritorio:**

```
Cuentas › Pasivos
[icono] Tarjeta de crédito  titulo-1                         [Registrar pago] primario   Editar cuenta
        Visa ·· 7731 · pasivo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUPO TOTAL 4.000.000   DEUDA ACTUAL −1.284.300   DISPONIBLE HOY 2.715.700   │ ¿PUEDO COMPRAR ESTO?
▬▬▬▬▬▬▬▬▬╍╍╍╍─────────────────────────────── 8 px                           │ [ 450.000        COP ]
Usado 32 %                          Con esta compra: 43 %                   │ ✓ Sí, cabe en el cupo.
                                                                            │   Te quedarían 2.265.700 …
CICLO DE FACTURACIÓN   16 oct – 15 nov · pago hasta 30 nov
Inicio 16 oct ──────────────────●──── Corte 15 nov · en 4 días    Pago límite 30 nov · en 19 días
                               Hoy 11 nov
┌──────────── ciclo en curso (1.4fr) ─────────────────────────┐   ┌──── condiciones (1fr) ────┐
CICLO EN CURSO                                  11 consumos       CONDICIONES
FECHA  CONCEPTO                  CATEGORÍA      CARGO   ABONO     Cupo              4.000.000
15 oct Saldo al corte anterior               1.217.980            Tasa de interés   1,98 % M.V. · 26,52 % E.A.
28 oct Pago desde Bancolombia    Transferencia            620.000 Cuota de manejo   26.990 al mes
                                Saldo anterior pendiente  597.980 Día de corte      15 de cada mes
CONSUMOS DEL PERÍODO                                              Día límite de pago 30 de cada mes
17 oct Rappi · restaurante       Salidas                   46.900 Se paga desde     Bancolombia
…                                       Subtotal consumos 651.450
CARGOS DEL BANCO · no son consumos
16 oct Cuota de manejo           Cargo fijo                26.990
16 oct Intereses corrientes …    Sobre 597.980              7.880
                                         Subtotal cargos   34.870
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                            Deuda actual 1.284.300
└──────────────────────────────────────────────────────────────┘   └────────────────────────────┘
```

- **Resumen** (`ResumenTarjeta`): «Cupo total» (`tarjeta.cupo`), «Deuda actual» (`−saldo`, `salida-texto`), «Disponible hoy» (`tarjeta.disponible`) en cifra-m; barra de 8 px con relleno `texto` al `porcentajeUsado` y, con una compra que cabe, un tramo punteado `salida-texto` hasta `porcentajeTras`. Debajo, «Usado {32} %» y, a la derecha, «Disponible {68} %» o «Con esta compra: {43} %».
- **Consulta** (`ConsultaCompra`, cliente): `CampoMonto` COP. Cada cambio, con 300 ms de espera, llama a la server action `consultarCompra(id, monto)` → `GET /cuentas/:id/ciclo?compra=` y guarda `compra`. Vacío o 0: estado «Sin valor» sin llamada. Ícono ✓ `entrada-texto` (cabe), ✕ `texto` (no cabe), ? secundario (sin valor). Una respuesta vieja que llega tarde se descarta. `MONTO_INVALIDO` → su `mensaje` bajo el campo. Error de red: «No pudimos consultar. Intenta de nuevo.».
- **Línea del ciclo** (`LineaCiclo`): «Ciclo de facturación» en `rotulo` y `textoLineaCiclo`. Barra con «Inicio {16 oct}» a la izquierda, «Corte {15 nov} · {en 4 días}» y «Pago límite {30 nov} · {en 19 días}» a la derecha, y un punto «Hoy {11 nov}» en `posicionHoy`.
- **Ciclo en curso** (`CicloTarjeta`): rejilla `64px | minmax(0,1fr) | 150px | 110px | 110px`.
  - «Ciclo en curso» con «{11} consumos» («1 consumo») a la derecha.
  - Primera fila: `corteAnterior.fecha`, «Saldo al corte anterior», cargo `corteAnterior.saldo` en secundario. Luego `abonos` con `etiquetaAbono`, categoría «Transferencia» o la suya, y el monto en «Abono». Pie del bloque: «Saldo anterior pendiente» y `saldoAnteriorPendiente` (cifra-s 600, con «−» si es negativo).
  - «Consumos del período»: `consumos` con fecha, concepto, categoría («Dividido» con partes; «Avance hacia {cuenta}» en una transferencia) y monto. Sin consumos: «Sin consumos en este ciclo.». Pie «Subtotal consumos» `totalConsumos`.
  - «Cargos del banco · no son consumos»: `cargos` con `detalleCargo` en la columna de categoría. Sin cargos: «Sin cargos en este ciclo.». Pie «Subtotal cargos» `totalCargos`.
  - Raya fuerte y «Deuda actual» `deudaAlCorte` en cifra-m.
- **Condiciones** (`CondicionesTarjeta`): «Cupo», «Tasa de interés» (`textoTasa`), «Cuota de manejo» («{26.990} al mes» o «Sin definir»), «Día de corte» y «Día límite de pago» (`textoDia`), «Se paga desde» (`cuentaPago.nombre` o «Sin definir»). Rótulo en `etiqueta` secundaria, valor a la derecha (cifras en mono), renglón entre filas.
- **Registrar pago:** botón primario en la cabecera. Llama `abrir({ tipo: "transferencia", cuentaOrigenId: cuentaPago?.id ?? null, cuentaDestinoId: <tarjeta>, monto: pagoSugerido > 0 ? pagoSugerido : null })`. Sin ciclo, `monto: null`. Se registra con la acción de la captura de siempre.
- **Sin condiciones** (`ciclo: null`, N-79): resumen y consulta igual (el detalle de «cabe» sin corte); en lugar de línea, ciclo y condiciones, `EstadoVacio` con rótulo «Ciclo», «Falta el día de corte y el de pago.», «Con ellos TINO arma el ciclo, el pago límite y lo que va en cada corte.» y acción «Completar condiciones» → `?editar=1`.
- **Archivada:** sin «Registrar pago» ni «Editar cuenta»; la consulta de compra sigue.

**Tarjeta, móvil:**

- «‹ Cuentas»; `IconoCuenta` y nombre en titulo-2.
- «Disponible hoy» en cifra-l; barra de 4 px; «Usado {32} % de {4.000.000}» y «Debes {−1.284.300}» en `etiqueta`.
- Consulta igual que escritorio.
- «Ciclo {16 oct – 15 nov}»; «Corte {15 nov} · {en 4 días}» y «Pago límite {30 nov} · {en 19 días}» en dos columnas.
- «Saldo anterior pendiente» en una fila; consumos en `48px | minmax(0,1fr) | 96px` (fecha, concepto, monto) con subtotal; cargos con el nombre corto (categoría) y monto; «Deuda actual» al pie.
- Sin condiciones ni abonos detallados; «Registrar pago» como botón a todo el ancho bajo la consulta.

**Panel de cuenta** (`PanelCuenta`, crece con `CamposTarjeta`):

```
… nombre, tipo, detalle, deuda inicial, cupo (como hoy) …
CONDICIONES DE LA TARJETA                              rotulo
Día de corte   [15]          Día límite de pago  [30]          input numérico 1–31, dos por fila
Tasa M.V. · opcional   1,98   %                                 CampoSubrayado
Cuota de manejo · opcional   26.990          COP               CampoMonto
Se paga desde · opcional  [Sin definir ✓] [🏦 Bancolombia] [💵 Efectivo] …   FichaCuenta
```

- Se despliegan al elegir «Tarjeta de crédito» en el alta (como el cupo) y siempre en la edición de una tarjeta.
- **Alta:** días obligatorios; envía `tarjeta` con los valores de `validarTarjeta(…, true)`.
- **Edición:** valores de `valoresTarjetaDesde`. Envía `tarjeta` solo con `cambiosTarjeta`; borrar un opcional manda `null`. Tarjeta sin condiciones: los días son obligatorios en el primer guardado que toque condiciones (`CONDICIONES_REQUERIDAS`); si no se toca ninguna, no se envía `tarjeta`.
- Cuentas de pago: efectivo y banco activas de `GET /cuentas`, en su orden. «Sin definir» elegida si no hay. Sin cuentas: solo «Sin definir» y la nota «Crea una cuenta de efectivo o banco para elegirla.».
- Validación previa (`validarTarjeta`): días enteros 1–31; tasa vacía o número de 0 a 100 con hasta 2 decimales (coma o punto); cuota vacía o entero ≥ 0.
- Errores de la API: `tarjeta.diaCorte`, `tarjeta.diaPago` (`DIA_INVALIDO`), `tarjeta.tasaMensual` (`TASA_INVALIDA`), `tarjeta.cuotaManejo` (`MONTO_INVALIDO`), `tarjeta.cuentaPagoId` (`CUENTA_PAGO_INVALIDA`) bajo su campo; `tarjeta` (`CONDICIONES_REQUERIDAS`, `CONDICIONES_NO_PERMITIDAS`) bajo el rótulo del bloque.
- Montado en `/cuentas` (alta, `?cuenta=nueva`, y edición de inversión, `?cuenta=<id>`, como hoy) y en `/cuentas/[id]` (`?editar=1`). En el detalle, guardar cierra hacia `/cuentas/<id>`; archivar o eliminar navega a `/cuentas`.

**Fila de Cuentas y archivadas:**

- `FilaCuenta` enlaza a `/cuentas/<id>` en efectivo, banco y tarjeta (scroll normal); la inversión sigue en `/inversiones?inversion=<id>`.
- `/cuentas?cuenta=<id>` de una cuenta no inversión redirige a `/cuentas/<id>?editar=1` (enlaces viejos).
- `ListaArchivadas`: el nombre enlaza a `/cuentas/<id>` (inversión, a `/inversiones?inversion=<id>`). El detalle de una archivada lleva «‹ Archivadas» en lugar de «‹ Cuentas» y su miga.

**Captura prellenada:**

- `ProveedorCaptura` expone `abrir(iniciales?: InicialesCaptura)`. Sin `iniciales`, igual que hoy. Con ellas, la hoja/panel abre con tipo «Transferencia», las cuentas y el monto puestos; el usuario puede cambiarlos. La fecha es hoy.
- Una cuenta de `iniciales` que no está entre las de la captura se ignora.

**Ajustes en `/movimientos`:**

- `LibroMovimientos` y `FilaMovimiento`: el ajuste muestra su descripción («Ajuste de saldo»), la categoría «Ajuste» como `ChipCategoria` neutro, la cuenta que trae y el importe con «+» y `entrada-texto` si trae `cuentaDestino`, o «−» y `salida-texto` si trae `cuentaOrigen`. No cuenta en ingresos ni gastos de la cabecera del libro.
- `EdicionMovimiento` de un ajuste: sin selector de tipo, sin categoría ni partes, con rótulo «Ajuste de saldo». Edita monto, fecha, cuenta (fichas de efectivo y banco, conservando el lado), descripción y nota. Envía `PUT /movimientos/:id` con `tipo: "ajuste"` y la categoría que trae. Errores (`MOVIMIENTO_DE_AJUSTE`, `TIPO_NO_ADMITIDO`, `CATEGORIA_NO_PERMITIDA`) con su `mensaje` bajo el campo o al pie.
- Borrar un ajuste: `BloqueEliminar` de siempre.
- `FiltrosMovimientos`: la categoría «Ajuste» sale en las opciones solo si hay ajustes en el mes (comportamiento actual de `opcionesDe`). Captura rápida: no ofrece «Ajuste» como tipo.

### Comportamiento

- **Lecturas:** `/cuentas/[id]` pide `GET /cuentas/:id` y, según tipo, `GET /cuentas/:id/historial?desde&hasta` o `GET /cuentas/:id/ciclo` (sin compra), en secuencia (el tipo decide la segunda). `?editar=1` pide además `GET /cuentas` para las cuentas de pago.
- **Parámetros:** `desde` y `hasta` se pasan tal cual; `FECHA_INVALIDA` o `RANGO_INVALIDO` al leer vuelven a `/cuentas/<id>` sin rango. `?ajuste=1` en tarjeta o archivada, y `?editar=1` en archivada, vuelven a `/cuentas/<id>`.
- **Conciliar uno:** el botón de estado envía `PUT /cuentas/:id/conciliacion` con `{ movimientoIds: [id], conciliado: !actual }`. El ícono cambia con `useOptimistic`; saldo conciliado y pendientes cambian al revalidar. Error: el ícono vuelve, `MensajeError` sobre la tabla con el `mensaje` (`CUENTA_ARCHIVADA` refresca).
- **Conciliar en lote:** «Marcar como conciliados» envía los ids seleccionados (máx. 500; más, se parte en lotes de 500 en secuencia) con `conciliado: true`. Filas marcadas al instante; la selección se limpia y sale el modo selección. Error: vuelven y se conserva la selección.
- **Selección:** solo filas del rango visible. Cambiar de rango limpia la selección. En escritorio la casilla siempre está; en móvil, solo en modo «Seleccionar».
- **Nada más es optimista.** Ajuste, condiciones y pago esperan la respuesta.
- **Revalidación:** `RUTAS_CUENTA = (id) => ["/cuentas/" + id]`. Conciliar revalida `/cuentas/<id>`. Ajuste revalida `/cuentas/<id>`, `/cuentas` y `RUTAS_AFECTADAS`. Las acciones de `cuentas/acciones.ts` revalidan además `/cuentas/[id]` como ruta (`revalidatePath("/cuentas/[id]", "page")`). `RUTAS_AFECTADAS` (captura, movimientos, recurrentes, avisos, deudas, inversiones, metas) suma `"/cuentas/[id]"` con tipo `"page"`, para que un pago o un gasto refresque el historial o el ciclo.

### Textos literales

| Caso | Texto |
|---|---|
| Miga | «Cuentas › Activos» · «Cuentas › Pasivos» · «‹ Cuentas» · «‹ Archivadas» · «Archivada» |
| Cabecera | «{Tipo} · {detalle} · activo/pasivo» · «Ajustar saldo» · «Ajustar» · «Registrar pago» · «Editar cuenta» |
| Cifras | «Saldo actual» · «Conciliado» · textos de «Conciliado» · «En el rango» · «Entradas» · «Salidas» |
| Rango | «Últimos 30 días» · «{Noviembre}» · «{Octubre}» · `textoRango` · «Desde» · «Hasta · opcional» · «Aplicar» · «Seleccionar pendientes» · «La fecha final no puede ser anterior a la inicial.» |
| Selección | «Seleccionar» · «Listo» · «{n} seleccionado(s) · {suma}» · «Marcar como conciliados» · «Cancelar» |
| Tabla | «Fecha» · «Concepto» · «Categoría» · «Movimiento» · «Mov.» · «Saldo» · «Conc.» · etiquetas de «Historial» · «Programado» · «Conciliado. Tocar para desmarcar» · «Pendiente. Tocar para conciliar» · `textoSaldoInicio` · «Sin movimientos en este rango.» |
| Ajuste | «Ajustar saldo» · «Cuenta lo que tienes en {la billetera/la cuenta} y escribe el total. TINO registra la diferencia como un movimiento aparte.» · «Saldo en TINO» · «Sin los movimientos programados.» · «Saldo real contado» · «Diferencia» · «Se registrará» · «{11 nov} · Ajuste de saldo · {−3.500}» · «No cuenta como ingreso ni gasto en el resumen.» · «Marcar todo como conciliado hasta hoy» · «Registrar ajuste» · «Registrando…» |
| Tarjeta | «Cupo total» · «Deuda actual» · «Disponible hoy» · «Usado {n} %» · «Disponible {n} %» · «Con esta compra: {n} %» · «Debes» · «¿Puedo comprar esto?» · textos de «Compra» · «Ciclo de facturación» · «Inicio» · «Hoy» · «Corte» · «Pago límite» · «Ciclo» |
| Ciclo | «Ciclo en curso» · «{n} consumo(s)» · «Cargo» · «Abono» · «Saldo al corte anterior» · «Pago desde {cuenta}» · «Transferencia» · «Saldo anterior pendiente» · «Consumos del período» · «Avance hacia {cuenta}» · «Subtotal consumos» · «Cargos del banco · no son consumos» · «Cargos del banco» · «Cargo fijo» · «Sobre {X}» · «Subtotal cargos» · «Sin consumos en este ciclo.» · «Sin cargos en este ciclo.» |
| Condiciones | «Condiciones» · «Cupo» · «Tasa de interés» · «Cuota de manejo» · «{X} al mes» · «Día de corte» · «Día límite de pago» · «{15} de cada mes» · «Se paga desde» · «Sin definir» |
| Sin condiciones | «Falta el día de corte y el de pago.» · «Con ellos TINO arma el ciclo, el pago límite y lo que va en cada corte.» · «Completar condiciones» |
| Panel de cuenta | «Condiciones de la tarjeta» · «Día de corte» · «Día límite de pago» · «Tasa M.V. · opcional» · «Cuota de manejo · opcional» · «Se paga desde · opcional» · «Sin definir» · «Crea una cuenta de efectivo o banco para elegirla.» |
| Validación | «Elige un día entre 1 y 31.» · «Escribe una tasa entre 0 % y 100 %, con hasta dos decimales.» · «Escribe un valor en pesos, sin decimales.» · «La fecha final no puede ser anterior a la inicial.» |
| Movimientos | «Ajuste de saldo» · «Ajuste» |
| Error | «No pudimos cargar esta cuenta.» + «Reintentar» · «No pudimos consultar. Intenta de nuevo.» · «No pudimos conectar. Intenta de nuevo.» |
| Cerrar | «¿Descartar los cambios?» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Cuentas | N-01 | `CuentaDto.id`, `tipo` → `FilaCuenta` enlaza a `/cuentas/<id>` |
| Detalle | N-02, N-45 | `GET /cuentas/:id` → `CabeceraCuenta` |
| Detalle | N-03 | `HistorialDto.saldo` |
| Detalle | N-04 a N-06, N-38 | `HistorialDto.conciliacion` → `textoConciliado` |
| Detalle | N-07, N-08 | `entradas`, `salidas` |
| Detalle | N-09, N-10, N-11 | `?desde&hasta` (`rangoDeAtajo`, rango libre), `desde`, `hasta` → `textoRango`; `RANGO_INVALIDO` |
| Detalle | N-12 a N-17 | `filas` → `TablaHistorial`, `etiquetaFila`, `montoConSigno` |
| Detalle | N-18, N-19 | `FilaHistorialDto.conciliado`; `PUT /cuentas/:id/conciliacion` con un id |
| Detalle | N-20, N-37 | `saldoInicioRango` → `textoSaldoInicio`; «Sin movimientos en este rango.» |
| Detalle | N-21, N-22, N-23, N-24 | Estado del cliente, `pendientesDelRango`, `sumaSeleccion`; `PUT /cuentas/:id/conciliacion` con varios ids |
| Ajuste | N-25 a N-33 | `saldoHoy`, `fechaHoy`; `POST /cuentas/:id/ajustes` (`conciliarHastaHoy`); `MONTO_INVALIDO`, `SIN_DIFERENCIA`; `diferenciaPrevia` |
| Ajuste | N-34 | `GET /resumen` ya excluye ajustes (API); texto «No cuenta como ingreso ni gasto en el resumen.» |
| Detalle | N-35 | Solo efectivo y banco tienen «Ajustar saldo»; `TIPO_NO_ADMITIDO` de la API |
| Detalle | N-36 | `404 CUENTA_NO_ENCONTRADA` → `notFound()` |
| Detalle | N-39 | Sin `hasta` en los atajos; «Programado» |
| Detalle | N-40, N-41 | API (historial y trigger); la web revalida |
| Movimientos | N-42 | `GET /movimientos` con `tipo: "ajuste"`; `PUT` y `DELETE /movimientos/:id` |
| Detalle | N-43 | `GET /cuentas/:id` de archivada → solo lectura; `CUENTA_ARCHIVADA` |
| Todas | N-44 | `formatearDinero`, cifras en mono tabular |
| Tarjeta | N-46 a N-49, N-66 | `TarjetaDto.cupo`, `CuentaDto.saldo`, `disponible`, `porcentajeUsado` → `ResumenTarjeta` |
| Tarjeta | N-50 a N-54 | `GET /cuentas/:id/ciclo?compra=` → `ConsultaCompra`, `textoCompra` |
| Tarjeta | N-55, N-56 | `ciclo.inicio`, `corte`, `pagoLimite`, `diasHasta*`, `fechaHoy` → `LineaCiclo` |
| Tarjeta | N-57 a N-65, N-82 | `ciclo.corteAnterior`, `abonos`, `saldoAnteriorPendiente`, `consumos`, `totalConsumos`, `cargos`, `totalCargos`, `deudaAlCorte` → `CicloTarjeta` |
| Tarjeta | N-67 a N-71, N-81 | `TarjetaDto.tasaMensual`, `tasaEfectivaAnual`, `cuotaManejo`, `diaCorte`, `diaPago`, `cuentaPago` → `CondicionesTarjeta` |
| Tarjeta | N-72 | `cuentaPago`, `pagoSugerido` → `abrir(iniciales)`; `POST /movimientos` |
| Panel de cuenta | N-73 a N-75 | `POST` y `PATCH /cuentas` con `tarjeta`; `CamposTarjeta`; `DIA_INVALIDO`, `TASA_INVALIDA`, `MONTO_INVALIDO`, `CUENTA_PAGO_INVALIDA`, `CONDICIONES_REQUERIDAS` |
| Tarjeta | N-76 a N-78, N-80 | Cálculo de la API; la web muestra |
| Tarjeta | N-79 | `ciclo: null`, `diaCorte: null` → `EstadoVacio` «Completar condiciones» |
| Tarjeta | N-83, N-84 | API (`tarjetas_cambios`, `quitar_cuenta_pago`); «Se paga desde: Sin definir» |

## Plan de implementación

1. **Contrato y tipos.** `repositories/api/cuentas.ts` (`TarjetaDto`, `CondicionesTarjeta`, `obtenerCuenta`), `repositories/api/detalle-cuenta.ts` nuevo, `TipoMovimiento` con `"ajuste"` en repositorio y dominio. Pruebas de mapeo. El resto compila con el tipo nuevo (casos `ajuste` en los `switch`).
2. **Ajustes en `/movimientos`:** libro, fila, edición y filtros; captura sin el tipo. Pruebas de dominio.
3. **Condiciones en `PanelCuenta`:** `ValoresTarjeta`, `validarTarjeta`, `cambiosTarjeta`, `tasaACentesimas` con pruebas; `CamposTarjeta`; acciones de cuentas envían `tarjeta`. El alta de tarjeta vuelve a funcionar.
4. **Ruta `/cuentas/[id]`** con carga, error, `notFound`, redirect de inversión, `CabeceraCuenta` y `?editar=1` con `PanelCuenta`. `FilaCuenta`, `ListaArchivadas` y la redirección de `/cuentas?cuenta=<id>`.
5. **Dominio del detalle** (`domain/cuenta/detalle.ts`) con pruebas sobre los datos de Efectivo del diseño.
6. **Historial:** servicio, `CifrasCuenta`, `RangoHistorial`, `TablaHistorial` (escritorio y móvil), rango vacío, archivada.
7. **Conciliación:** server action, `useOptimistic`, `BarraSeleccion`, modo selección móvil, lotes de 500.
8. **Ajuste:** `PanelAjuste`, server action, revalidación.
9. **Dominio de la tarjeta** (`domain/cuenta/tarjeta.ts`) con pruebas sobre los datos de la tarjeta del diseño.
10. **Tarjeta:** `ResumenTarjeta`, `LineaCiclo`, `CicloTarjeta`, `CondicionesTarjeta`, estado sin condiciones, escritorio y móvil.
11. **Compra:** server action `consultarCompra` y `ConsultaCompra` con espera de 300 ms.
12. **Registrar pago:** `abrir(iniciales?)` en `ProveedorCaptura`/`useCaptura` con prueba; botón en la cabecera.
13. **Revalidación** de `/cuentas/[id]` en `RUTAS_AFECTADAS` y acciones de cuentas.
14. **`/estilos` y `DESIGN.md`:** muestra de cada componente nuevo en ambos modos y su entrada.
15. `npm test`, `npm run lint` y `tsc` pasan; recorrido manual con la API local.

## Criterios de aceptación

- [ ] En `/cuentas`, tocar Efectivo, un banco o la tarjeta abre `/cuentas/<id>`; tocar una inversión abre `/inversiones?inversion=<id>`.
- [ ] `/cuentas/<id>` de un préstamo o de un id inexistente muestra la página 404; el de una inversión redirige a `/inversiones?inversion=<id>`.
- [ ] `/cuentas?cuenta=<id>` de un banco redirige a `/cuentas/<id>?editar=1`; el de una inversión sigue abriendo el panel en `/cuentas`.
- [ ] Con los datos de Efectivo del diseño y hoy 11 nov, el detalle muestra «45.000», conciliado «148.100» con «al 31 oct · 9 sin conciliar», «+100.000», «−177.200», 16 filas con la más reciente arriba y el pie «Saldo al 11 oct  122.200».
- [ ] La ficha «Noviembre» navega a `?desde=2026-11-01`, muestra 9 filas y «Saldo al 31 oct  148.100»; «Octubre» navega con `desde` y `hasta` del mes anterior.
- [ ] El rango libre con «Hasta» anterior a «Desde» muestra «La fecha final no puede ser anterior a la inicial.» sin navegar.
- [ ] Una transferencia de Bancolombia sale con «Desde Bancolombia» y efecto en `entrada-texto`; un ajuste, con «Ajuste».
- [ ] Un gasto de mañana sale arriba con «Programado» y su saldo coincide con «Saldo actual».
- [ ] Tocar el estado de una fila pendiente la muestra conciliada al instante y, tras revalidar, el conteo de pendientes baja en 1; si la API falla, el ícono vuelve y aparece el mensaje.
- [ ] Seleccionar tres filas muestra «3 seleccionados · {suma de sus efectos}»; «Marcar como conciliados» las deja conciliadas y limpia la selección.
- [ ] «Seleccionar pendientes» marca solo las pendientes del rango visible.
- [ ] En móvil, «Seleccionar» muestra casillas en lugar del estado y «Listo» las quita.
- [ ] Con saldo a hoy 45.000, el panel de ajuste con «41.500» muestra «Diferencia −3.500» y «11 nov · Ajuste de saldo · −3.500»; «Registrar ajuste» crea el ajuste y el detalle muestra saldo 41.500 y la fila «Ajuste de saldo» conciliada.
- [ ] Con el saldo real igual al saldo en TINO, «Registrar ajuste» está deshabilitado; «41.500,5» muestra el error de pesos sin decimales.
- [ ] Una cuenta archivada abre su detalle desde `/cuentas/archivadas`, con «Archivada», sin casillas, sin «Ajustar saldo» ni «Editar cuenta»; `?ajuste=1` vuelve a `/cuentas/<id>`.
- [ ] Con los datos de la tarjeta del diseño y hoy 11 nov, la tarjeta muestra «4.000.000», «−1.284.300», «2.715.700», «Usado 32 %», «16 oct – 15 nov · pago hasta 30 nov», «en 4 días», «en 19 días», «Saldo anterior pendiente 597.980», «11 consumos», «Subtotal consumos 651.450», «Subtotal cargos 34.870» y «Deuda actual 1.284.300».
- [ ] Los cargos muestran «Cargo fijo» y «Sobre 597.980»; las condiciones, «1,98 % M.V. · 26,52 % E.A.», «26.990 al mes», «15 de cada mes», «30 de cada mes» y «Bancolombia».
- [ ] Escribir «450.000» en la consulta muestra, sin recargar la página, «Sí, cabe en el cupo.» y «Te quedarían 2.265.700 disponibles (uso 43 %). Entra al corte del 15 nov y se paga hasta el 30 nov.»; «3.000.000» muestra «No cabe en el cupo.» y «Faltan 284.300. Hoy tienes 2.715.700 disponibles.»; vaciar el campo vuelve a la invitación.
- [ ] «Registrar pago» abre la captura con tipo transferencia, origen Bancolombia, destino la tarjeta y monto 597.980; registrarla refresca el ciclo (el pago sale en abonos).
- [ ] Una tarjeta sin condiciones muestra cupo, consulta y «Completar condiciones», que abre el panel; guardar sin día de pago muestra el error bajo «Día límite de pago».
- [ ] Crear una tarjeta sin días de corte o pago muestra «Elige un día entre 1 y 31.» y no envía; con ellos, la tarjeta se crea y su detalle muestra el ciclo.
- [ ] Editar solo la tasa envía `tarjeta: { tasaMensual }`; vaciar la cuota envía `cuotaManejo: null`.
- [ ] En `/movimientos`, un ajuste sale con «Ajuste de saldo», chip «Ajuste» y signo según su cuenta; su edición no ofrece tipo ni categoría y guarda un monto nuevo; se puede eliminar.
- [ ] La captura rápida no ofrece el tipo ajuste.
- [ ] Cada componente nuevo aparece en `/estilos` en claro y oscuro y tiene entrada en `DESIGN.md`.
- [ ] `npm test`, `npm run lint` y `tsc --noEmit` pasan.

## Decisiones

- **Sí:** un solo spec. Decisión del autor: el alta de tarjeta y `/movimientos` quedarían rotos entre specs. **No:** partir en detalle de cuenta y tarjeta.
- **Sí:** una ruta `/cuentas/[id]` que elige historial o ciclo por tipo. **No:** dos rutas, ni maestro-detalle en `/cuentas` (choca con el panel de edición).
- **Sí:** la fila abre el detalle y «Editar cuenta» abre `PanelCuenta` con `?editar=1` en el detalle. **No:** volver a `/cuentas?cuenta=<id>` para editar. Esa URL se conserva para la inversión y redirige en las demás.
- **Sí:** «Registrar pago» abre la captura con `abrir(iniciales?)`. **No:** panel de pago propio, que duplica la captura.
- **Sí:** ajustes en `/movimientos` (ver, editar, borrar) dentro de este spec. **No:** dejarlos sin soporte, con la API ya enviándolos.
- **Sí:** rango libre con dos `date` nativos desplegados desde el botón del rango, solo en escritorio. **No:** campos siempre visibles.
- **Sí:** conciliar optimista solo en el ícono (`useOptimistic`); cifras tras revalidar. **No:** cifras optimistas, que exigirían recalcular el saldo conciliado en la web.
- **Sí:** detalle de archivadas en solo lectura. **No:** ocultarlo.
- **Sí:** «¿Puedo comprar esto?» por server action con 300 ms de espera. **No:** `?compra=` en la URL, que re-renderiza toda la página por tecla; **no:** botón «Consultar».
- **Sí:** «Ajustar saldo» en `PanelLateral`. **No:** columna dentro de la página como el dibujo de escritorio; se desvía del diseño para no crear otra distribución.
- **Sí:** tasa escrita en % con coma («1,98») y cuenta de pago con `FichaCuenta`. **No:** `<select>` nativo.
- **Sí:** sin condiciones, resumen y consulta visibles con invitación en el lugar del ciclo. **No:** pantalla entera vacía.
- **Sí:** «Saldo al {desde − 1}» en el pie. El dibujo dice «Saldo al 12 oct» con rango desde el 12, pero `saldoInicioRango` es el saldo antes de `desde`. **No:** copiar el dibujo.
- **Sí:** «No cuenta como ingreso ni gasto en el resumen.». El dibujo dice «queda en “Ajustes”», línea que la API dejó fuera. **No:** prometer una línea que no existe.
- **Sí:** «Saldo en TINO» del panel es `saldoHoy` (sin futuros), como la API calcula la diferencia. **No:** `saldo`, que descuadra con programados.
- **Sí:** lotes de 500 en secuencia si la selección pasa el tope de la API. **No:** limitar la selección en la interfaz.
- **Sí:** las cifras del ciclo y de la compra salen todas de la API; la web solo arma frases y la posición de «Hoy» en la línea. **No:** calcular ciclo, uso o disponible en la web (REGLAS §5).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Hasta desplegar este spec, el alta de tarjeta falla con `400 CONDICIONES_REQUERIDAS` | Paso 3 del plan lo arregla temprano; mientras, el panel muestra el `mensaje` de la API. |
| Una respuesta vieja de la consulta de compra pisa una nueva | Cada llamada lleva un contador; solo se aplica la última. |
| El optimismo de conciliar se ve bien pero la API falla | `useOptimistic` revierte al terminar la transición; `MensajeError` explica. |
| `revalidatePath("/cuentas/[id]", "page")` invalida todos los detalles en cada movimiento | Escala personal; las páginas son dinámicas y por usuario. |
| La captura prellenada recibe una cuenta de pago archivada | La API ya quita la cuenta de pago al archivarla; si llega una que no está en la captura, se ignora. |
| Una cuenta con cientos de filas en «Últimos 30 días» | La API trae solo el rango; la tabla no pagina (escala personal). |
