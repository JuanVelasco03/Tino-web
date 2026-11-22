# SPEC 10 — Inversiones

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 07, SPEC 08, SPEC 09, Tino-API SPEC 09, Tino-API SPEC 10, Tino-API SPEC 11
> **Fecha:** 2026-11-22
> **Objetivo:** Que el usuario lleve en `/inversiones` sus cuentas de inversión en USD o COP (valor de mercado, posiciones, precio manual, compras, ventas y posiciones iniciales), las fondee desde la captura con dos montos y las vea a mercado en Cuentas, Movimientos, Resumen y el menú, con todo calculado por la API.

## Por qué existe este spec

Es la primera pantalla en otra moneda. Hasta ahora la web suponía COP en todas partes (`moneda: "COP"` en el parser de movimientos, entrada de montos solo en pesos). Fija estos patrones:

- **Dinero en USD de punta a punta.** Entrada con coma decimal (`562,40` → `"56240"`), teclado de la captura con «,», tasas como texto decimal convertidas a centésimas para mostrar, y la línea «≈ COP · TRM» de REGLAS §6.
- **Cálculos del cliente que manda el contrato**, todos con `bigint` y el mismo redondeo half-up de la API: vista previa del precio manual (valor y equivalente), precio por unidad derivado en el panel de operación y tasa implícita en la captura. Son solo presentación.
- **Cantidades decimales que no son dinero.** Viajan como texto con hasta 8 decimales y nunca pasan por `number`.
- **Una cuenta que no admite gastos ni ingresos.** Todo selector de cuenta fuera de la transferencia la excluye.

Por decisión del autor es un solo spec: pantalla, operaciones, fondeo e integración con los demás módulos. El `/spec` propuso partirlo en dos o tres.

Diseño: `referencias/export-inversiones/` (`Inversiones.dc.html`, posiciones y precio manual, escritorio y móvil, claro y oscuro; `Vacios.dc.html`, pantalla «inversiones» de día uno; `Inversiones Lienzo.dc.html`). En `referencias/export-cuentas/Cuentas.dc.html`, la fila de eToro y la TRM de la cabecera. En `referencias/export-resumen/Resumen Mes.dc.html`, la revaluación del puente. Alta, operaciones, cambio de cotización, cuenta vacía y fondeo no están dibujados.
Inventario: `../Tino-API/specs/necesidades/inversiones.md`.
Contrato: `../Tino-API/docs/api/inversiones.md` (Tino-API SPEC 10 y 11); `trm.md` (SPEC 09); `cuentas.md`, `movimientos.md` y `resumen.md` para lo que SPEC 10 les añadió.

## Alcance

**Entra:**

- Ruta `/inversiones` con «Inversiones» habilitado en el menú lateral y en la hoja «Más».
- **Selector** (`?inversion=<id>`): con dos o más inversiones, una fila de chips con nombre y valor de mercado. Sin parámetro, la primera de `GET /inversiones`.
- **Cabecera:** nombre, «cuenta en USD · activo», TRM aplicada con fecha y fuente (solo USD) y «+ Nueva inversión».
- **Cifras:** valor de mercado, costo de las posiciones y rendimiento con %, cada uno con su «≈ COP» en USD.
- **Tabla de posiciones** (escritorio) y **lista** (móvil): símbolo, nombre, cantidad, costo promedio, precio, valor, rendimiento, %, nota de cotización y «manual». Filas «Efectivo disponible» y «Total cuenta». Nota al pie de equivalentes y fechas de precio.
- **Bloque de precio** (`&precio=<activoId>`): en un activo manual, el precio por unidad con vista previa del valor y «Guardar precio» (en escritorio, en línea bajo la fila; en móvil, hoja inferior). En USD, «Intentar precio automático». En un activo automático, «Pasar a cotización manual».
- **Operaciones:** sección bajo la tabla con todas las operaciones de la cuenta. Panel de alta (`&operacion=nueva`: Compra, Venta, Ya lo tenía) con búsqueda del símbolo y precio por unidad derivado. Panel de edición (`&operacion=<id>`: cantidad, total, fecha) con «Eliminar operación».
- **Alta de inversión** en un panel (`?nueva=1`): nombre, moneda y efectivo inicial.
- **Cuenta vacía:** sin posiciones, una invitación a registrar la primera operación.
- **Día uno** (`inversiones: []`): texto, esqueleto de tabla, TRM de hoy y «Agregar cuenta de inversión».
- **Inversión archivada** por URL: detalle en solo lectura.
- **Estados degradados:** precio vencido, TRM desactualizada y sin TRM.
- **Cuentas:** fila de inversión con valor en su moneda, «≈ COP» y tasa, enlazada a `/inversiones`. TRM en la cabecera. `PanelCuenta` de una inversión: tipo fijo, «Efectivo inicial» en su moneda y archivo.
- **Menú:** TRM de referencia en la barra lateral y en la hoja «Más» (N-01), con `GET /trm` en el layout.
- **Captura:** las inversiones solo aparecen en la transferencia. Transferencia entre monedas con «Llegó», tasa implícita de vista previa y teclado con «,» en USD. Lo mismo al editar en `/movimientos`.
- **Movimientos:** una transferencia entre monedas muestra el lado COP y «US$ 2.000,00 · TRM 4.120,00».
- **Resumen:** «Revaluación de inversiones» en el puente cuando no es 0.
- **Recurrentes y Deudas:** sus selectores de cuenta excluyen las inversiones.
- Carga y error de `/inversiones`.
- Revalidación: toda acción de Inversiones revalida `/inversiones`, `/cuentas` y `/resumen`. Movimientos, captura y cuentas revalidan `/inversiones`.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `LineaTrm`, `SelectorInversiones`, `CabeceraInversion`, `CifrasInversion`, `TablaPosiciones`, `BloquePrecio`, `ListaOperaciones`, `PanelOperacion`, `PanelInversion`, `DiaUnoInversiones`.

**Fuera de alcance (specs futuros):**

- Contador de avisos y entradas a Metas y Avisos (N-02, N-03).
- Dividendos (N-76), gastos e ingresos en USD (N-77) y comisión como campo aparte (N-78).
- Posiciones iniciales en el alta de la inversión (`posiciones` de `POST /inversiones`): se registran después con «Ya lo tenía».
- Historial de precios más allá de `precioAnterior`, y gráficas de una inversión.
- Posiciones cerradas como lista aparte: su historia queda en «Operaciones».
- Fondeos y retiros dentro de `/inversiones`: se ven en `/movimientos`.
- Atajo «Fondear» o «Retirar» en `/inversiones` que abra la captura con la cuenta elegida.
- Historial de cambios de una operación (RN-13 lo guarda la API; la web no lo muestra).
- Efecto cambiario en el rendimiento en COP.
- Equivalente en COP de una transferencia entre dos inversiones USD.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume los diez endpoints de `docs/api/inversiones.md`, `GET /trm`, y los campos que SPEC 10 añadió a `GET /cuentas`, `/movimientos` y `GET /resumen`. La zona horaria para la hora del intradía sale de `GET /perfil` (`zonaHoraria`).

### Contrato (copiado de Tino-API, no se redefine)

- `src/repositories/api/trm.ts`: `TrmDto` y `TrmVigenteDto` de `trm.md`.
- `src/repositories/api/inversiones.ts`: `Moneda`, `InversionesDto`, `InversionResumenDto`, `InversionCuerpo`, `PosicionInicialCuerpo`, `InversionDetalleDto`, `PosicionDto`, `OperacionDto`, `OperacionCuerpo`, `OperacionCambio`, `PrecioCuerpo`, `BusquedaActivoDto` y `CotizacionCambio`, tomados de `inversiones.md`. Importa `TrmDto` de `trm.ts`.
- `src/repositories/api/cuentas.ts`: `TipoCuenta` gana `"inversion"`. `CuentaDto` gana `moneda` e `inversion`. `ListaCuentasDto` gana `trm` y `trmDesactualizada`.
- `src/repositories/api/movimientos.ts`: `moneda: "COP" | "USD"`, `montoDestino: string | null`. `MovimientoCuerpo` gana `montoDestino`.
- `src/repositories/api/resumen.ts`: `cambioDelMes.revaluacion`.

Montos como `string` en el borde y `bigint` desde el repositorio hacia dentro. Cantidades como `string` decimal siempre. Porcentajes como `number` entero en centésimas, tal cual. Tasas (`TrmDto.valor`, `inversion.tasa`, `movimiento.tasa`) se convierten a centésimas de peso (`bigint`) con `tasaEnCentesimas` al parsear.

### Modelo de la web

```ts
type Trm = { valor: bigint;            // centésimas de peso por US$: "4120.00" → 412000n
             vigenteDesde: string; vigenteHasta: string; fuente: string };
type TrmVigente = { fechaHoy: string; trm: Trm | null; desactualizada: boolean };

type InversionResumen = { id: string; nombre: string; moneda: Moneda;
  valorMercado: bigint; valorMercadoCop: bigint | null;
  rendimiento: bigint; rendimientoPorcentaje: number | null };

type Inversiones = { fechaHoy: string; trm: Trm | null; trmDesactualizada: boolean;
  inversiones: InversionResumen[] };

type Posicion = {
  activoId: string; simbolo: string; nombre: string;
  cantidad: string;                    // "6.25"
  costo: bigint; costoPromedio: bigint; precio: bigint;
  precioFecha: string; precioOrigen: "manual" | "cierre" | "intradia";
  precioCotizadoEn: string; precioVencido: boolean;
  precioAnterior: { precio: bigint; fecha: string } | null;
  cotizacion: "automatica" | "manual"; clase: "accion" | "etf" | "cripto" | null;
  valor: bigint; valorCop: bigint | null;
  rendimiento: bigint; rendimientoCop: bigint | null; rendimientoPorcentaje: number | null;
};

type InversionDetalle = {
  id: string; nombre: string; moneda: Moneda; fechaHoy: string;
  trm: Trm | null; trmDesactualizada: boolean;
  valorMercado: bigint; valorMercadoCop: bigint | null;
  costo: bigint; costoCop: bigint | null;
  rendimiento: bigint; rendimientoCop: bigint | null; rendimientoPorcentaje: number | null;
  efectivo: bigint; efectivoCop: bigint | null;
  posiciones: Posicion[]; archivadaEn: string | null;
};

type Operacion = {
  id: string; activo: { id: string; simbolo: string; nombre: string };
  clase: "inicial" | "compra" | "venta";
  cantidad: string; monto: bigint; precioUnitario: bigint; fecha: string;
  gananciaRealizada: bigint | null; creadoEn: string; actualizadoEn: string;
};

type BusquedaActivo = { simbolo: string; cubierto: boolean; nombre: string | null;
  clase: "accion" | "etf" | "cripto" | null; proveedorDisponible: boolean };

// Cuentas (cambia)
type Cuenta = { /* … SPEC 03 … */ moneda: Moneda;
  inversion: { efectivo: bigint; valorMercado: bigint; tasa: bigint | null } | null };
type ListaCuentas = { /* … */ trm: Trm | null; trmDesactualizada: boolean };

// Movimientos (cambia)
type Movimiento = { /* … SPEC 04 … */ moneda: Moneda; montoDestino: bigint | null;
  tasa: bigint };                      // centésimas; 100n con la misma moneda

/** Valores de los formularios (texto, como el de cuentas y la captura). */
type ValoresInversion = { nombre: string; moneda: Moneda; efectivoInicial: string };   // "" = 0
type ValoresOperacion = { clase: "inicial" | "compra" | "venta"; simbolo: string; nombre: string;
  cantidad: string; total: string; fecha: string };
type ValoresEdicionOperacion = { cantidad: string; total: string; fecha: string };

type CampoInversion = "nombre" | "moneda" | "efectivoInicial";
type CampoOperacion = "clase" | "simbolo" | "nombre" | "cantidad" | "total" | "fecha";

// Captura (cambia): ValoresCaptura gana `montoDestino: string` ("" si no aplica);
// CampoCaptura gana "montoDestino"; CuerpoMovimiento gana `montoDestino?: string`.
```

### Dominio

```ts
// src/domain/dinero/tasa.ts
tasaEnCentesimas(texto: string): bigint;
// "4120.00" → 412000n · "4166.666667" → 416667n (half-up) · "1" → 100n. Solo strings y bigint.
tasaImplicita(pesos: bigint, centavos: bigint): bigint;
// centésimas: redondear(pesos × 10⁴ ÷ centavos). 8_240_000n y 200_000n → 412000n. Vista previa.
aPesos(centavos: bigint, tasa: bigint): bigint;
// redondear(centavos × tasa ÷ 10⁴), half-up, también negativos. Igual que `aCop` de la API.

// src/domain/dinero/entrada.ts (se amplía)
formatearEntrada(texto: string, moneda: Moneda): string;
// COP: como formatearEntradaPesos. USD: "1234,5" → "1.234,5"; máximo dos decimales; "," inicial → "0,".
aMenores(texto: string, moneda: Moneda): string | null;
// COP: aDigitos. USD: "562,40" → "56240"; "562" → "56200"; "562,4" → "56240"; tres decimales, signos o vacío → null.
desdeMenores(monto: bigint, moneda: Moneda): string;           // 56240n USD → "562,40"
aplicarTecla(valor: string, tecla: TeclaNumerica, moneda?: Moneda): string;
// TeclaNumerica gana ","; en USD «,» agrega la coma una sola vez; en COP se ignora.

// src/domain/inversion/cantidad.ts
formatearCantidad(cantidad: string): string;
// mínimo 4 decimales, hasta 8, miles con punto: "6.25" → "6,2500"; "0.0125" → "0,0125";
// "0.01234567" → "0,01234567"; "1" → "1,0000"; "1250.5" → "1.250,5000".
formatearCantidadCorta(cantidad: string): string;              // "6.25" → "6,25"; "1" → "1"
aCantidad(texto: string): string | null;
// coma decimal, puntos de miles ignorados: "6,25" → "6.25"; "1.250,5" → "1250.5".
// 0, vacío, signo o más de 8 decimales → null.
valorPosicion(cantidad: string, precio: bigint): bigint;       // redondear(cantidad × 10⁸ × precio ÷ 10⁸)
precioPorUnidad(monto: bigint, cantidad: string): bigint;      // redondear(monto × 10⁸ ÷ (cantidad × 10⁸))

// src/domain/inversion/presentacion.ts
formatearPorcentaje(centesimas: number | null): string;
// 1248 → "+12,48 %" · -305 → "−3,05 %" · 0 → "0,00 %" · null → "—". Sin dividir: enteros.
antiguedad(fecha: string, fechaHoy: string): string;
// "hoy" · "ayer" · "hace 4 días" (< 30) · "hace 1 mes" · "hace 3 meses" (meses completos).
notaCotizacion(p: Posicion, fechaHoy: string, zona: string): string;
// cierre: "Cierre 10 nov" · intradía: "11 nov · 09:30" (hora de precioCotizadoEn en la zona)
// manual: "7 nov · hace 4 días". Con precioVencido se agrega " · sin actualizar".
notaPrecios(d: Pick<InversionDetalle, "moneda" | "trm" | "posiciones">, zona: string): string[];
// ver «Nota al pie».
subtituloInversion(d: Pick<InversionDetalle, "nombre" | "moneda" | "archivadaEn">): string;
// "eToro · cuenta en USD · activo" · "Bancolombia Acciones · cuenta en COP · activo" · archivada: "… · archivada".
textoTrm(trm: Trm | null, desactualizada: boolean): { texto: string; aviso: boolean };
// "TRM aplicada 4.120,00 · 11 nov 2026 · Superintendencia Financiera de Colombia" (aviso false)
// desactualizada: "TRM del 8 nov 2026 · sin actualizar · {fuente}" (aviso true)
// null: "Sin TRM: no hay equivalente en pesos." (aviso true)
vistaPreviaPrecio(cantidad: string, precio: bigint, trm: Trm | null, moneda: Moneda):
  { valor: bigint; valorCop: bigint | null };
// valorPosicion; en USD con TRM, aPesos(valor, trm.valor). La calcula el cliente por contrato.

// src/domain/inversion/formulario.ts
VALORES_INVERSION: ValoresInversion;                          // nombre "", moneda "USD", efectivoInicial ""
cuerpoInversion(v: ValoresInversion): InversionCuerpo | null;  // recorta; "" → efectivoInicial ausente; monto inválido → null
VALORES_OPERACION(fechaHoy: string): ValoresOperacion;         // clase "compra", fecha hoy
normalizarSimbolo(texto: string): string;                      // recorta y mayúsculas
activoEnCuenta(simbolo: string, posiciones: readonly Posicion[], operaciones: readonly Operacion[]):
  { id: string; nombre: string } | null;                      // incluye activos de posiciones cerradas
cuerpoOperacion(v: ValoresOperacion, moneda: Moneda, enCuenta: boolean): OperacionCuerpo | null;
// nombre solo si el activo es nuevo y no está vacío; cantidad con aCantidad; total con aMenores;
// fecha vacía → ausente. Cantidad o total inválidos → null.
valoresEdicion(o: Operacion, moneda: Moneda): ValoresEdicionOperacion;
cambioOperacion(antes: ValoresEdicionOperacion, despues: ValoresEdicionOperacion, moneda: Moneda):
  OperacionCambio | null | "invalido";
// solo campos cambiados; sin cambios → null (no se envía, evita SIN_CAMBIOS).
cuerpoPrecio(texto: string, moneda: Moneda): PrecioCuerpo | null;  // aMenores; 0 → null

// src/domain/cuenta/naturaleza.ts (se amplía)
admiteGastoIngreso(tipo: TipoCuenta): boolean;                 // false solo en "inversion"

// src/domain/movimiento/cuerpo.ts (se amplía)
requiereMontoDestino(origen: Moneda | null, destino: Moneda | null): boolean; // solo transferencia y monedas distintas
// cuerpoCaptura envía montoDestino solo si requiereMontoDestino; monto con aMenores en la moneda del origen.
ladoCop(m: Pick<Movimiento, "moneda" | "monto" | "montoDestino">): bigint | null;
// moneda COP con montoDestino → monto; moneda USD con montoDestino → montoDestino; sin montoDestino → null.
```

Signo y color:

- Rendimiento, % y ganancia realizada: `+` en `entrada-texto`, `−` en `salida-texto`, 0 en secundario. Su «≈ COP» va en secundario con el mismo signo.
- Valor, costo, efectivo y precios: sin signo, en tinta. Costo promedio en secundario.
- Operaciones: compra `−` y venta `+` sobre el efectivo, en tinta. «Ya lo tenía» sin signo, en secundario.
- Revaluación en el puente del Resumen: con signo, en tinta, como «Otros cambios».

### Nota al pie

Bajo la tabla, en `etiqueta` secundaria, las frases que apliquen, en este orden:

1. Solo USD con TRM: «Todos los equivalentes en COP usan la TRM de hoy. El rendimiento en COP no incluye lo que cambió el dólar desde cada compra.»
2. Precios de cierre (`precioOrigen: "cierre"`): con una sola fecha, «Las acciones y los ETF tienen precio de cierre del {10 nov}»; con varias, «Las acciones y los ETF tienen precio de cierre de su última sesión».
3. Intradía: con una posición, «el {BTC}, del {11 nov} a las {09:30}»; con varias, «las cripto, de su último precio del día».
4. Se unen con « y » si hay 2 y 3: «Las acciones y los ETF tienen precio de cierre del 10 nov y el BTC, del 11 nov a las 09:30.». Solo 3: «El BTC tiene precio del 11 nov a las 09:30.».

Sin posiciones automáticas, solo la frase 1. En COP sin automáticas, no hay nota.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6).

**Escritorio:**

```
Inversiones                                                                            [+ Nueva inversión]  secundario, enlace
eToro · cuenta en USD · activo                 ⇄ TRM aplicada 4.120,00 · 11 nov 2026 · Superintendencia Financiera de Colombia
[eToro  US$ 7.750,00] [Acciones COP  1.000.000]                                     chips, solo con 2+ inversiones
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALOR DE MERCADO               │ COSTO DE LAS POSICIONES        │ RENDIMIENTO
US$ 7.750,00    cifra-l        │ US$ 6.378,17    cifra-m        │ +US$ 858,22 · +13,46 %   cifra-m, color por signo
≈ 31.930.000 COP               │ ≈ 26.278.060 COP               │ ≈ +3.535.866 COP
ACTIVO          CANTIDAD  COSTO PROM.  PRECIO    VALOR · USD        REND. · USD    %        COTIZACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOO             6,2500    498,72       562,40    3.515,00           +398,00        +12,77 % Cierre 10 nov
Vanguard S&P…                                    ≈ 14.481.800       ≈ +1.639.760
RENEW           1,0000    400,00       405,42    405,42             +5,42          +1,36 %  7 nov · hace 4 días  manual
Smart Portfolio…                       ┄┄┄┄┄┄    ≈ 1.670.330        ≈ +22.330               Actualizar precio
┌ Cotización manual de RENEW        │ Precio por unidad         │ Fecha de la cotización: hoy, 11 nov ┐  bloque en línea
│ El proveedor de precios no cubre… │ US$ 411,06   cifra-l      │ [ Guardar precio ] [ Cancelar ]     │  (&precio=<activoId>)
│ Precio actual · 7 nov  405,42     │ Valor de la posición: US$ │ Intentar precio automático          │
│ Antes · 1 nov  400,00             │ 411,06 ≈ 1.693.567 COP    │                                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
Efectivo disponible                                         513,61                                       Al 11 nov
Saldo sin invertir                                          ≈ 2.116.073
Total cuenta eToro                                          7.750,00           +858,22        +13,46 %
                                                            ≈ 31.930.000       ≈ +3.535.866
═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
[ Registrar operación ]  [ Editar cuenta ]
Todos los equivalentes en COP usan la TRM de hoy. … Las acciones y los ETF tienen precio de cierre del 10 nov y el BTC, del 11 nov a las 09:30.

OPERACIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FECHA   OPERACIÓN                              CANTIDAD          MONTO             GANANCIA REALIZADA
09 nov  Venta · QQQ                            1,0000            +486,90           +44,75
        US$ 486,90 por unidad
02 oct  Compra · VOO                           6,2500            −3.117,00         —
14 ago  Ya lo tenía · RENEW                    1,0000            400,00            —
```

- **Distribución:** cabecera, selector, cifras, tabla, acciones, nota y operaciones en columna, 32 px entre bloques.
- **Cabecera:** «Inversiones» en titulo-1 y `subtituloInversion` en `etiqueta` secundaria. A la derecha, «+ Nueva inversión» (secundario, enlace a `?nueva=1`). Bajo el título, alineada a la derecha, `LineaTrm` con `textoTrm` (solo USD): icono de tasa de 16 px, cifra en mono tinta y el resto en `etiqueta` secundaria; con `aviso`, en `marca-texto`.
- **Selector** (`SelectorInversiones`, con 2+): chips (`ChipCategoria` como enlace a `?inversion=<id>`, `scroll: false`) con nombre y valor de mercado en su moneda en cifra-xs. El de la inversión abierta, seleccionado. Envuelven a varias filas.
- **Cifras** (`CifrasInversion`): tres columnas `1.3fr | 1fr | 1.2fr`, raya fuerte arriba y renglón entre columnas. Rótulo en `rotulo` (el primero en tinta, los demás en secundario). Valor de mercado en cifra-l; costo y rendimiento en cifra-m; el `%` del rendimiento tras «·». Debajo, «≈ {31.930.000} COP» en cifra-xs secundaria, solo USD. Sin TRM, «≈ —».
- **Tabla** (`TablaPosiciones`): rejilla `minmax(0,1fr) 96px 104px 104px 150px 130px 76px 140px`, 12 px entre columnas. Rótulos sobre raya fuerte: «Activo», «Cantidad», «Costo prom.», «Precio», «Valor · USD» (o «· COP»), «Rend. · USD» (o «· COP»), «%», «Cotización». Cifras alineadas a la derecha.
  - Fila: símbolo en mono cifra-s 600 y nombre en `etiqueta` secundaria truncado; `formatearCantidad`, costo promedio en secundario y precio en cifra-s. Precio manual con subrayado discontinuo en `marca`. Valor en cifra-s 500 y rendimiento con color, cada uno con «≈ COP» en cifra-xs secundaria (solo USD). `%` con `formatearPorcentaje`. Cotización: `notaCotizacion` en `etiqueta` secundaria (en `marca-texto` si `precioVencido`), «manual» en cifra-xs `marca-texto` si `cotizacion: "manual"`.
  - Manual: «Actualizar precio» (botón de texto 600 en `marca-texto`) bajo la nota, enlace a `&precio=<activoId>`. Automática: la nota es un botón de texto en secundario que abre `&precio=<activoId>` en modo automático.
  - Renglón abajo en cada fila. La fila con el bloque abierto lleva fondo `hundido`.
  - Orden: el de la API, sin reordenar.
  - «Efectivo disponible» / «Saldo sin invertir», con el efectivo en la columna de valor y «Al {11 nov}» (`fechaHoy`) en la de cotización.
  - «Total cuenta {eToro}» en cuerpo 600: valor de mercado, rendimiento y `%`. Doble raya abajo.
- **Bloque de precio** (`BloquePrecio`, cliente), en línea bajo la fila: rejilla `minmax(0,1fr) 260px 260px`, 32 px entre columnas, fondo `superficie`, raya fuerte abajo.
  - **Manual.** Izquierda: «Cotización manual de {RENEW}» (cuerpo 600) y la explicación. Debajo, «Precio actual · {7 nov}» con el precio y, si hay `precioAnterior`, «Antes · {1 nov}» con el suyo, en `etiqueta` terciaria. Centro: «Precio por unidad», campo en cifra-l con «US$» delante, sobre raya fuerte, prellenado con el precio actual. Bajo el campo, la vista previa (`vistaPreviaPrecio`) en `etiqueta` secundaria. Derecha: «Fecha de la cotización: hoy, {11 nov}», «Guardar precio» (primario, deshabilitado sin `cuerpoPrecio` válido) y «Cancelar» (secundario, enlace sin `&precio`). Debajo, «Intentar precio automático» (botón de texto), solo en USD.
  - **Automática.** Izquierda: «Precio automático de {VOO}» y su explicación. Derecha: «Pasar a cotización manual» (secundario) y «Cerrar».
  - Al guardar o cambiar el modo, el bloque se cierra y la página se refresca. Errores de la API (`PRECIO_INVALIDO`, `PRECIO_AUTOMATICO`, `ACTIVO_NO_CUBIERTO`, `PROVEEDOR_NO_DISPONIBLE`, `CUENTA_ARCHIVADA`) en `MensajeError` dentro del bloque.
- **Acciones** (no archivada): «Registrar operación» (primario, enlace a `&operacion=nueva`) y «Editar cuenta» (secundario, enlace a `/cuentas?cuenta=<id>`).
- **Operaciones** (`ListaOperaciones`): «Operaciones» (`rotulo`) sobre raya fuerte. Rejilla `64px | flexible | 120px | 150px | 150px` con rótulos «Fecha», «Operación», «Cantidad», «Monto», «Ganancia realizada». Fecha en cifra-xs secundaria. «{Compra} · {VOO}» en cuerpo y «{US$ 562,40} por unidad» (`precioUnitario`) en `etiqueta` secundaria. Cantidad con `formatearCantidad`. Monto con el signo de su clase. Ganancia realizada con color, o «—» en terciario. Cada fila es un enlace a `&operacion=<id>` (fondo `hundido` al pasar). Sin operaciones, «Sin operaciones todavía.» en secundario. Orden de la API.

**Móvil (390 px):**

- «Inversiones» y `subtituloInversion` sin «· activo»; el selector debajo, si aplica; «Valor de mercado» en cifra-l con «≈ COP», «Rendimiento» en cifra-m con `%` y «≈ COP»; `LineaTrm`.
- Lista: rótulos «Posición» y «Valor · rend.» sobre raya fuerte; filas `minmax(0,1fr) | auto`. Izquierda: símbolo (mono 600) con «manual» si aplica, nombre en secundario, «{6,25} × {562,40} · costo {498,72}» en cifra-xs (`formatearCantidadCorta`) y `notaCotizacion`. Derecha: valor, «≈ COP» y «{+398,00} · {+12,77 %}» con color. Toda la fila es un enlace a `&precio=<activoId>`.
- «Efectivo disponible» con el efectivo y «≈ COP»; «Total» con el valor de mercado y «≈ COP», doble raya abajo.
- «Registrar operación» (primario) y «Editar cuenta» (secundario) a todo el ancho; la nota al pie; «Operaciones» en `minmax(0,1fr) | auto`: «Compra · VOO» con «{02 oct} · {6,25} × {498,72}» debajo, y a la derecha el monto con la ganancia realizada debajo; «+ Nueva inversión» (`EnlaceTexto`) al pie.
- **Hoja de precio** (`BloquePrecio` en `PanelLateral`, hoja inferior): «Precio manual · {RENEW}» y «Cancelar»; explicación; «Precio actual · {7 nov}» con su precio y, si hay, «Antes · {1 nov}»; «Precio por unidad hoy» con el campo; vista previa; «Guardar precio» a todo el ancho; «Intentar precio automático» debajo en USD. En una automática, «Precio automático · {VOO}» con «Pasar a cotización manual».

**Cuenta vacía** (`posiciones: []`): cifras con lo que traiga la API; en lugar de las filas de posiciones, «Todavía no hay posiciones en {eToro}.» (cuerpo 600) y «Registra lo que ya tenías con «Ya lo tenía», o compra con el efectivo disponible.» en secundario. Las filas de efectivo y total, las acciones y «Operaciones» siguen.

**Archivada** (`archivadaEn` no nulo, por URL): subtítulo con «· archivada», sin acciones, sin «Actualizar precio» ni notas pulsables; las filas de operaciones no son enlaces. No aparece en el selector.

**Día uno** (`inversiones: []`), del diseño: «Inversiones»; «Aún no tienes una cuenta de inversión.» (cuerpo 600) y «Registra tus posiciones con cantidad y costo. Tino trae el precio cuando lo encuentra y lo muestra en USD y en pesos.» en secundario; esqueleto de tabla con «Posición», «Cantidad» y «Valor» sobre raya fuerte y tres filas vacías de 52 px (la última con doble raya); `LineaTrm` con «TRM de hoy 4.120,00 · 11 nov 2026 · {fuente}» de `GET /inversiones`; «Agregar cuenta de inversión» (primario, a todo el ancho en móvil, 400 px en escritorio, enlace a `?nueva=1`).

**Panel de inversión** (`PanelInversion`, `PanelLateral`; en móvil, hoja inferior):

```
NUEVA INVERSIÓN                                            Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre   ______________________________                    CampoSubrayado, máx. 60
( ) Dólares · USD   ( ) Pesos · COP                        OpcionUnica, por defecto USD
Efectivo inicial   0,00                          USD       CampoMonto en la moneda elegida, opcional
Lo que ya tienes sin invertir. Las posiciones las agregas después con «Ya lo tenía».
─────────────────────────────────────────────────────────────── pie fijo
[ Crear inversión ]
```

- Cambiar la moneda reformatea el efectivo conservando la parte entera.
- Envía `POST /inversiones` con `cuerpoInversion` (sin `posiciones`). Al crear, se cierra hacia `/inversiones?inversion=<id>`.
- Errores bajo su campo (`NOMBRE_REQUERIDO`, `NOMBRE_LARGO`, `NOMBRE_DUPLICADO`, `MONEDA_INVALIDA`, `MONTO_INVALIDO` → `efectivoInicial`). Sin campo, `MensajeError` al pie.
- **Cerrar con cambios:** «¿Descartar los cambios?», como `PanelCuenta`.

**Panel de operación** (`PanelOperacion`, `PanelLateral` `ancho="amplio"`):

```
REGISTRAR OPERACIÓN · ETORO                                Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
( ) Compra · sale del efectivo                             OpcionUnica
( ) Venta · entra al efectivo
( ) Ya lo tenía · no mueve efectivo
Símbolo  VOO_________                                      CampoSubrayado, mayúsculas, máx. 12
         [VOO] [QQQ] [AAPL] [BTC] [RENEW]                  ChipCategoria: posiciones abiertas
         Vanguard S&P 500 ETF · precio automático          nota de la búsqueda
Nombre   ______________________________                    solo activo nuevo; máx. 80
Cantidad 6,25_______         Tienes 6,25                   decimal; «Tienes» solo en venta
Total pagado   3.117,00                          USD       CampoMonto; «Total recibido» / «Costo total»
         US$ 498,72 por unidad · comisión incluida         precioPorUnidad
Fecha    02/10/2026 ____                                   date nativo, por defecto hoy, máx. hoy
Efectivo disponible US$ 513,61                             solo en compra, etiqueta secundaria
─────────────────────────────────────────────────────────────── pie fijo
[ Registrar compra ] / [ Registrar venta ] / [ Registrar posición ]
```

- **Clase:** por defecto «Compra». En «Venta», el símbolo solo se elige con los chips (sin campo de texto) y aparece «Tienes {6,25}». En «Compra» y «Ya lo tenía», los chips sugieren y el campo admite cualquier símbolo.
- **Búsqueda:** al salir del campo de símbolo, si cambió, es válido (`A-Z 0-9 . -`, hasta 12) y `activoEnCuenta` no lo encuentra, la web llama `GET …/activos/buscar` una vez por símbolo. Mientras llega, «Buscando…». La nota dice:
  - en la cuenta: «{Vanguard S&P 500 ETF} · ya está en la cuenta» (sin campo «Nombre»);
  - cubierto: «{Nombre} · precio automático» y el nombre prellenado, editable;
  - no cubierto: «No lo encontramos: el precio será manual. Escribe el nombre.»;
  - `proveedorDisponible: false`: «Sin proveedor de precios: el precio será manual. Escribe el nombre.».
  - En una inversión COP no se llama: «El precio será manual. Escribe el nombre.».
- **Precio por unidad:** con cantidad y total válidos, «{US$ 498,72} por unidad · comisión incluida» (`precioPorUnidad`).
- Envía `POST /inversiones/:id/operaciones` con `cuerpoOperacion`. Se cierra hacia `/inversiones?inversion=<id>`.
- **Errores:** el `mensaje` de la API va bajo su campo (`simbolo`, `nombre`, `cantidad`, `monto` → «Total», `fecha`). `EFECTIVO_INSUFICIENTE` y `CANTIDAD_INSUFICIENTE` sin campo útil van al pie. Cantidad y total se validan antes de enviar: «Escribe una cantidad mayor que cero, con hasta 8 decimales.» y «Escribe un valor en dólares, con hasta dos decimales.» (o «en pesos, sin decimales.»).
- **Edición** (`&operacion=<id>`): «Editar operación», con «{Compra} · {VOO} · {Vanguard S&P 500 ETF}» fijo en `etiqueta` secundaria; cantidad, total y fecha prellenados con `valoresEdicion`. «Guardar cambios», deshabilitado si `cambioOperacion` es `null`. Envía `PUT`. Abajo, «Eliminar operación» con `BloqueEliminar` y `DELETE`. Errores como en el alta. Un `id` desconocido vuelve a `/inversiones?inversion=<id>`.
- **Cerrar con cambios:** «¿Descartar los cambios?».

### Integración con otros módulos

**Menú** (`MenuLateral`, hoja «Más» de `BarraPestanas`): al pie, «TRM de referencia» en `etiqueta` secundaria, «{4.120,00} COP» en mono cifra-s y «{11 nov 2026}» (`vigenteDesde`) en `etiqueta` secundaria. Desactualizada: «{8 nov 2026} · sin actualizar» en `marca-texto`. `trm: null`: «Sin TRM». Si `GET /trm` falla, el bloque no se muestra. La lee `app/(aplicacion)/layout.tsx` con `services/trm.ts`.

**Cuentas:**

- Cabecera: «Saldos al {11 nov 2026} · USD a TRM {4.120,00}» (móvil «Al {11 nov} · USD a TRM {4.120,00}») cuando `trm` no es nulo. Desactualizada: «· USD a TRM {4.120,00} · sin actualizar» en `marca-texto`.
- Fila de inversión, del diseño. Escritorio: tipo «Inversión · USD» (COP: «Inversión»), detalle «US$ 7.750,00 × 4.120,00» en mono (`valorMercado` × `tasa`), saldo en COP y «US$ 7.750,00» debajo en cifra-xs secundaria. Móvil: subtítulo «Inversión · TRM 4.120,00», saldo en COP con «US$ 7.750,00» debajo. USD con `tasa: null`: saldo «Sin TRM» en `marca-texto`. La fila es un enlace a `/inversiones?inversion=<id>`; el agarre para ordenar sigue.
- `PanelCuenta` de una inversión (`?cuenta=<id>`): sin selector de tipo (texto fijo «Inversión · USD»), «Efectivo inicial» en su moneda con `formatearEntrada` / `aMenores` (es `saldoInicial`), sin cupo. Archivar sigue igual. `EFECTIVO_INSUFICIENTE` bajo «Efectivo inicial»; `SALDO_NO_CERO`, `TIPO_DE_INVERSION_FIJO` con su `mensaje`. Al guardar o archivar desde ahí, vuelve a `/cuentas`.
- El alta de cuentas (`?cuenta=nueva`) no ofrece inversión.

**Captura** (`PanelCaptura`, `usar-formulario.ts`):

- Gasto e ingreso: las fichas de cuenta excluyen las inversiones (`admiteGastoIngreso`). Transferencia: origen y destino las incluyen.
- El monto principal va en la moneda del origen: `CampoMonto` muestra esa moneda y `formatearEntrada` la usa. En USD, el teclado numérico cambia «000» por «,». Cambiar a un origen de otra moneda conserva la parte entera de lo tecleado.
- Si `requiereMontoDestino`, aparece «Llegó» bajo las cuentas: `CampoMonto` editable en la moneda del destino. Debajo, con ambos montos válidos, «Tasa {4.120,00} COP por US$ · TRM de hoy {4.120,00}» en `etiqueta` secundaria (`tasaImplicita`; la TRM de `GET /cuentas`; sin TRM, solo la tasa).
- Errores: `MONTO_DESTINO_REQUERIDO`, `MONTO_DESTINO_NO_PERMITIDO` y `MONTO_INVALIDO` con `campo` `montoDestino` → «Llegó». `CUENTA_DE_INVERSION` → su cuenta. `EFECTIVO_INSUFICIENTE` → `MensajeError` al pie.
- «Elegir como predeterminada» no se ofrece en una inversión.
- **Edición en `/movimientos`** (SPEC 06): el mismo formulario precarga `montoDestino` con `desdeMenores` y lo envía en el `PUT`.

**Movimientos** (`FilaMovimiento`): una transferencia con `montoDestino` muestra como cifra `ladoCop` y, debajo, «{US$ 2.000,00} · TRM {4.120,00}» en `etiqueta` secundaria (el lado USD y la `tasa` del movimiento). Una transferencia entre dos cuentas USD muestra su monto en USD, sin línea.

**Resumen** (`CambioDelMes`): «Revaluación de inversiones» con su cifra con signo, entre «Resultado del mes» y «Otros cambios», solo si `revaluacion` no es 0.

**Recurrentes y Deudas:** las fichas de cuenta de `PanelPlantilla`, `PanelPrestamo` y `PanelAbono` excluyen las inversiones.

### Textos literales

| Caso | Texto |
|---|---|
| Título | «Inversiones» · «Nueva inversión» |
| Subtítulo | «{eToro} · cuenta en USD · activo» · «… · cuenta en COP · activo» · «… · archivada» |
| TRM | «TRM aplicada {4.120,00} · {11 nov 2026} · {fuente}» · «TRM del {8 nov 2026} · sin actualizar · {fuente}» · «Sin TRM: no hay equivalente en pesos.» · «TRM de hoy {4.120,00} · {11 nov 2026} · {fuente}» |
| Cifras | «Valor de mercado» · «Costo de las posiciones» · «Rendimiento» · «≈ {31.930.000} COP» · «≈ —» |
| Tabla | «Activo» · «Cantidad» · «Costo prom.» · «Precio» · «Valor · USD» · «Rend. · USD» · «Valor · COP» · «Rend. · COP» · «%» · «Cotización» · (móvil) «Posición» · «Valor · rend.» |
| Cotización | «Cierre {10 nov}» · «{11 nov} · {09:30}» · «{7 nov} · {hace 4 días}» · «hoy» · «ayer» · «hace {N} días» · «hace 1 mes» · «hace {N} meses» · «· sin actualizar» · «manual» · «Actualizar precio» |
| Filas fijas | «Efectivo disponible» · «Saldo sin invertir» · «Al {11 nov}» · «Total cuenta {eToro}» · (móvil) «Total» |
| Precio manual | «Cotización manual de {RENEW}» · (móvil) «Precio manual · {RENEW}» · «El proveedor de precios no cubre este activo. El valor queda fijo hasta que lo actualices; toma el precio del extracto o de la app de {eToro}.» · «Precio actual · {7 nov}» · «Antes · {1 nov}» · «Precio por unidad» · (móvil) «Precio por unidad hoy» · «Valor de la posición: {US$ 411,06} ≈ {1.693.567} COP» · «Fecha de la cotización: hoy, {11 nov}» · «Guardar precio» · «Guardando…» · «Cancelar» · «Intentar precio automático» |
| Precio automático | «Precio automático de {VOO}» · (móvil) «Precio automático · {VOO}» · «Tino trae este precio solo: el cierre de la última sesión en acciones y ETF, y el último precio del día en cripto.» · «Pasar a cotización manual» · «Cerrar» |
| Acciones | «Registrar operación» · «Editar cuenta» · «+ Nueva inversión» |
| Operaciones | «Operaciones» · «Fecha» · «Operación» · «Cantidad» · «Monto» · «Ganancia realizada» · «Compra» · «Venta» · «Ya lo tenía» · «{US$ 562,40} por unidad» · «Sin operaciones todavía.» |
| Cuenta vacía | «Todavía no hay posiciones en {eToro}.» · «Registra lo que ya tenías con «Ya lo tenía», o compra con el efectivo disponible.» |
| Día uno | «Aún no tienes una cuenta de inversión.» · «Registra tus posiciones con cantidad y costo. Tino trae el precio cuando lo encuentra y lo muestra en USD y en pesos.» · «Posición» · «Cantidad» · «Valor» · «Agregar cuenta de inversión» |
| Panel inversión | «Nueva inversión» · «Nombre» · «Dólares · USD» · «Pesos · COP» · «Efectivo inicial» · «Lo que ya tienes sin invertir. Las posiciones las agregas después con «Ya lo tenía».» · «Crear inversión» · «Creando…» |
| Panel operación | «Registrar operación · {eToro}» · «Compra · sale del efectivo» · «Venta · entra al efectivo» · «Ya lo tenía · no mueve efectivo» · «Símbolo» · «Buscando…» · «{Nombre} · ya está en la cuenta» · «{Nombre} · precio automático» · «No lo encontramos: el precio será manual. Escribe el nombre.» · «Sin proveedor de precios: el precio será manual. Escribe el nombre.» · «El precio será manual. Escribe el nombre.» · «Nombre» · «Cantidad» · «Tienes {6,25}» · «Total pagado» · «Total recibido» · «Costo total» · «{US$ 498,72} por unidad · comisión incluida» · «Fecha» · «Efectivo disponible {US$ 513,61}» |
| Panel operación, acciones | «Registrar compra» · «Registrar venta» · «Registrar posición» · «Registrando…» · «Editar operación» · «Guardar cambios» · «Guardando…» · «Eliminar operación» |
| Validación | «Escribe una cantidad mayor que cero, con hasta 8 decimales.» · «Escribe un valor en dólares, con hasta dos decimales.» · «Escribe un valor en pesos, sin decimales.» |
| Menú | «TRM de referencia» · «{4.120,00} COP» · «{11 nov 2026}» · «· sin actualizar» · «Sin TRM» |
| Cuentas | «Saldos al {11 nov 2026} · USD a TRM {4.120,00}» · «Al {11 nov} · USD a TRM {4.120,00}» · «· sin actualizar» · «Inversión · USD» · «Inversión · TRM {4.120,00}» · «US$ {7.750,00} × {4.120,00}» · «Sin TRM» · «Efectivo inicial» |
| Captura | «Llegó» · «Tasa {4.120,00} COP por US$ · TRM de hoy {4.120,00}» |
| Movimientos | «{US$ 2.000,00} · TRM {4.120,00}» |
| Resumen | «Revaluación de inversiones» |
| Error | «No pudimos cargar tus inversiones.» + «Reintentar» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Menú | N-01 | `GET /trm` en el layout → `MenuLateral`, hoja «Más» |
| Menú | N-04 | Ya cubierto (SPEC 05) |
| Cabecera | N-05, N-06 | `nombre`, `moneda` → `subtituloInversion` |
| Cabecera | N-07 | `trm`, `trmDesactualizada` → `textoTrm`, solo USD |
| Cifras | N-08 a N-14 | `valorMercado`, `costo`, `rendimiento`, `rendimientoPorcentaje` y sus `…Cop` |
| Tabla | N-15 a N-22 | `posiciones[]` → `formatearCantidad`, `formatearPorcentaje` |
| Tabla | N-23, N-24, N-25 | `precioOrigen`, `precioFecha`, `precioCotizadoEn`, `cotizacion` → `notaCotizacion`, `antiguedad`; zona de `GET /perfil` |
| Precio | N-26, N-27, N-35 | `&precio=<activoId>` → `POST …/activos/:activoId/precios` |
| Precio | N-28 | `cuerpoPrecio`; `PRECIO_INVALIDO` |
| Precio | N-29 | `vistaPreviaPrecio` con `cantidad` y `trm` |
| Precio | N-36, N-53 | `precio`/`precioFecha` («Precio actual») y `precioAnterior` («Antes») |
| Tabla | N-30, N-31 | `efectivo`, `efectivoCop`; «Al {fechaHoy}» |
| Tabla | N-32 | `valorMercado`, `rendimiento`, `rendimientoPorcentaje` |
| Nota | N-33 | `clase`, `precioOrigen`, fechas → `notaPrecios` |
| Tabla | N-34 | Orden de la API |
| Día uno | N-37, N-38, N-39 | `inversiones: []`, `trm` de `GET /inversiones`; `?nueva=1` |
| Alta | N-40, N-41, N-42 | `POST /inversiones` con `cuerpoInversion`; errores bajo su campo |
| Operación | N-43 | «Ya lo tenía» → `clase: "inicial"` |
| Cuentas | N-44, N-45 | `PanelCuenta` → `PATCH /cuentas/:id`, archivar (SPEC 04) |
| Selector | N-46 | `GET /inversiones` → `SelectorInversiones` |
| Cuenta vacía | N-47 | `posiciones: []` |
| Operación | N-48, N-49 | `GET …/activos/buscar`; `NOMBRE_REQUERIDO` |
| Precio | N-50, N-52 | Lo hace la API al leer; `precioVencido` → «sin actualizar» |
| TRM | N-51, N-52 | `trmDesactualizada`, `trm: null` → `textoTrm` |
| — | N-54 | Lo usa la API en `GET /resumen`; sin interfaz |
| Todas | N-55 | `moneda: "COP"`: sin `…Cop`, sin TRM ni «≈», columnas «· COP» |
| Operación | N-56 a N-59 | `POST …/operaciones`; `EFECTIVO_INSUFICIENTE`, `CANTIDAD_INSUFICIENTE`, `ACTIVO_NO_ENCONTRADO` |
| Operaciones | N-60 | `gananciaRealizada` |
| Tabla | N-61 | `posiciones` solo abiertas; historia en `GET …/operaciones` |
| Tabla | N-62 | `cantidad`, `costoPromedio` de la API |
| Operaciones | N-63 | `GET /inversiones/:id/operaciones` |
| Operación | N-64, N-65 | `PUT` y `DELETE …/operaciones/:operacionId`; errores de línea de tiempo |
| Captura | N-66 a N-69 | `POST /movimientos` con `montoDestino`; `MONTO_DESTINO_*`, `EFECTIVO_INSUFICIENTE` |
| Movimientos | N-70 | `moneda`, `montoDestino`, `tasa` → `ladoCop` y línea USD |
| Cuentas | N-71, N-72 | `CuentaDto.inversion`, `saldo`; `patrimonioNeto` de la API |
| Resumen | N-73 | `cambioDelMes.revaluacion` |
| Cuentas | N-74 | `ListaCuentasDto.trm` |
| Todas | N-75 | Regla de la API; la web no cuenta compras ni fondeos |
| Todas | — | `loading.tsx`, `error.tsx`; `formatearDinero` |
| Fuera de alcance | N-02, N-03, N-76, N-77, N-78 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/layout.tsx                    # + GET /trm para el menú
src/app/(aplicacion)/inversiones/
  page.tsx                                         # nuevo: GET /inversiones, detalle, operaciones, perfil; ?inversion=, ?nueva=1, &precio=, &operacion=
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
  acciones.ts                                      # nuevo: crear, buscarActivo, registrarOperacion, editarOperacion, eliminarOperacion, guardarPrecio, cambiarCotizacion
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/inversiones"; campo montoDestino
src/app/(aplicacion)/cuentas/page.tsx              # TRM en la cabecera; PanelCuenta de inversión
src/app/(aplicacion)/cuentas/acciones.ts           # + revalida /inversiones
src/app/(aplicacion)/cuentas/archivadas/acciones.ts # + revalida /inversiones
src/app/estilos/page.tsx                           # + muestras de inversiones
src/app/estilos/muestras-interactivas.tsx          # + bloque de precio y paneles de muestra
src/components/linea-trm.tsx                       # nuevo: icono de tasa + texto, con aviso
src/components/inversiones/
  selector-inversiones.tsx                         # nuevo
  cabecera-inversion.tsx                           # nuevo: título, subtítulo, TRM, + Nueva inversión
  cifras-inversion.tsx                             # nuevo: tres cifras (escritorio) o dos (móvil)
  tabla-posiciones.tsx                             # nuevo: tabla (escritorio) o lista (móvil), efectivo, total, cuenta vacía
  bloque-precio.tsx                                # nuevo, cliente: manual y automático; en línea o hoja
  lista-operaciones.tsx                            # nuevo
  panel-operacion.tsx                              # nuevo, cliente: alta y edición
  panel-inversion.tsx                              # nuevo, cliente
  dia-uno-inversiones.tsx                          # nuevo
src/components/menu/entradas.ts                    # Inversiones → /inversiones
src/components/menu/menu-lateral.tsx               # + TRM al pie
src/components/menu/barra-pestanas.tsx             # + TRM en la hoja «Más»
src/components/cuentas/fila-cuenta.tsx             # fila de inversión
src/components/cuentas/lista-cuentas.tsx           # TRM en la cabecera
src/components/cuentas/panel-cuenta.tsx            # inversión: tipo fijo, efectivo inicial en su moneda
src/components/captura/panel-captura.tsx           # «Llegó», tasa, moneda del monto, fichas sin inversiones
src/components/captura/usar-formulario.ts          # montoDestino, moneda del origen
src/components/captura/teclado-numerico.tsx        # «,» en USD
src/components/campo-monto.tsx                     # entrada en USD
src/components/fila-movimiento.tsx                 # lado COP + línea USD
src/components/resumen/cambio-del-mes.tsx          # + revaluación
src/components/recurrentes/panel-plantilla.tsx     # fichas sin inversiones
src/components/deudas/panel-prestamo.tsx           # fichas sin inversiones
src/components/deudas/panel-abono.tsx              # fichas sin inversiones
src/domain/dinero/tasa.ts                          # nuevo (+ tasa.test.ts)
src/domain/dinero/entrada.ts                       # + USD, «,» (+ prueba)
src/domain/inversion/cantidad.ts                   # nuevo (+ cantidad.test.ts)
src/domain/inversion/presentacion.ts               # nuevo (+ presentacion.test.ts)
src/domain/inversion/formulario.ts                 # nuevo (+ formulario.test.ts)
src/domain/inversion/tipos.ts                      # nuevo: tipos del modelo que usa el dominio
src/domain/cuenta/naturaleza.ts                    # + admiteGastoIngreso (+ prueba)
src/domain/cuenta/edicion.ts                       # efectivo inicial en USD (+ prueba)
src/domain/movimiento/cuerpo.ts                    # + montoDestino, requiereMontoDestino, ladoCop (+ prueba)
src/domain/movimiento/edicion.ts                   # precarga montoDestino (+ prueba)
src/services/inversiones.ts                        # nuevo
src/services/trm.ts                                # nuevo
src/repositories/api/trm.ts                        # nuevo
src/repositories/api/inversiones.ts                # nuevo (+ inversiones.test.ts)
src/repositories/api/cuentas.ts                    # moneda, inversion, trm (+ prueba)
src/repositories/api/movimientos.ts                # moneda USD, montoDestino (+ prueba)
src/repositories/api/resumen.ts                    # revaluacion (+ prueba)
DESIGN.md                                          # + LineaTrm y componentes de inversiones
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos, y reciben las server actions por prop. Nunca importan `repositories/`.

## Plan de implementación

1. `domain/dinero/tasa.ts` + pruebas: `tasaEnCentesimas` («4120.00», «4166.666667», «1», «4120.005» half-up), `tasaImplicita` (8.240.000 y 2.000,00 → 4.120,00; 1.000.000 y 240,00 → 4.166,67), `aPesos` (positivo, negativo, medio centavo). `domain/dinero/entrada.ts` + pruebas: `formatearEntrada` y `aMenores` en USD («562,40», «562», «562,4», «562,401» → `null`, «,5»), `desdeMenores`, `aplicarTecla` con «,» en USD y en COP.
2. `domain/inversion/cantidad.ts` + pruebas: `formatearCantidad` («6.25», «0.0125», «0.01234567», «1», «1250.5»), `formatearCantidadCorta`, `aCantidad` (coma, miles, 9 decimales, 0, vacío), `valorPosicion` (6,25 × 562,40 → 3.515,00; 0,0125 × 71.400,00 → 892,50), `precioPorUnidad` (3.117,00 ÷ 6,25 → 498,72; redondeo).
3. `domain/inversion/presentacion.ts` + pruebas: `formatearPorcentaje`, `antiguedad`, `notaCotizacion` (cierre, intradía en `America/Bogota`, manual, vencido), `notaPrecios` (una fecha de cierre, varias, un intradía, varios, solo cripto, COP sin automáticas, sin TRM), `subtituloInversion`, `textoTrm` (normal, desactualizada, nula), `vistaPreviaPrecio` (USD con y sin TRM, COP). `domain/inversion/formulario.ts` + pruebas: `cuerpoInversion`, `normalizarSimbolo`, `activoEnCuenta` (abierta, cerrada, ausente), `cuerpoOperacion` (nombre solo si es nuevo, total en USD y COP, inválidos → `null`), `valoresEdicion`, `cambioOperacion` (solo fecha, sin cambios → `null`, inválido), `cuerpoPrecio`.
4. Repositorios y servicios: `trm.ts`; `inversiones.ts` + prueba con el JSON de `inversiones.md` y las rutas de las diez llamadas; `cuentas.ts`, `movimientos.ts` y `resumen.ts` con los campos nuevos + pruebas. `services/inversiones.ts` y `services/trm.ts`: `401` → `/login`; lecturas; escrituras con `Resultado` que nunca lanza al cliente. `admiteGastoIngreso` + prueba. Las pantallas existentes siguen funcionando con los tipos ampliados.
5. Compatibilidad: la captura (gasto e ingreso), `PanelPlantilla`, `PanelPrestamo` y `PanelAbono` excluyen las inversiones. `FilaMovimiento` con `ladoCop` y la línea USD. `CambioDelMes` con la revaluación. `/inversiones` en `RUTAS_AFECTADAS` y en las acciones de cuentas.
6. TRM: `LineaTrm`; el layout lee `GET /trm`; bloque al pie de `MenuLateral` y en la hoja «Más». Cabecera de Cuentas. Fila de inversión en `FilaCuenta` enlazada a `/inversiones?inversion=<id>`.
7. Ruta de solo lectura: `page.tsx`, `loading.tsx`, `error.tsx`, «Inversiones» en `entradas.ts`. `CabeceraInversion`, `SelectorInversiones`, `CifrasInversion`, `TablaPosiciones` (escritorio y móvil, efectivo, total, cuenta vacía, nota al pie), `ListaOperaciones` y `DiaUnoInversiones`. Archivada en solo lectura. Un `?inversion` desconocido vuelve a `/inversiones`. Al terminar, la pantalla se ve con datos reales en USD y en COP.
8. `PanelInversion` con `crear` en `acciones.ts`: moneda, efectivo inicial, errores y descarte. «+ Nueva inversión» y la entrada de día uno.
9. `BloquePrecio` con `guardarPrecio` y `cambiarCotizacion`: precio manual en línea (escritorio) y en hoja (móvil), vista previa, «Precio actual» y «Antes», modo automático y cambio de modo con sus errores.
10. `PanelOperacion` (alta) con `buscarActivo` y `registrarOperacion`: clase, chips, búsqueda al salir del campo, nombre, cantidad, total, precio por unidad, fecha, efectivo disponible y errores de línea de tiempo.
11. `PanelOperacion` (edición) con `editarOperacion` y `eliminarOperacion`: precarga, «Guardar cambios» deshabilitado sin cambios, `BloqueEliminar`.
12. `PanelCuenta` de una inversión: tipo fijo, efectivo inicial en su moneda, `EFECTIVO_INSUFICIENTE` y `SALDO_NO_CERO`. «Editar cuenta» desde `/inversiones`.
13. Captura entre monedas: `CampoMonto` y `TecladoNumerico` en USD, monto en la moneda del origen, «Llegó», tasa de vista previa, `montoDestino` en el cuerpo y sus errores. Edición en `/movimientos` con `montoDestino`.
14. `/estilos`: `LineaTrm` (normal, desactualizada, nula), selector, cifras en USD y COP, tabla con las cinco posiciones del diseño, bloque de precio manual y automático, operaciones, cuenta vacía, día uno, los dos paneles, fila de inversión de Cuentas y la captura con «Llegó», en claro y oscuro.
15. `DESIGN.md`: `LineaTrm`, selector, cifras, tabla de posiciones, bloque de precio, operaciones, paneles de inversión y operación, día uno, fila de inversión, «Llegó» en la captura y teclado con «,».

## Criterios de aceptación

Datos de prueba: los del diseño (`Inversiones.dc.html`: eToro en USD, efectivo US$ 513,61, VOO, QQQ, AAPL, BTC y RENEW manual) con TRM 4.120,00 del 11 nov 2026 y `fechaHoy` 2026-11-11.

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] «Inversiones» está habilitado y activo en el menú lateral y en la hoja «Más», y lleva a `/inversiones`.
- [ ] El menú lateral y la hoja «Más» muestran «TRM de referencia», «4.120,00 COP» y «11 nov 2026». Con la TRM desactualizada, la fecha dice «· sin actualizar» en ámbar.
- [ ] La cabecera dice «eToro · cuenta en USD · activo» y «TRM aplicada 4.120,00 · 11 nov 2026 · Superintendencia Financiera de Colombia».
- [ ] Las cifras dicen «Valor de mercado US$ 7.750,00 ≈ 31.930.000 COP», «Costo de las posiciones US$ 6.378,17 ≈ 26.278.060 COP» y «Rendimiento +US$ 858,22 · +13,46 % ≈ +3.535.866 COP» en verde.
- [ ] La fila de VOO dice «6,2500», «498,72», «562,40», «3.515,00» con «≈ 14.481.800», «+398,00» en verde, «+12,77 %» y «Cierre 10 nov».
- [ ] La fila de BTC dice «0,0125» y «11 nov · 09:30». La de RENEW dice «7 nov · hace 4 días», «manual» y «Actualizar precio».
- [ ] La fila «Efectivo disponible» dice «513,61» con «≈ 2.116.073» y «Al 11 nov». «Total cuenta eToro» repite valor de mercado, rendimiento y % de las cifras.
- [ ] La nota al pie dice «Todos los equivalentes en COP usan la TRM de hoy. …» y «Las acciones y los ETF tienen precio de cierre del 10 nov y el BTC, del 11 nov a las 09:30.».
- [ ] «Actualizar precio» en RENEW abre el bloque bajo su fila con «Precio actual · 7 nov 405,42». Escribir «411,06» muestra «Valor de la posición: US$ 411,06 ≈ 1.693.567 COP». «Guardar precio» deja RENEW en 411,06 con «11 nov · hoy», y el bloque muestra después «Antes · 7 nov 405,42».
- [ ] «Guardar precio» está deshabilitado con el campo vacío, en «0» o con tres decimales.
- [ ] La nota de VOO abre el bloque «Precio automático de VOO». «Pasar a cotización manual» deja VOO con «manual» y «Actualizar precio». En RENEW, «Intentar precio automático» muestra el `mensaje` de `ACTIVO_NO_CUBIERTO` y RENEW sigue manual.
- [ ] En 390 px, `/inversiones` muestra la lista con «6,25 × 562,40 · costo 498,72» en VOO, sin scroll horizontal. Tocar RENEW abre la hoja «Precio manual · RENEW» con «Precio actual · 7 nov».
- [ ] Con un precio vencido, su nota dice «· sin actualizar» en ámbar. Con `trm: null`, la cabecera dice «Sin TRM: no hay equivalente en pesos.» y los «≈» dicen «—».
- [ ] Con dos inversiones, el selector muestra ambas con su valor. Tocar la segunda cambia el detalle sin desplazar la página. Con una, no hay selector.
- [ ] Un `?inversion` que no existe vuelve a `/inversiones`. Una inversión archivada por URL muestra «· archivada» y ninguna acción.
- [ ] Sin inversiones se ve «Aún no tienes una cuenta de inversión.», el esqueleto de tabla, «TRM de hoy 4.120,00 · 11 nov 2026 · …» y «Agregar cuenta de inversión», que abre «Nueva inversión».
- [ ] Crear «Acciones COP» en pesos con efectivo 1.000.000 cierra el panel en su detalle: sin TRM ni «≈», columnas «Valor · COP», «Todavía no hay posiciones en Acciones COP.» y efectivo 1.000.000.
- [ ] En «Acciones COP», «Ya lo tenía» con «ECOPETROL», cantidad «100» y costo total 250.000 pide el nombre («El precio será manual. Escribe el nombre.»). Con nombre, la posición aparece con «manual» y el efectivo sigue en 1.000.000.
- [ ] En eToro, «Compra» de «MSFT» muestra «Microsoft Corporation · precio automático» al salir del campo. Cantidad «2» y total «800,00» muestran «US$ 400,00 por unidad · comisión incluida». Registrar baja el efectivo en US$ 800,00 y la operación sale primera en «Operaciones» con «−800,00».
- [ ] Una compra mayor que el efectivo muestra el `mensaje` de `EFECTIVO_INSUFICIENTE` y no se registra.
- [ ] «Venta» solo ofrece chips de posiciones abiertas y dice «Tienes 6,25» al elegir VOO. Vender las 6,25 saca VOO de la tabla y la venta muestra su ganancia realizada con color.
- [ ] Una cantidad «1,123456789» muestra «Escribe una cantidad mayor que cero, con hasta 8 decimales.» y no se envía.
- [ ] Tocar una operación abre «Editar operación» con sus valores. Sin cambios, «Guardar cambios» está deshabilitado. Cambiar la fecha la guarda. Borrar una compra con ventas posteriores muestra el `mensaje` de `CANTIDAD_INSUFICIENTE` y no se borra.
- [ ] «Editar cuenta» abre `PanelCuenta` de eToro sin selector de tipo y con «Efectivo inicial» en US$. Archivarla con posiciones muestra el `mensaje` de `SALDO_NO_CERO`.
- [ ] En `/cuentas`, eToro dice «Inversión · USD», «US$ 7.750,00 × 4.120,00» y «31.930.000» con «US$ 7.750,00» debajo; tocarla abre `/inversiones?inversion=<id>`. La cabecera dice «Saldos al 11 nov 2026 · USD a TRM 4.120,00».
- [ ] En la captura, eToro no aparece como cuenta de un gasto ni de un ingreso. En una transferencia de Bancolombia a eToro aparece «Llegó» en USD; con 8.240.000 y 2.000,00 dice «Tasa 4.120,00 COP por US$ · TRM de hoy 4.120,00». Registrar sube el efectivo de eToro en US$ 2.000,00 y baja Bancolombia en 8.240.000.
- [ ] Una transferencia de eToro a Bancolombia lleva el monto en US$ con la tecla «,» en el teclado móvil y «Llegó» en COP.
- [ ] En `/movimientos`, esa transferencia muestra «8.240.000» y «US$ 2.000,00 · TRM 4.120,00» debajo. Editarla precarga «Llegó» con 2.000,00; cambiarlo a 2.100,00 cambia el efectivo de eToro sin recargar a mano.
- [ ] Con una revaluación distinta de 0 en el mes, el puente de `/resumen` muestra «Revaluación de inversiones» entre «Resultado del mes» y «Otros cambios». Sin inversiones, la línea no aparece.
- [ ] Las fichas de cuenta de recurrentes, alta de préstamo y abono no ofrecen eToro.
- [ ] Con la API apagada, `/inversiones` muestra «No pudimos cargar tus inversiones.» y «Reintentar».
- [ ] `/estilos` muestra `LineaTrm`, selector, cifras, tabla, bloque de precio (manual y automático), operaciones, cuenta vacía, día uno, los dos paneles, la fila de inversión y la captura con «Llegó», en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto, cantidad, precio, tasa ni porcentaje pasa por `number` (salvo el `number` entero de los porcentajes del contrato), `parseFloat` ni `Number()`.
- [ ] La web no calcula valor de mercado, costo, rendimiento, efectivo, costo promedio, ganancia realizada ni equivalentes de la API. Las únicas operaciones sobre montos son `vistaPreviaPrecio`, `precioPorUnidad` y `tasaImplicita`.

## Decisiones

- **Sí:** un solo spec para pantalla, operaciones, fondeo e integración, por decisión del autor. **No:** partirlo en pantalla, operaciones e integración, como propuso `/spec`.
- **Sí:** `/inversiones?inversion=<id>` con selector de chips y la primera por defecto, como `?prestamo=` en Deudas. **No:** lista con ruta `/inversiones/[id]`. **No:** maestro-detalle: la tabla de ocho columnas necesita todo el ancho.
- **Sí:** alta con nombre, moneda y efectivo inicial; las posiciones previas con «Ya lo tenía» en el panel de operación. **No:** filas repetibles de posiciones en el alta: dos formularios para lo mismo.
- **Sí:** panel de operación con Compra / Venta / Ya lo tenía y sección «Operaciones» con todas las de la cuenta. **No:** historial por posición: choca con el toque de móvil que abre el precio.
- **Sí:** en venta, el símbolo solo con chips de posiciones abiertas. **No:** campo libre que termina en `ACTIVO_NO_ENCONTRADO`.
- **Sí:** búsqueda del símbolo al salir del campo, una vez por símbolo, y nunca si ya está en la cuenta (incluidas las cerradas) ni en COP. Cada búsqueda gasta un crédito del proveedor.
- **Sí:** «Total pagado» como dato y el precio por unidad derivado en el cliente con el redondeo de la API. **No:** pedir el precio unitario: el contrato pide el total con comisión.
- **Sí:** cambio de cotización en el bloque de precio. **No:** dejar los activos en el modo con que nacieron.
- **Sí:** «Intentar precio automático» solo en USD: en COP la API siempre deja manual.
- **Sí:** el bloque de precio por URL (`&precio=<activoId>`), como los paneles. **No:** estado local del cliente, que no sobrevive a la revalidación.
- **Sí:** en el bloque, «Precio actual» es `precio` y «Antes» es `precioAnterior`. El diseño rotula «Precio anterior» al vigente, que al guardar pasa a serlo.
- **Sí:** nombre y moneda del texto del diseño, ajustados: «El proveedor de precios no cubre este activo», no «este portafolio de eToro»; «cantidad y costo», no «costo promedio» (choque N-17, N-62); «Tino», no «TINO».
- **Sí:** la fuente de la TRM es `fuente` de la API. **No:** «Banco de la República» ni «BanRep» del diseño, que no coinciden con el contrato.
- **Sí:** TRM con dos decimales en todas partes (`4.120,00`). **No:** «4.120» del menú y de Cuentas en el diseño.
- **Sí:** cantidad con mínimo 4 decimales en escritorio y sin ceros finales en móvil, como el diseño.
- **Sí:** estados degradados como nota en `marca-texto`. **No:** franja de aviso aparte.
- **Sí:** «Al {fechaHoy}» en la fila de efectivo. **No:** «Saldo eToro · 11 nov», que sugiere un saldo conciliado (choque N-30, N-31).
- **Sí:** la hora del intradía en la zona de `GET /perfil`. **No:** la zona del navegador.
- **Sí:** TRM en el menú con `GET /trm` en el layout, y en la cabecera de Cuentas. **No:** dejar N-01 fuera otra vez.
- **Sí:** la fila de inversión en Cuentas enlaza a `/inversiones`; nombre, efectivo inicial y archivo se editan con «Editar cuenta» en el `PanelCuenta` de siempre. **No:** panel propio de edición en `/inversiones`.
- **Sí:** fondeo y retiro en la captura, como toda transferencia (RN-16). **No:** botones «Fondear» o «Retirar» en `/inversiones`.
- **Sí:** el monto principal en la moneda del origen y «Llegó» en la del destino, como el contrato. **No:** derivar un monto del otro con la TRM: la tasa real es la implícita (RN-04).
- **Sí:** tasa implícita de vista previa junto a la TRM de hoy, para detectar un monto mal digitado. La que vale es la que congela la API.
- **Sí:** teclado de la captura con «,» en lugar de «000» cuando el origen es USD. Cambiar la moneda del origen conserva la parte entera.
- **Sí:** en `/movimientos`, el lado COP como cifra y la línea USD con la tasa. **No:** la cifra en la moneda del origen.
- **Sí:** revaluación en el puente solo si no es 0. **No:** una línea en 0 para quien no invierte.
- **Sí:** todo selector de cuenta fuera de la transferencia excluye las inversiones (`admiteGastoIngreso`), para no llegar a `CUENTA_DE_INVERSION`.
- **Sí:** cifras del encabezado en cifra-l y cifra-m, filas en cifra-s y cifra-xs, campo de precio en cifra-l. **No:** los 40, 28, 24, 17, 14 y 11 px del diseño, que no son medidas del sistema.
- **Sí:** botones de 48 px y 32 px entre bloques. **No:** los 44 y 52 px y los 36 px del diseño.
- **Sí:** textos relativos con `fechaHoy` de la respuesta, nunca `new Date()`.
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El spec es grande y toca seis módulos | Pasos que dejan todo funcionando; los tipos ampliados (paso 4) no rompen pantallas; la compatibilidad (paso 5) va antes que la pantalla nueva. |
| `GET /inversiones/:id` tarda porque trae precios vencidos (hasta 8 activos) | `loading.tsx` cubre la espera. Si el proveedor falla, la API responde igual con `precioVencido`. |
| Búsquedas que gastan créditos del proveedor | Solo al salir del campo, una vez por símbolo, nunca si ya está en la cuenta ni en COP. |
| La vista previa del cliente difiere del valor que calcula la API | Mismas fórmulas y redondeo half-up de Tino-API SPEC 10, con pruebas. La vista previa es informativa. |
| Doble toque en «Guardar precio», «Registrar compra» o «Crear inversión» | El botón se deshabilita mientras la acción está en curso. |
| El layout lee `GET /trm` y no se vuelve a pintar al navegar | Las acciones revalidan; la TRM cambia una vez al día. Si falla, el bloque no se muestra y la página sigue. |
| Una transferencia USD en pantallas que aún suponen COP | El parser acepta USD desde el paso 4 y `FilaMovimiento` lo pinta desde el paso 5, antes de habilitar el fondeo (paso 13). |
| Cambiar la moneda del origen con un monto con decimales | Se conserva la parte entera y el usuario ve el monto reformateado antes de registrar. |
| Una operación editada deja la línea de tiempo inválida | La API responde `EFECTIVO_INSUFICIENTE` o `CANTIDAD_INSUFICIENTE`; el panel muestra el `mensaje` y no cierra. |
| `fechaHoy` de la API y el día del navegador difieren (zona) | Todo texto relativo usa `fechaHoy` de la respuesta. |

## Lo que **no** entra en este spec

- Avisos, Metas y su contador.
- Dividendos, gastos e ingresos en USD y comisión aparte.
- Posiciones iniciales dentro del alta.
- Historial de precios, gráficas y posiciones cerradas como lista aparte.
- Fondeos dentro de `/inversiones` y atajos para fondear.
- Historial de cambios de una operación y efecto cambiario del rendimiento.

Cada uno, si llega, va en su propio spec.
