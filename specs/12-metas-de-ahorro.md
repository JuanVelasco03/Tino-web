# SPEC 12 — Metas de ahorro

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 09, SPEC 10, SPEC 11, Tino-API SPEC 13
> **Fecha:** 2026-11-23
> **Objetivo:** Que el usuario lleve en `/metas` sus metas de ahorro sobre una cuenta (lista, detalle con ritmo e historial, alta, edición, aportes y retiros, eliminar, archivar y restaurar), con todo calculado por la API y solo las frases armadas en la web.

## Por qué existe este spec

Es la segunda pantalla maestro-detalle (tras Deudas, SPEC 09) y la primera cuyas cifras son todas derivadas: avance, falta, porcentaje, ritmo, cumplimiento, saldo libre e historial llegan de la API. Fija estos patrones:

- **Frases armadas en el cliente.** Ritmo largo (detalle) y corto (móvil), fecha de la lista, nota de apartado compartido, nota de inversión y etiquetas del historial salen de funciones puras de `domain/meta/` con los campos de `MetaDto` y `MetaDetalleDto`. La web no suma, no resta y no proyecta.
- **Apartar no es mover dinero.** El panel de aporte deja elegido «Ya está en {cuenta}»: nada se transfiere salvo que el usuario elija una cuenta de origen (RN-16). El retiro solo libera; el gasto se registra aparte.
- **Un panel para registrar y corregir.** Registrar aporte o retiro y editar o borrar uno usan el mismo panel por URL. Borrar un aporte con origen borra su transferencia, y el panel lo dice antes.
- **Archivadas en subruta**, como `/cuentas/archivadas`.

Diseño: `referencias/export-metas/` (`Metas.dc.html`, escritorio claro y oscuro con Fondo de emergencia, Viaje a Cartagena, Cuota inicial sobre eToro y la cumplida Arreglo de la moto; móvil lista; `Metas Lienzo.dc.html`). No están dibujados: detalle móvil, alta, edición, aporte, retiro, editar o borrar un aporte, eliminar, archivar, archivadas, estado vacío, saldo excedido, meta vencida ni meta sin TRM.
Inventario: `../Tino-API/specs/necesidades/metas.md`.
Contrato: `../Tino-API/docs/api/metas.md` (Tino-API SPEC 13); `cuentas.md` para las cuentas del formulario.

## Alcance

**Entra:**

- Ruta `/metas` con «Metas» habilitado en el menú lateral y en la hoja «Más».
- **Cabecera:** «Metas de ahorro» (móvil «Metas»), «En metas activas: {34.430.000} de {54.300.000}» y «Nueva meta».
- **Lista** agrupada en «Activas» y «Cumplidas» (los grupos vacíos no salen), en el orden de la API. Cada fila: nombre, porcentaje, barra, avance de objetivo y fecha meta o de cumplimiento. En móvil, además, la cuenta con su icono y, en las activas, el ritmo corto.
- **Detalle** por `?meta=<id>`: cuenta y modo, nombre, avance de objetivo, barra, porcentaje, falta, ritmo largo, nota de apartado compartido o de inversión, aviso de saldo excedido, historial y condiciones.
- **Alta y edición** en un panel (`?nueva=1`, `?meta=<id>&editar=1`): nombre, modo, cuenta, objetivo, fecha meta (sin fecha, día o mes) y, solo en el alta por apartado, el apartado inicial con su origen.
- **Aporte y retiro** en un panel (`?meta=<id>&registrar=aporte|retiro`): tipo (solo por apartado), monto, fecha, cuenta de origen («Ya está en {cuenta}» elegida por defecto) y motivo.
- **Editar o borrar un aporte o retiro** en el mismo panel (`?meta=<id>&aporte=<aporteId>`), abierto desde su fila del historial.
- **Acciones del detalle** según estado y modo: «Registrar aporte», «Ver inversiones», «Editar meta», «Registrar retiro», «Archivar» y «Eliminar meta…» con `BloqueEliminar` en línea.
- **Archivadas** en `/metas/archivadas`, con «Ver archivadas» al pie de la lista: lista, detalle de solo lectura, «Restaurar» y «Eliminar meta…».
- **Vacío:** `EstadoVacio` con «Nueva meta».
- Carga y error de `/metas` y `/metas/archivadas`.
- Revalidación: las acciones de metas revalidan `/metas` y `/metas/archivadas`, y las que crean, cambian o borran una transferencia, además las rutas de la captura. Captura, movimientos, recurrentes, cuentas, deudas e inversiones revalidan `/metas`.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `ListaMetas`, `DetalleMeta`, `BarraAvance`, `AccionesMeta`, `PanelMeta`, `PanelAporte` y `CampoFechaMeta`.

**Fuera de alcance (specs futuros):**

- TRM en el menú, contador de avisos y captura rápida (N-01, N-02, N-04): ya cubiertos.
- Aportes a una meta sobre inversión: «Ver inversiones» lleva a su detalle.
- Cuenta de origen en USD y objetivo en otra moneda que COP.
- Avisos de metas, metas en el resumen del mes y saldo libre en la pantalla Cuentas.
- Consultar el historial de cambios de una meta (la API no lo expone).
- Bloquear el tipo de la transferencia de un aporte en `/movimientos`: la API responde `MOVIMIENTO_DE_META` y la edición muestra su `mensaje`.
- Enlazar una fila del historial a su transferencia en `/movimientos`.
- Aviso con «Deshacer» tras cualquier acción de metas.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume los once endpoints de `docs/api/metas.md`. Para las cuentas del alta, la edición y el origen consume `GET /cuentas` (con `obtenerCuentas()` de `services/cuentas.ts`, SPEC 04).

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/metas.ts`: `ModoMeta`, `CuentaMetaDto`, `RitmoDto`, `MetaDto`, `MetasDto`, `FilaAporteDto`, `FilaValorDto`, `MetaDetalleDto`, `MetaCuerpo`, `MetaCambio`, `AporteCuerpo` y `AporteCambio`, tomados de `docs/api/metas.md`. Montos como `string` en el borde y como `bigint` desde el repositorio hacia dentro. `porcentaje`, `dias` y `meses` son `number` (centésimas y plazos, no montos). La TRM se convierte con `aTrm` de `repositories/api/trm.ts`. El historial se distingue por modo: `FilaAporte[]` en `apartado`, `FilaValor[]` en `cuenta`.

### Modelo de la web

```ts
type CuentaMeta = { id: string; nombre: string; tipo: "efectivo" | "banco" | "inversion"; moneda: "COP" | "USD" };

type Ritmo =
  | { tipo: "dias"; falta: bigint; dias: number; vencida: boolean }
  | { tipo: "meses"; falta: bigint; meses: number; cuotaMensual: bigint; vencida: boolean }
  | { tipo: "promedio"; promedioMensual: bigint | null; mesEstimado: string | null };

type Meta = {
  id: string; nombre: string; modo: ModoMeta; cuenta: CuentaMeta;
  objetivo: bigint; avance: bigint | null; falta: bigint | null; porcentaje: number | null;
  fechaMeta: string | null; cumplidaEl: string | null;
  uso: { fecha: string; motivo: string | null } | null;
  ritmo: Ritmo | null; creadaEl: string; archivadaEn: string | null;
};

type Metas = {
  fechaHoy: string; trm: Trm | null;
  totales: { avance: bigint; objetivo: bigint; incompleto: boolean };
  activas: Meta[]; cumplidas: Meta[];
};

type FilaAporte = {
  id: string; tipo: "aporte" | "retiro"; fecha: string; monto: bigint; acumulado: bigint;
  inicial: boolean; motivo: string | null; cuentaOrigen: { id: string; nombre: string } | null;
  movimientoId: string | null;
};

type FilaValor = { tipo: "cierre" | "hoy"; fecha: string; valor: bigint | null; variacion: bigint | null; trm: Trm | null };

type MetaDetalle = Meta & (
  | { modo: "apartado"; historial: FilaAporte[] }
  | { modo: "cuenta"; historial: FilaValor[] }
) & {
  apartados: { saldoCuenta: bigint; apartadoAqui: bigint; otras: { metaId: string; nombre: string; apartado: bigint }[]; libre: bigint; excedido: boolean } | null;
  inversion: { valorMercado: bigint; moneda: "COP" | "USD"; trm: Trm | null } | null;
};
```

`fechaHoy` llega solo en `GET /metas`. Las archivadas no lo traen: su detalle no muestra ritmo (son cumplidas) y la página de archivadas no arma textos relativos a hoy.

### Dominio

```ts
// src/domain/meta/presentacion.ts
textoPorcentaje(porcentaje: number | null): string;          // 2533 → "25,3 %" (truncado a un decimal) · null → "—"
anchoBarra(porcentaje: number | null): number;               // 0 a 100: topa en 100, negativo o null → 0
textoFechaLista(m: Meta, fechaHoy: string | null): string;   // ver «Fechas»
textoFechaCondicion(m: Meta): string;                        // ver «Fechas»
textoCuenta(m: Meta): string;                                // "Nubank · apartado para esta meta" · "eToro · toda la cuenta"
textoFalta(m: Meta): string;                                 // "Faltan 1.200.000" · cumplida "Cumplida el 12 sep" · avance null "—"
textoRitmo(m: Meta, fechaHoy: string, formato: "largo" | "corto"): string | null;  // ver «Ritmo»
mesesPromedio(creadaEl: string, fechaHoy: string): number;   // meses calendario de la creación a hoy, inclusive, topado en 6
notaApartado(m: MetaDetalle): string | null;                 // ver «Notas»; null fuera de "apartado"
avisoExcedido(m: MetaDetalle): string | null;                // ver «Notas»; null si no excedido
notaInversion(m: MetaDetalle): string | null;                // ver «Notas»; null fuera de inversión
etiquetaAporte(f: FilaAporte): string;                       // ver «Historial»
etiquetaValor(f: FilaValor, creadaEl: string): string;       // ver «Historial»
montoFila(monto: bigint | null, tipo: "aporte" | "retiro" | "variacion"): string;  // "+150.000" · "−100.000" · null "—"
textoTotales(t: Metas["totales"], activas: readonly Meta[], formato: "largo" | "corto"): string;  // ver «Cabecera»
accionesMeta(m: MetaDetalle): AccionMeta[];                  // ver «Acciones»
type AccionMeta = "registrar_aporte" | "ver_inversiones" | "editar" | "registrar_retiro" | "archivar" | "restaurar" | "eliminar";

// src/domain/meta/formulario.ts
type Precision = "ninguna" | "dia" | "mes";
precisionDe(fechaMeta: string | null): Precision;            // null → "ninguna" · "YYYY-MM" → "mes" · "YYYY-MM-DD" → "dia"
fechaMetaDesde(precision: Precision, valor: string): string | null;  // "ninguna" → null; el valor del input tal cual
cuentasAdmitidas(modo: ModoMeta, cuentas: readonly Cuenta[], metas: readonly Meta[], metaId?: string): Cuenta[];
// apartado: efectivo y banco; cuenta: efectivo, banco e inversión.
// Fuera las que una meta sin archivar excluye (otra que la propia):
// en apartado, las que tienen una meta de modo cuenta; en cuenta, las que tienen cualquier meta.
cuentasOrigen(cuentas: readonly Cuenta[], cuentaMetaId: string): Cuenta[];  // COP, distintas de la de la meta
validarMeta(v: ValoresMeta, alta: boolean): { cuerpo: MetaCuerpo } | { errores: Partial<Record<CampoMeta, string>> };
cambioDesde(original: MetaDetalle, v: ValoresMeta): MetaCambio | null;      // solo los campos que cambiaron; null sin cambios
validarAporte(v: ValoresAporte): { cuerpo: AporteCuerpo } | { errores: Partial<Record<CampoAporte, string>> };
```

Todo texto relativo usa `fechaHoy` de la respuesta, nunca `new Date()`. Fechas con `formatearFechaSinAnio` («15 dic») si son del año de `fechaHoy` y con `formatearFecha` («15 dic 2027») si no. Meses con `formatearMesCorto` («dic 2027»); el mes estimado, con `formatearNombreMes` y el año («mayo de 2028»). Montos con `formatearDinero`, TRM con `formatearTasa`.

`cuentasAdmitidas` es solo presentación: la API valida con `CUENTA_NO_ADMITIDA` y `CUENTA_CON_META_EXCLUSIVA`.

### Cabecera

- Largo: «En metas activas: {34.430.000} de {54.300.000}». Corto (móvil): «En metas activas {34.430.000} de {54.300.000}».
- `incompleto`: se agrega « · sin {1} meta sin TRM» («· sin {2} metas sin TRM»), en `marca-texto`, contando las activas con `avance: null`.
- Sin activas: «Sin metas activas.».

### Fechas

| Caso | Lista (`textoFechaLista`) | Condición (`textoFechaCondicion`) |
|---|---|---|
| Día | «Para el {15 dic}» | «{15 dic 2026}» |
| Mes | «Para {dic 2027}» | «{Dic 2027}» |
| Sin fecha | «Sin fecha» | «Sin fecha» |
| Cumplida | «Cumplida el {12 sep}» | «Cumplida · {12 sep}» |

En archivadas (`fechaHoy` null) la lista usa siempre la fecha con año.

### Ritmo

| `ritmo` | Largo (detalle) | Corto (móvil) |
|---|---|---|
| `dias`, quedan n | «Para llegar el {15 dic} faltan {1.200.000} en {34} días.» (1: «en 1 día») | «Faltan {1.200.000} en {34} días.» |
| `dias`, 0 sin vencer | «Para llegar hoy faltan {1.200.000}.» | «Faltan {1.200.000} para hoy.» |
| `dias`, vencida | «La fecha meta fue el {15 dic}. Faltan {1.200.000}.» | «Venció el {15 dic} · faltan {1.200.000}.» |
| `meses`, quedan n | «Para {dic 2027} faltan {13.070.000}: unos {1.005.385} al mes durante {13} meses.» (1: «durante 1 mes») | «Faltan {13.070.000} · unos {1.005.385} al mes.» |
| `meses`, 0 sin vencer | «Para {nov 2026} faltan {13.070.000}, todo este mes.» | «Faltan {13.070.000} este mes.» |
| `meses`, vencida | «La fecha meta era {dic 2027}. Faltan {13.070.000}.» | «Venció en {dic 2027} · faltan {13.070.000}.» |
| `promedio` con valores, apartado | «En los últimos {6} meses aportaste en promedio {316.667} al mes. A ese ritmo llegarías alrededor de {mayo de 2028}.» | «A tu ritmo actual, alrededor de {mayo de 2028}.» |
| `promedio` con valores, cuenta | «En los últimos {6} meses el avance creció en promedio {316.667} al mes. A ese ritmo llegarías alrededor de {mayo de 2028}.» | igual que apartado |
| `promedio` en `null` | «En los últimos {6} meses el avance no creció: todavía no hay ritmo para estimar cuándo llegarías.» | «Sin ritmo para estimar.» |
| Cumplida | «Llegaste al objetivo el {12 sep}.» + con `uso`: « El dinero se usó el {14 sep}.» o « El dinero se usó el {14 sep} · {taller}.» | `null` (las cumplidas no llevan línea de ritmo) |
| `avance: null` | «Sin TRM de hoy: el avance de {eToro} no se puede calcular.» | «Sin TRM de hoy.» |

- «{6} meses» es `mesesPromedio`; con 1, «En este mes aportaste {316.667}.» («En este mes el avance creció {316.667}.»).
- La cumplida no lleva tramo «Faltan».

### Notas

- **Apartado compartido** (`notaApartado`), con `apartados`: «{Nubank} tiene {2.500.000}: {1.900.000} apartados aquí y {600.000} para {Viaje a Cartagena}.» Varias otras: separadas por coma y la última con «y». Con `libre` > 0 se agrega al final «y {300.000} libres» («…, {600.000} para {Viaje a Cartagena} y {300.000} libres.»). Sin otras ni libre: «{Nubank} tiene {1.900.000}, todo apartado aquí.» Sin otras y con libre: «{Nubank} tiene {2.500.000}: {1.900.000} apartados aquí y {600.000} libres.»
- **Excedido** (`avisoExcedido`, `excedido: true`): «Lo apartado en {Nubank} supera su saldo en {200.000}. Registra un retiro en alguna de sus metas.», con el negativo de `libre`. Reemplaza el tramo de libres de la nota.
- **Inversión** (`notaInversion`, con `inversion`): USD «El avance sigue el valor de mercado de {eToro}: {US$ 7.750,00} a TRM {4.120,00}. Sube y baja con el mercado y con el dólar.»; COP «El avance sigue el valor de mercado de {XTB}: {31.930.000}. Sube y baja con el mercado.». USD sin TRM: «El avance sigue el valor de mercado de {eToro}: {US$ 7.750,00}. Sin TRM de hoy no se puede pasar a pesos.».

### Historial

| Fila | Etiqueta | Monto | Acumulado |
|---|---|---|---|
| `inicial` | «Apartado inicial» (con origen: «Apartado inicial desde {Bancolombia}») | «+300.000» | `acumulado` |
| `aporte` sin origen | «Aporte» | «+150.000» | `acumulado` |
| `aporte` con origen | «Aporte desde {Bancolombia}» | «+150.000» | `acumulado` |
| `retiro` | «Retiro» | «−100.000» | `acumulado` |
| `cierre` en `creadaEl` | «Valor al crear la meta» | «—» (`variacion` null) | `valor` |
| `cierre` | «Valor al cierre» | `variacion` con signo | `valor` |
| `hoy` | «Valor hoy» (con `trm`: «Valor hoy · TRM {4.120,00}») | `variacion` con signo | `valor` |

- Con `motivo` se agrega « · {motivo}» («Retiro · arreglo de la nevera»).
- Monto y acumulado en tinta: apartar no cambia el patrimonio. `valor` null → «—».
- Columna de monto: «Aporte» en `apartado`, «Variación» en `cuenta`. La de cifra acumulada: «Acumulado» y «Valor».

### Acciones

`accionesMeta` decide qué botones lleva el detalle:

| Meta | Acciones |
|---|---|
| Activa por apartado | «Registrar aporte» (primario) · «Editar meta» · «Eliminar meta…» |
| Activa, toda la cuenta (efectivo o banco) | «Registrar aporte» (primario) · «Editar meta» · «Eliminar meta…» |
| Activa, toda la cuenta (inversión) | «Ver inversiones» (primario, enlace) · «Editar meta» · «Eliminar meta…» |
| Cumplida por apartado con `apartadoAqui` > 0 | «Registrar retiro» (secundario) · «Eliminar meta…» y la nota «Para archivarla, retira lo apartado.» |
| Cumplida por apartado con `apartadoAqui` = 0 | «Archivar» (secundario) · «Eliminar meta…» |
| Cumplida, toda la cuenta | «Archivar» (secundario) · «Eliminar meta…» |
| Archivada | «Restaurar» (primario) · «Eliminar meta…» |

`avance: null` no cambia las acciones.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6).

**Escritorio:**

```
Metas de ahorro   titulo-1                                                      [+ Nueva meta]  secundario, enlace
En metas activas: 34.430.000 de 54.300.000   etiqueta secundaria, cifras en mono
┌────── 400 px ──────┐   ┌──────────────────────────── detalle ────────────────────────────┐
ACTIVAS                   🏦 Nubank · apartado para esta meta     etiqueta secundaria
━━━━━━━━━━━━━━━━━━━━━━━   Fondo de emergencia   titulo-2
Viaje a Cartagena 33,3 %  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▬▬▬▬▬▬───────────────     1.900.000  cifra-l                                    de 7.500.000  cifra-m
600.000 de 1.800.000      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬─────────────────────────────────────────  8 px
       Para el 15 dic     25,3 %                                                 Faltan 5.600.000
Cuota inicial apto 70,9 % En los últimos 6 meses aportaste en promedio 316.667 al mes. A ese ritmo …
…                         Nubank tiene 2.500.000: 1.900.000 apartados aquí y 600.000 para Viaje a Cartagena.
CUMPLIDAS  (secundario)   FECHA  HISTORIAL                  APORTE  ACUMULADO │ Cuenta asociada  Nubank · apartado…
━━━━━━━━━━━━━━━━━━━━━━━   10 nov Aporte                   +350.000  1.900.000 │ Objetivo          7.500.000
Arreglo de la moto 100 %  31 oct Retiro · arreglo de la… −100.000  1.550.000 │ Fecha meta        Sin fecha
▬▬▬▬▬▬▬▬▬▬▬ (secundario)  …                                                  │ Creada            15 jun 2026
850.000 de 850.000                                                           │ [Registrar aporte] [Editar meta]
  Cumplida el 12 sep                                                         │ Eliminar meta…
Ver archivadas
└── 400 | 48 | flexible ──┘
```

- **Distribución:** cabecera a todo el ancho; debajo, desde xl, lista y detalle en `400px | minmax(0,1fr)`, 48 px entre ellas, alineadas arriba. Entre md y xl, la lista arriba y el detalle debajo. 32 px entre bloques.
- **Cabecera:** «Metas de ahorro» en titulo-1 y `textoTotales` largo en `etiqueta` secundaria, con las cifras en mono `texto` (avance) y secundario (objetivo). «Nueva meta» (`BOTON_ENLACE.secundario` con `+`) a la derecha, enlace a `?nueva=1` conservando `?meta`.
- **Grupo:** rótulo en `rotulo` sobre raya fuerte; «Cumplidas» con el rótulo en secundario.
- **Fila de la lista** (`ListaMetas`): enlace a `?meta=<id>` (`scroll: false`), renglón abajo, 12 px de relleno vertical, 8 px entre líneas:
  - nombre en cuerpo 600 (secundario si cumplida) y `textoPorcentaje` en cifra-xs secundaria a la derecha;
  - `BarraAvance` de 4 px;
  - «{600.000} de {1.800.000}» (avance en cifra-xs `texto`, objetivo en cifra-xs secundaria, «de» en `etiqueta` secundaria) y `textoFechaLista` a la derecha en `etiqueta` secundaria. `avance: null` muestra «—».
  - La elegida lleva fondo `hundido`; al pasar el cursor, también.
- **«Ver archivadas»** (`EnlaceTexto`) al pie de la lista, a `/metas/archivadas`.
- **Barra** (`BarraAvance`): pista en `linea`, relleno en `texto` (activa) o `secundario` (cumplida), radio de muestra, ancho `anchoBarra`. 4 px en la lista y 8 px en el detalle. `role="img"` con la etiqueta «{25,3 %} del objetivo».
- **Cabecera del detalle** (`DetalleMeta`): `IconoCuenta` de 16 px y `textoCuenta` en `etiqueta` secundaria; nombre en titulo-2; raya fuerte abajo.
- **Cifras:** avance en cifra-l a la izquierda y «de {7.500.000}» a la derecha («de» en cuerpo secundario, objetivo en cifra-m). `BarraAvance` de 8 px. Debajo, `textoPorcentaje` y `textoFalta` en cifra-xs secundaria, a los extremos.
- **Ritmo:** `textoRitmo` largo en cuerpo. Debajo, la nota de apartado o de inversión en `etiqueta` secundaria (`font-normal`) y el aviso de excedido en `etiqueta` `marca-texto`.
- **Historial y condiciones** en `minmax(0,1.4fr) | minmax(0,1fr)`, 32 px entre ellas, alineadas arriba.
  - Historial: rejilla `64px | minmax(0,1fr) | 120px | 130px` con «Fecha», «Historial», «Aporte»/«Variación» y «Acumulado»/«Valor» en `rotulo` secundario sobre raya fuerte. Fecha en cifra-xs secundaria (`formatearFechaSinAnio`), etiqueta en cuerpo, monto en cifra-s y acumulado en cifra-s 500, ambos a la derecha. Renglón entre filas. En una meta por apartado no archivada, cada fila es un enlace a `&aporte=<id>` (fondo `hundido` al pasar). Sin filas: «Sin aportes todavía.» en `etiqueta` secundaria.
  - Condiciones: «Cuenta asociada» (`textoCuenta`), «Objetivo» (cifra-s), «Fecha meta» (`textoFechaCondicion`) y «Creada» (`formatearFecha`). Rótulo en `etiqueta` secundaria y valor a la derecha en cuerpo, con renglón entre filas.
  - Debajo de las condiciones, `AccionesMeta`: los botones de `accionesMeta` en fila, 8 px entre ellos, y «Eliminar meta…» como vínculo discreto debajo.

**Móvil (390 px):**

- **Lista** (sin `?meta`): «Metas» en titulo-1 y un botón de icono `+` de 44 px a la derecha (etiqueta «Nueva meta», enlace a `?nueva=1`). Debajo, `textoTotales` corto. Grupos con rótulo sobre raya fuerte. Cada fila, enlace a `?meta=<id>`:
  - nombre (cuerpo 600) y porcentaje (cifra-xs secundaria);
  - avance en cifra-m 500 y «de {objetivo}» a la derecha en `etiqueta` secundaria;
  - `BarraAvance` de 4 px;
  - `IconoCuenta` de 16 px con el nombre de la cuenta y `textoFechaLista`, en `etiqueta` secundaria;
  - en las activas, `textoRitmo` corto en `etiqueta` `texto`.
  - Al pie, «Ver archivadas».
- **Detalle** (con `?meta`): «‹ Metas» (enlace a `/metas`); la cabecera y las cifras del escritorio en una columna; el historial en `minmax(0,1fr) | 96px | 104px` (etiqueta con la fecha debajo en cifra-xs secundaria, monto y acumulado); las condiciones debajo; los botones a todo el ancho, apilados; «Eliminar meta…» debajo.
- Escritorio sin parámetro muestra la primera meta (`activas[0]`, si no `cumplidas[0]`). En móvil esa meta no se ve, pero la página la trae igual.

**Vacío** (`activas` y `cumplidas` vacías): en el lugar de la lista y el detalle, `EstadoVacio` con rótulo «Metas», «Sin metas todavía.», «Aparta parte de una cuenta, o toma una cuenta entera, para llegar a un objetivo.» y la acción «Nueva meta» (`?nueva=1`). La cabecera dice «Sin metas activas.». «Ver archivadas» sigue debajo.

**Panel de meta** (`PanelMeta`, `PanelLateral` `ancho="amplio"`; en móvil, la hoja inferior):

```
NUEVA META / EDITAR META                                  Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre  ______________________________                          CampoSubrayado, máx. 60
MODO
( ) Apartar parte del saldo · varias metas pueden compartir la cuenta     OpcionUnica
( ) Toda la cuenta · el avance es su saldo o su valor de mercado
Cuenta  [🏦 Nubank 2.500.000] [🏦 Bancolombia 980.000] …         FichaCuenta, dos por fila (cuentasAdmitidas)
Objetivo  7.500.000                                   COP       CampoMonto
FECHA META
( ) Sin fecha  ( ) Un día  ( ) Un mes                           CampoFechaMeta: OpcionUnica
    15/12/2026 ____  /  dic 2027 ____                            date / month nativo, campo dependiente
Apartado inicial · opcional   300.000                 COP       CampoMonto (solo alta por apartado)
Desde  [Ya está en Nubank ✓] [Bancolombia] [Nequi] …            FichaCuenta (dependiente: monto > 0)
       Marca dinero que ya está en Nubank. Saldo libre: …        nota
─────────────────────────────────────────────────────────────── pie fijo
[ Crear meta ] / [ Guardar cambios ]
```

- **Modo** primero; cambiarlo vuelve a filtrar las cuentas y descarta la elegida si ya no está. Sin cuentas admitidas: «No hay cuentas para este modo. Crea una de efectivo o banco en Cuentas.» (con «o inversión» en toda la cuenta), con `EnlaceTexto` a `/cuentas?nueva=1`.
- **Cuenta:** `FichaCuenta` con el saldo de `GET /cuentas` (en una inversión, su valor en COP). Ninguna elegida por defecto.
- **Fecha meta** (`CampoFechaMeta`): «Sin fecha» por defecto. «Un día» despliega `<input type="date" min={fechaHoy}>`; «Un mes», `<input type="month" min={mes de fechaHoy}>`. Al cambiar de precisión, el valor se descarta.
- **Apartado inicial** (alta por apartado): `CampoMonto` opcional. Con monto, se despliega «Desde»: primero la ficha «Ya está en {cuenta}» (elegida por defecto; sin transferencia), luego `cuentasOrigen` de la cuenta elegida. Nota según la elección: «Marca dinero que ya está en {Nubank}.» o «Se registra una transferencia de {Bancolombia} a {Nubank}.». Sin cuenta elegida, el bloque espera.
- **Edición:** los mismos campos sin apartado inicial, con los valores de la meta. En una meta por apartado con historial, el modo queda deshabilitado con la nota «Una meta con aportes no cambia de modo.». Con lo apartado > 0 y otra cuenta elegida: «Lo apartado ({1.900.000}) pasa a {Bancolombia}.». «Guardar cambios» deshabilitado si `cambioDesde` es `null`. Una cumplida o archivada no abre la edición: la URL vuelve al detalle.
- **Validación previa** (`validarMeta`): nombre de 1 a 60 tras recortar, cuenta elegida, objetivo y apartado inicial enteros > 0, fecha elegida si la precisión no es «Sin fecha». Mensajes en «Textos literales».
- **Errores de la API:** el `mensaje` bajo su campo (`nombre`, `modo`, `cuentaId`, `objetivo`, `fechaMeta`, `aporteInicial`/`monto` → apartado inicial, `cuentaOrigenId` → «Desde»). En la edición, `SALDO_LIBRE_INSUFICIENTE` (`monto`) va bajo «Cuenta». Sin campo, `MensajeError` al pie. `META_CUMPLIDA` o `META_ARCHIVADA` refrescan la página.
- **Cerrar con cambios:** «¿Descartar los cambios?», como `PanelCuenta`.
- Al guardar, el panel se cierra hacia `/metas?meta=<id>` con el `id` de la respuesta.

**Panel de aporte** (`PanelAporte`, `PanelLateral`):

```
REGISTRAR APORTE · FONDO DE EMERGENCIA                    Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
( ) Aporte · aparta dinero para esta meta                       OpcionUnica (solo apartado, solo al registrar)
( ) Retiro · libera lo apartado
Monto   350.000                                       COP       CampoMonto
Fecha   11/11/2026 ____                                         date nativo, min creadaEl, max fechaHoy
Desde  [Ya está en Nubank ✓] [Bancolombia] [Nequi] …            FichaCuenta (solo aporte)
       Marca dinero que ya está en Nubank. Saldo libre: 600.000. nota
Motivo · opcional  ________________________                     CampoSubrayado, máx. 80
─────────────────────────────────────────────────────────────── pie fijo
[ Registrar aporte 350.000 ] / [ Registrar retiro 100.000 ] / [ Guardar cambios ]
```

- `&registrar=aporte` abre con «Aporte» elegido; `&registrar=retiro`, con «Retiro». En una cumplida, «Aporte» queda deshabilitado (no admite aportes).
- **Por apartado:** «Desde» lleva primero «Ya está en {cuenta}» (elegida por defecto) y luego `cuentasOrigen`. Nota: «Marca dinero que ya está en {Nubank}. Saldo libre: {600.000}.» (`apartados.libre`) o «Se registra una transferencia de {Bancolombia} a {Nubank}.».
- **Retiro:** sin «Desde». Nota: «Liberar no registra un gasto. Si lo gastaste, regístralo aparte en Movimientos.». Debajo, «Apartado hoy: {1.900.000}» (`apartados.apartadoAqui`).
- **Toda la cuenta (efectivo o banco):** sin tipo ni «Ya está»: «Desde» es obligatorio, sin cuenta elegida por defecto. Título «Registrar aporte · {meta}». Nota: «Se registra una transferencia de {Bancolombia} a {Nubank}.».
- **Fecha:** por defecto `fechaHoy`; `min` `creadaEl`, `max` `fechaHoy`.
- **Edición** (`&aporte=<id>`): título «Editar aporte» o «Editar retiro»; sin selector de tipo; el origen fijo en texto («Desde {Bancolombia}» o «Ya estaba en {Nubank}»), con la nota «Con origen, el cambio también corrige su transferencia.» si lo tiene. «Guardar cambios» deshabilitado sin cambios. Debajo, «Eliminar aporte…» / «Eliminar retiro…» abre `BloqueEliminar`:
  - con origen: «También se borra su transferencia de {Bancolombia} a {Nubank}. No se puede deshacer.»;
  - aporte sin origen: «Lo apartado baja en {150.000}. No se puede deshacer.»;
  - retiro: «Lo apartado vuelve a subir en {100.000}. No se puede deshacer.».
- **Validación previa** (`validarAporte`): monto entero > 0, fecha elegida, origen elegido en toda la cuenta, motivo de hasta 80.
- **Errores de la API:** bajo su campo (`monto`, `fecha`, `cuentaOrigenId` → «Desde», `motivo`, `tipo` → selector). Sin campo (`EFECTIVO_INSUFICIENTE`, `META_DE_INVERSION`), `MensajeError` al pie. `META_CUMPLIDA` y `META_ARCHIVADA` muestran su `mensaje` y refrescan. `APORTE_NO_ENCONTRADO` cierra el panel y refresca.
- **Cerrar con cambios:** «¿Descartar los cambios?».
- Al guardar o borrar, el panel se cierra hacia `/metas?meta=<id>`.

**Acciones en el detalle** (`AccionesMeta`, cliente):

- «Registrar aporte» y «Registrar retiro»: enlaces a `&registrar=aporte` y `&registrar=retiro`. «Editar meta»: enlace a `&editar=1`. «Ver inversiones»: enlace a `/inversiones?inversion=<cuenta.id>` (`rutaInversion`).
- «Archivar»: envía `POST /metas/:id/archivar` sin confirmación (se deshace con «Restaurar»). El botón se deshabilita y dice «Archivando…». Al responder, navega a `/metas`. `APARTADO_NO_CERO` o `META_NO_CUMPLIDA` muestran su `mensaje` bajo los botones y refrescan.
- «Eliminar meta…» abre `BloqueEliminar` en su lugar, con «Eliminar {Fondo de emergencia}» y el detalle:
  - por apartado: «Se borra con sus aportes y retiros, y lo apartado queda libre. Las transferencias siguen en Movimientos. No se puede deshacer.»;
  - toda la cuenta: «Se borra la meta; la cuenta y sus movimientos no cambian. No se puede deshacer.».
  - Al confirmar, `DELETE /metas/:id` y navega a `/metas` (desde archivadas, a `/metas/archivadas`).
- «Restaurar» (archivadas): `POST /metas/:id/restaurar`, «Restaurando…», y navega a `/metas?meta=<id>`. `CUENTA_ARCHIVADA` y `CUENTA_CON_META_EXCLUSIVA` muestran su `mensaje` bajo los botones.

**Archivadas** (`/metas/archivadas`, maestro-detalle con `?meta=<id>`):

- «‹ Metas» (enlace a `/metas`) y «Metas archivadas» en titulo-1.
- Lista sin grupos con las filas de `ListaMetas` en su variante cumplida, en el orden de la API. La fecha es `textoFechaLista` con año.
- Detalle de solo lectura con `DetalleMeta`: sin ritmo de hoy (la cumplida dice «Llegaste al objetivo el …»), historial sin enlaces y las acciones «Restaurar» y «Eliminar meta…».
- Escritorio sin parámetro muestra la primera; móvil, solo la lista, y con `?meta` solo el detalle con «‹ Archivadas».
- Vacío: `EstadoVacio` con rótulo «Archivadas», «Sin metas archivadas.» y «Al archivar una meta cumplida, aparece aquí.», sin acción.

### Comportamiento

- **Lecturas:** `/metas` pide `GET /metas` y, si hay meta elegida o primera, `GET /metas/:id`, en paralelo cuando se puede. Los paneles de meta y de aporte piden además `GET /cuentas`; si falla, el panel muestra «No pudimos cargar tus cuentas.» y deshabilita el botón.
- **Id desconocido:** un `?meta` que no está en `activas` ni en `cumplidas` vuelve a `/metas` (en archivadas, a `/metas/archivadas`). `META_NO_ENCONTRADA` al leer el detalle, igual. Un `&aporte` que no está en el historial vuelve a `/metas?meta=<id>`.
- **Paneles imposibles:** `&editar=1` en una cumplida, `&registrar=aporte` en una cumplida o sobre inversión, `&registrar=retiro` en toda la cuenta, `&aporte` en toda la cuenta y cualquier panel en una archivada vuelven a `/metas?meta=<id>`.
- **Acciones:** cada una deshabilita su botón mientras corre. Nada es optimista: todas las cifras salen de la respuesta tras revalidar.
- **Revalidación:** `RUTAS_METAS = ["/metas", "/metas/archivadas"]`. Editar meta, archivar, restaurar y eliminar revalidan `RUTAS_METAS`. Crear meta y crear, editar o borrar un aporte revalidan `RUTAS_METAS` y `RUTAS_AFECTADAS`. `"/metas"` entra en `RUTAS_AFECTADAS` (captura, movimientos, recurrentes, avisos al confirmar), en las rutas de `cuentas/acciones.ts`, en `RUTAS_DEUDAS` y en `RUTAS_INVERSIONES`.

### Menú

- `entradas.ts`: «Metas» → `/metas`. Se actualiza el comentario de destinos habilitados.
- Menú lateral y hoja «Más» la muestran habilitada y activa en `/metas` y `/metas/archivadas` (`estaActiva`).

### Textos literales

| Caso | Texto |
|---|---|
| Título | «Metas de ahorro» (escritorio) · «Metas» (móvil) · «Metas archivadas» |
| Cabecera | textos de «Cabecera» · «Nueva meta» |
| Grupos | «Activas» · «Cumplidas» |
| Lista | textos de «Fechas» · «{600.000} de {1.800.000}» · «Ver archivadas» |
| Detalle | `textoCuenta` · «de {objetivo}» · «Faltan {X}» · textos de «Ritmo» y «Notas» · «Sin aportes todavía.» |
| Historial | «Fecha» · «Historial» · «Aporte» · «Variación» · «Acumulado» · «Valor» · etiquetas de «Historial» |
| Condiciones | «Cuenta asociada» · «Objetivo» · «Fecha meta» · «Creada» |
| Acciones | «Registrar aporte» · «Ver inversiones» · «Editar meta» · «Registrar retiro» · «Archivar» · «Archivando…» · «Restaurar» · «Restaurando…» · «Eliminar meta…» · «Para archivarla, retira lo apartado.» |
| Eliminar | «Eliminar {nombre}» · detalles de «Acciones en el detalle» y del panel de aporte · «Eliminar aporte…» · «Eliminar retiro…» |
| Panel de meta | «Nueva meta» · «Editar meta» · «Nombre» · «Modo» · «Apartar parte del saldo» · «Varias metas pueden compartir la cuenta.» · «Toda la cuenta» · «El avance es su saldo, o su valor de mercado si es una inversión.» · «Cuenta» · «Objetivo» · «Fecha meta» · «Sin fecha» · «Un día» · «Un mes» · «Apartado inicial · opcional» · «Desde» · «Ya está en {Nubank}» · «Crear meta» · «Guardar cambios» · «Una meta con aportes no cambia de modo.» · «Lo apartado ({1.900.000}) pasa a {Bancolombia}.» · «No hay cuentas para este modo. Crea una de efectivo o banco en Cuentas.» |
| Panel de aporte | «Registrar aporte · {meta}» · «Registrar retiro · {meta}» · «Editar aporte» · «Editar retiro» · «Aporte» · «Aparta dinero para esta meta.» · «Retiro» · «Libera lo apartado.» · «Monto» · «Fecha» · «Desde» · «Motivo · opcional» · «Registrar aporte {350.000}» · «Registrar retiro {100.000}» · «Apartado hoy: {X}» · «Desde {Bancolombia}» · «Ya estaba en {Nubank}» · notas del panel |
| Notas de origen | «Marca dinero que ya está en {Nubank}. Saldo libre: {600.000}.» · «Se registra una transferencia de {Bancolombia} a {Nubank}.» · «Liberar no registra un gasto. Si lo gastaste, regístralo aparte en Movimientos.» · «Con origen, el cambio también corrige su transferencia.» |
| Validación | «Escribe un nombre de 1 a 60 caracteres.» · «Elige la cuenta.» · «Escribe un valor en pesos, sin decimales.» · «Elige la fecha meta.» · «Elige la fecha.» · «Elige la cuenta de origen.» · «El motivo tiene de 1 a 80 caracteres.» |
| Cerrar | «¿Descartar los cambios?» |
| Vacío | «Sin metas todavía.» · «Aparta parte de una cuenta, o toma una cuenta entera, para llegar a un objetivo.» · «Sin metas archivadas.» · «Al archivar una meta cumplida, aparece aquí.» |
| Error | «No pudimos cargar tus metas.» + «Reintentar» · «No pudimos cargar tus cuentas.» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Menú | N-01, N-02, N-04 | Ya cubierto (SPEC 10, SPEC 11, SPEC 05) |
| Menú | N-03, N-64 | `entradas.ts` → `/metas`; «+» móvil → `?nueva=1` |
| Cabecera | N-05, N-06, N-59 | `MetasDto.totales` (`incompleto`) → `textoTotales` |
| Cabecera | N-07 | `?nueva=1` → `POST /metas` |
| Lista | N-08, N-61 | `activas`, `cumplidas`; grupos vacíos fuera; `EstadoVacio` |
| Lista | N-09 | Orden de la API |
| Lista | N-10 a N-15, N-33 | `nombre`, `avance`, `objetivo`, `porcentaje`, `fechaMeta`, `cumplidaEl`, `creadaEl` → `textoPorcentaje`, `anchoBarra`, `textoFechaLista`, `textoFechaCondicion` |
| Lista | N-16 | `?meta=<id>` → `GET /metas/:id` |
| Detalle | N-17, N-62 | `cuenta` (`tipo` → `IconoCuenta`), `modo` → `textoCuenta` |
| Detalle | N-18 | `falta` → `textoFalta` |
| Detalle | N-19 a N-21, N-63 | `ritmo` → `textoRitmo` largo y corto |
| Detalle | N-22, N-23 | `cumplidaEl`, `uso`, `avance` de la cumplida → `textoRitmo` |
| Detalle | N-24, N-25 | `MetaDetalleDto.apartados` → `notaApartado`, `avisoExcedido` |
| Detalle | N-26, N-42 | `MetaDetalleDto.inversion` → `notaInversion`; `cuenta.id` → `/inversiones?inversion=<id>` |
| Detalle | N-27 a N-29 | `FilaAporteDto` → `etiquetaAporte`, `montoFila` |
| Detalle | N-30 a N-32 | `FilaValorDto` → `etiquetaValor`, `montoFila` |
| Panel de aporte | N-34 a N-39, N-41 | `POST /metas/:id/aportes`; `SALDO_LIBRE_INSUFICIENTE`, `MONTO_INVALIDO`, `APARTADO_INSUFICIENTE`, `ORIGEN_REQUERIDO` |
| Panel de aporte | N-40, N-46 | `PUT` y `DELETE /metas/:id/aportes/:aporteId`; historial en la base |
| Detalle | N-43 | `cumplidaEl` → `accionesMeta` |
| Panel de meta | N-44, N-45 | `PATCH /metas/:id`; `SALDO_LIBRE_INSUFICIENTE`, `META_CON_APORTES` |
| Detalle | N-47 | `DELETE /metas/:id` con `BloqueEliminar` |
| Detalle / Archivadas | N-48, N-49, N-65 | `POST /metas/:id/archivar`, `GET /metas/archivadas`, `POST /metas/:id/restaurar` |
| Panel de meta | N-50 a N-54, N-56 | `POST /metas` y sus errores; `cuentasAdmitidas`, `CampoFechaMeta` |
| Panel de meta | N-55 | `aporteInicial`; `FilaAporteDto.inicial` → «Apartado inicial» |
| Detalle | N-57, N-58 | Reglas de la API; la web muestra |
| Cuentas | N-60 | `CUENTA_CON_METAS` de `POST /cuentas/:id/archivar` y `DELETE /cuentas/:id`: el panel de cuenta muestra su `mensaje` |
| Todas | — | `loading.tsx`, `error.tsx`; `formatearDinero`, `formatearFecha`, `formatearFechaSinAnio`, `formatearMesCorto`, `formatearNombreMes`, `formatearTasa` |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/metas/
  page.tsx                                         # nuevo: GET /metas, ?meta, ?nueva, &editar, &registrar, &aporte
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
  acciones.ts                                      # nuevo: crear, editar, eliminar, archivar, restaurar, registrarAporte, editarAporte, eliminarAporte
  archivadas/
    page.tsx                                       # nuevo: GET /metas/archivadas, ?meta
    loading.tsx                                    # nuevo
    error.tsx                                      # nuevo
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/metas"
src/app/(aplicacion)/cuentas/acciones.ts           # rutas + "/metas"
src/app/(aplicacion)/deudas/acciones.ts            # RUTAS_DEUDAS + "/metas"
src/app/(aplicacion)/inversiones/acciones.ts       # RUTAS_INVERSIONES + "/metas"
src/app/estilos/page.tsx                           # + muestras de metas
src/app/estilos/muestras-metas.tsx                 # nuevo, cliente: lista, detalle por estado, barra, paneles, fecha meta
src/components/metas/
  rutas.ts                                         # nuevo: RUTA_METAS, rutaMeta, rutaNueva, rutaEditar, rutaRegistrar, rutaAporte
  lista-metas.tsx                                  # nuevo: grupos y filas (escritorio y móvil)
  barra-avance.tsx                                 # nuevo
  detalle-meta.tsx                                 # nuevo: cabecera, cifras, ritmo, notas, historial, condiciones
  acciones-meta.tsx                                # nuevo, cliente: botones, archivar, restaurar, eliminar en línea
  panel-meta.tsx                                   # nuevo, cliente: alta y edición
  panel-aporte.tsx                                 # nuevo, cliente: registrar, editar y borrar aporte o retiro
  campo-fecha-meta.tsx                             # nuevo, cliente: precisión + date / month
src/components/menu/entradas.ts                    # Metas → /metas
src/domain/meta/presentacion.ts                    # nuevo (+ presentacion.test.ts)
src/domain/meta/formulario.ts                      # nuevo (+ formulario.test.ts)
src/services/metas.ts                              # nuevo
src/repositories/api/metas.ts                      # nuevo (+ metas.test.ts)
DESIGN.md                                          # + lista, detalle, barra, acciones, paneles, fecha meta
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos, y reciben las server actions por prop. Nunca importan `repositories/`. Las cuentas del formulario salen de `services/cuentas.ts`.

## Plan de implementación

1. `domain/meta/presentacion.ts` + pruebas: `textoPorcentaje` (2533, 10000, 12000, null), `anchoBarra` (tope, negativo, null), `textoFechaLista` y `textoFechaCondicion` (día del año, día de otro año, mes, sin fecha, cumplida, archivada), `textoCuenta` (dos modos), `textoFalta`, `mesesPromedio` (1, 6, más de 6), `textoRitmo` (cada fila de «Ritmo», largo y corto, plurales de 1), `notaApartado` (una otra, varias, con libre, sin otras), `avisoExcedido`, `notaInversion` (USD, COP, sin TRM), `etiquetaAporte` y `etiquetaValor` (cada fila de «Historial», con motivo), `montoFila`, `textoTotales` (completo, incompleto, sin activas), `accionesMeta` (cada fila de «Acciones»).
2. `domain/meta/formulario.ts` + pruebas: `precisionDe` y `fechaMetaDesde` (ida y vuelta), `cuentasAdmitidas` (cada modo, tarjeta fuera, exclusión por meta de toda la cuenta, la propia en edición), `cuentasOrigen` (USD y la de la meta fuera), `validarMeta` (cada mensaje, alta con apartado inicial y origen), `cambioDesde` (sin cambios, quitar fecha, cambiar cuenta), `validarAporte` (cada mensaje, origen obligatorio en toda la cuenta).
3. `repositories/api/metas.ts` + prueba con el JSON de `docs/api/metas.md` (string → `bigint`, TRM, ritmo de los tres tipos, historial de los dos modos, `avance: null`) y con las rutas y cuerpos de las once llamadas. `services/metas.ts`: `401` → `/login`; lecturas; escrituras con `Resultado` que nunca lanza al cliente.
4. Menú: «Metas» en `entradas.ts`. `"/metas"` en `RUTAS_AFECTADAS`, en las rutas de cuentas, en `RUTAS_DEUDAS` y en `RUTAS_INVERSIONES`.
5. Ruta de solo lectura `/metas`: `page.tsx`, `loading.tsx`, `error.tsx`, `rutas.ts`, `BarraAvance`, `ListaMetas`, `DetalleMeta` sin acciones ni enlaces del historial, estado vacío y «Ver archivadas» (aún sin destino). Distribución en xl, entre md y xl y en móvil con «‹ Metas». Al terminar, la pantalla se ve con datos reales.
6. Alta: `CampoFechaMeta`, `PanelMeta` en modo alta (con apartado inicial y origen), `crear` en `acciones.ts`, «Nueva meta» en la cabecera, el «+» móvil y la acción del vacío.
7. Edición: `PanelMeta` en modo edición con `cambioDesde`, modo bloqueado con historial, nota de cambio de cuenta y `editar` en `acciones.ts`. `AccionesMeta` con «Editar meta».
8. Aportes y retiros: `PanelAporte` al registrar (apartado con «Ya está», toda la cuenta con origen obligatorio, retiro), `registrarAporte` en `acciones.ts`. `AccionesMeta` con «Registrar aporte», «Registrar retiro» y «Ver inversiones».
9. Corregir un aporte: filas del historial como enlaces, `PanelAporte` en modo edición con `BloqueEliminar`, `editarAporte` y `eliminarAporte` en `acciones.ts`.
10. Eliminar y archivar: «Eliminar meta…» con `BloqueEliminar` en `AccionesMeta`, «Archivar» con su nota, `eliminar` y `archivar` en `acciones.ts`.
11. Archivadas: `/metas/archivadas` con `page.tsx`, `loading.tsx`, `error.tsx`, lista, detalle de solo lectura, vacío, «Restaurar» y «Eliminar meta…» (`restaurar` en `acciones.ts`). «Ver archivadas» enlaza.
12. `/estilos`: fila activa, cumplida y elegida; barra de 4 y 8 px; detalle por apartado con nota y con excedido, de toda la cuenta sobre inversión USD y sin TRM, cumplida con uso y archivada; panel de meta (alta y edición); panel de aporte (aporte, retiro, edición con borrar); `CampoFechaMeta` en sus tres precisiones; vacío; en claro y oscuro.
13. `DESIGN.md`: lista de metas, detalle de meta, barra de avance, acciones de meta, paneles de meta y de aporte, campo de fecha meta.

## Criterios de aceptación

Datos de prueba: los del diseño con `fechaHoy` 2026-11-11 y TRM 4.120,00. Nubank (banco, 2.500.000) con Viaje a Cartagena (apartado, objetivo 1.800.000, 15 dic 2026, creada 20 sep) y Fondo de emergencia (apartado, 7.500.000, sin fecha, creada 15 jun, historial del diseño). eToro (inversión USD, US$ 7.750,00) con Cuota inicial apartamento (toda la cuenta, 45.000.000, dic 2027, creada 31 jul). Bancolombia con Arreglo de la moto (apartado, 850.000, cumplida el 12 sep, con un retiro de 850.000 el 14 sep con motivo «taller»).

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] «Metas» está habilitado y activo en el menú lateral y en la hoja «Más», y lleva a `/metas`.
- [ ] La cabecera dice «En metas activas: 34.430.000 de 54.300.000».
- [ ] «Activas» lista Viaje a Cartagena, Cuota inicial apartamento y Fondo de emergencia, en ese orden. «Cumplidas» lista Arreglo de la moto con nombre y barra en secundario.
- [ ] Viaje a Cartagena dice «33,3 %», «600.000 de 1.800.000» y «Para el 15 dic». Fondo dice «25,3 %» y «Sin fecha». Cuota dice «70,9 %» y «Para dic 2027». Moto dice «100 %» y «Cumplida el 12 sep».
- [ ] En 1440 px, sin parámetro, el detalle es Viaje a Cartagena: «Nubank · apartado para esta meta», «600.000», «de 1.800.000», «Faltan 1.200.000», «Para llegar el 15 dic faltan 1.200.000 en 34 días.» y «Nubank tiene 2.500.000: 600.000 apartados aquí y 1.900.000 para Fondo de emergencia.».
- [ ] Fondo de emergencia dice «En los últimos 6 meses aportaste en promedio 316.667 al mes. A ese ritmo llegarías alrededor de mayo de 2028.» y su historial lista «Retiro · arreglo de la nevera» con «−100.000» y acumulado «1.550.000».
- [ ] Cuota inicial dice «eToro · toda la cuenta», «Para dic 2027 faltan 13.070.000: unos 1.005.385 al mes durante 13 meses.», la nota «El avance sigue el valor de mercado de eToro: US$ 7.750,00 a TRM 4.120,00. Sube y baja con el mercado y con el dólar.», columnas «Variación» y «Valor», la primera fila sin variación y «Valor hoy · TRM 4.120,00». Sus acciones son «Ver inversiones» y «Editar meta»; «Ver inversiones» abre eToro en `/inversiones`.
- [ ] Arreglo de la moto dice «Llegaste al objetivo el 12 sep. El dinero se usó el 14 sep · taller.», «850.000», «Cumplida el 12 sep» y «Fecha meta Cumplida · 12 sep». No tiene «Registrar aporte» ni «Editar meta»; tiene «Archivar» y «Eliminar meta…».
- [ ] En 390 px, la lista muestra cada meta con su cuenta e icono y, en las activas, el ritmo corto («Faltan 1.200.000 en 34 días.», «Faltan 13.070.000 · unos 1.005.385 al mes.», «A tu ritmo actual, alrededor de mayo de 2028.»). Tocar una abre solo su detalle con «‹ Metas». Sin scroll horizontal.
- [ ] «Nueva meta» con «Apartar parte del saldo» ofrece Nubank y Bancolombia, no eToro ni tarjetas. Con «Toda la cuenta» no ofrece Nubank, Bancolombia ni eToro (todas tienen metas).
- [ ] Crear «Celular» por apartado en Nubank con objetivo 1.000.000, «Un mes» dic 2026 y apartado inicial 300.000 con «Ya está en Nubank» falla con «La cuenta no tiene saldo libre suficiente.» bajo el apartado inicial (libre 0). Con origen Bancolombia se crea, se abre su detalle con «Apartado inicial desde Bancolombia» y la transferencia aparece en `/movimientos`.
- [ ] Un nombre vacío muestra «Escribe un nombre de 1 a 60 caracteres.» y «Un día» sin fecha muestra «Elige la fecha meta.», sin enviar.
- [ ] «Editar meta» en Fondo deja el modo deshabilitado con «Una meta con aportes no cambia de modo.». Quitar la fecha o cambiar el objetivo y guardar se refleja en el detalle; «Guardar cambios» está deshabilitado sin cambios.
- [ ] «Registrar aporte» en Viaje abre el panel con «Aporte» elegido y «Ya está en Nubank» elegida. Registrar 100.000 sin origen falla con «La cuenta no tiene saldo libre suficiente.». Con origen Bancolombia, el historial suma «Aporte desde Bancolombia» y el porcentaje sube a 38,8 %.
- [ ] Registrar un retiro de 2.000.000 en Fondo falla con «Lo apartado no alcanza para ese retiro.». Uno de 100.000 con motivo baja el avance y la nota de Nubank cambia.
- [ ] Tocar una fila del historial de Fondo abre «Editar aporte» con sus valores. Cambiar el monto y guardar actualiza el acumulado. «Eliminar aporte…» de un aporte con origen dice «También se borra su transferencia de Bancolombia a Nubank. No se puede deshacer.» y, al confirmar, la transferencia desaparece de `/movimientos`.
- [ ] «Archivar» en Arreglo de la moto la saca de `/metas` y la muestra en `/metas/archivadas`. «Restaurar» la devuelve a «Cumplidas».
- [ ] Una cumplida por apartado con lo apartado > 0 muestra «Registrar retiro» y «Para archivarla, retira lo apartado.», sin «Archivar».
- [ ] «Eliminar meta…» en Viaje muestra el bloque con su detalle; al confirmar, la meta desaparece y la nota de Fondo ya no la menciona. Sus transferencias siguen en `/movimientos`.
- [ ] Archivar Nubank desde Cuentas con metas muestra el `mensaje` de `CUENTA_CON_METAS`.
- [ ] Sin metas, `/metas` muestra «Sin metas todavía.» con «Nueva meta» y «Ver archivadas».
- [ ] Con la API apagada, `/metas` muestra «No pudimos cargar tus metas.» y «Reintentar». Con la API apagada después de cargar, registrar un aporte muestra «No pudimos conectar. Intenta de nuevo.» al pie del panel.
- [ ] Registrar un gasto en Nubank desde la captura actualiza la nota de apartado de Fondo sin recargar a mano.
- [ ] `/metas?meta=<id-inexistente>` vuelve a `/metas`; `&editar=1` en una cumplida vuelve a su detalle.
- [ ] `/estilos` muestra lista, barra, detalle en sus estados, paneles, campo de fecha meta y vacío en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`.
- [ ] La web no calcula avance, falta, porcentaje, ritmo, cumplimiento, saldo libre ni acumulados: salen de la API. Solo arma frases, filtra cuentas para el formulario y decide qué acciones mostrar.

## Decisiones

- **Sí:** un solo spec para la pantalla, sus paneles, eliminar, archivar y archivadas, por decisión del autor, como SPEC 09. **No:** separar edición, archivo y archivadas en otro spec.
- **Sí:** ruta `/metas` con `?meta=<id>` y paneles por parámetro, como Deudas e Inversiones. **No:** ruta dinámica `/metas/[id]`.
- **Sí:** escritorio sin parámetro muestra la primera meta. **No:** la meta elegida del diseño (Fondo), que es un estado de muestra.
- **Sí:** «Registrar aporte» abre un panel con «Aporte» / «Retiro» en una meta por apartado. **No:** un botón «Registrar retiro» en las activas, que no está dibujado.
- **Sí:** en una cumplida por apartado, «Registrar retiro» y «Archivar» según lo apartado, porque archivar exige lo apartado en 0. **No:** dejar la cumplida sin acciones, como el diseño, que la vuelve inarchivable.
- **Sí:** «Eliminar meta…» como vínculo discreto con `BloqueEliminar` en línea en todos los estados. **No:** eliminar dentro del panel de edición, que no se abre en una cumplida.
- **Sí:** archivar sin confirmación; «Restaurar» lo deshace. **No:** `BloqueEliminar` para archivar.
- **Sí:** archivadas en `/metas/archivadas` con «Ver archivadas», como Cuentas. **No:** `?archivadas=1` ni un grupo en la lista.
- **Sí:** cada fila del historial abre el panel de aporte en modo edición, con borrar. **No:** mandar las filas con origen a `/movimientos`: dos caminos para lo mismo.
- **Sí:** «Ya está en {cuenta}» elegida por defecto en el origen: nada se transfiere si el usuario no lo pide (RN-16). **No:** ninguna elegida, que agrega un toque al caso más común.
- **Sí:** en toda la cuenta, el origen es obligatorio y sin elección por defecto, como exige la API (`ORIGEN_REQUERIDO`).
- **Sí:** modo primero en el alta, con las cuentas filtradas por `cuentasAdmitidas`. **No:** cuenta primero.
- **Sí:** filtrar en el cliente las cuentas que una meta excluye, con `GET /metas`. La API valida igual. **No:** mostrar todas y esperar `CUENTA_CON_META_EXCLUSIVA`.
- **Sí:** fecha meta con `OpcionUnica` «Sin fecha» / «Un día» / «Un mes» e input nativo `date` o `month`. **No:** una casilla «solo el mes», que pierde el día elegido.
- **Sí:** en la edición de una meta por apartado con historial, el modo deshabilitado con su nota. En toda la cuenta la web no sabe si hubo aportes: decide la API (`META_CON_APORTES` bajo «Modo»).
- **Sí:** el retiro avisa que no registra un gasto (RN-16, choque N-38). **No:** registrar el gasto desde el retiro.
- **Sí:** montos del historial en tinta, con signo. **No:** verde o terracota: apartar o liberar no cambia el patrimonio.
- **Sí:** el uso de una cumplida como «El dinero se usó el {14 sep} · {motivo}». **No:** «en el {motivo}», que depende de cómo se escribió el motivo.
- **Sí:** «En los últimos {N} meses» del promedio con `mesesPromedio` (creación a hoy, topado en 6), como define el contrato. **No:** «6 meses» fijo, falso en una meta reciente.
- **Sí:** TRM con dos decimales («TRM 4.120,00», REGLAS §6). **No:** el «TRM 4.120» del diseño.
- **Sí:** avance del detalle en cifra-l, objetivo en cifra-m, nombre en titulo-2, avance móvil en cifra-m y barras de 4 y 8 px. **No:** los 48, 24 y 20 px y las barras de 6 px del diseño, que no son medidas del sistema.
- **Sí:** lista y detalle en `400px | minmax(0,1fr)` con 48 px desde xl, como Deudas. **No:** los 420 y 56 px del diseño.
- **Sí:** `textoCuenta` siempre con el modo. **No:** «Bancolombia» solo, como la cumplida del diseño.
- **Sí:** sin estado optimista: cada acción espera la respuesta y la página se revalida. Todas las cifras dependen de cálculos de la API.
- **Sí:** `"/metas"` en las rutas que revalidan captura, movimientos, cuentas, deudas e inversiones: todas cambian saldos o valores de los que sale el avance.
- **Sí:** `MOVIMIENTO_DE_META` en `/movimientos` se muestra con el `mensaje` de la API. **No:** bloquear el tipo con una lectura de metas, como se hizo con los préstamos (fuera de alcance).
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble toque en «Registrar aporte», «Archivar» o «Eliminar» | El botón se deshabilita mientras la acción corre. Si el estado ya cambió, la API responde `META_CUMPLIDA`, `META_ARCHIVADA` o `META_NO_ENCONTRADA` y la página se refresca. |
| El saldo libre del panel está viejo (gasto en otra pestaña) | La nota es informativa; la API valida con `SALDO_LIBRE_INSUFICIENTE` y el `mensaje` va bajo el monto. |
| El filtro de cuentas del alta queda viejo | La API rechaza con `CUENTA_CON_META_EXCLUSIVA` o `CUENTA_NO_ADMITIDA` bajo «Cuenta». |
| `fechaHoy` de la API y el día del navegador difieren (zona) | Todo texto relativo, el `min` y el `max` de las fechas usan `fechaHoy` de la respuesta. |
| Inversión USD sin TRM | `avance: null` muestra «—», el ritmo dice «Sin TRM de hoy…» y la cabecera avisa que no suma. |
| Borrar un aporte con origen borra dinero registrado | `BloqueEliminar` lo dice antes de confirmar (RN-13: queda en el historial de la API). |
| Panel de meta largo en la hoja móvil | `PanelLateral` desplaza el contenido con el pie fijo. Se verifica en 390 px. |
| `GET /metas/:id` de una inversión refresca precios y tarda | `loading.tsx` cubre la carga; el detalle se pide en paralelo con la lista cuando hay `?meta`. |

## Lo que **no** entra en este spec

- TRM, avisos y captura rápida (ya cubiertos).
- Aportes sobre inversión, origen en USD y objetivo en otra moneda.
- Avisos de metas, metas en el resumen y saldo libre en Cuentas.
- Historial de cambios de una meta.
- Bloqueo del tipo de la transferencia de un aporte en `/movimientos` y enlace del historial a esa transferencia.
- «Deshacer» tras cualquier acción de metas.

Cada uno, si llega, va en su propio spec.
