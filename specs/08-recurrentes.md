# SPEC 08 — Recurrentes

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, Tino-API SPEC 07
> **Fecha:** 2026-11-21
> **Objetivo:** Que el usuario gestione en `/recurrentes` sus plantillas de pagos e ingresos que se repiten y resuelva la bandeja por confirmar (confirmar, ajustar, omitir y deshacer), viendo lo comprometido del mes, con todo calculado por la API.

## Por qué existe este spec

Es la primera pantalla con ocurrencias, que todavía no son movimientos: la bandeja no toca saldos hasta que el usuario confirma (RN-10). Fija estos patrones:

- **Acciones sobre una fila sin abrir panel.** Confirmar, ajustar el importe en la misma fila y omitir, con un aviso de 5 s y «Deshacer». Deshacer una confirmación reutiliza `DELETE /movimientos/:id`.
- **Un formulario sin diseño propio**, armado con piezas que ya existen (captura y cuentas), en un panel abierto por URL.
- **Una escala de presentación sobre montos** (la barra del comprometido), calculada en `domain/` con `bigint`, como la gráfica de SPEC 07. Ninguna cifra mostrada sale de ella.

Diseño: `referencias/export-recurrentes/` (`Recurrentes.dc.html`, estados «normal» y «ajuste»; `Recurrentes Lienzo.dc.html`). El formulario de plantilla no está dibujado.
Inventario: `../Tino-API/specs/necesidades/recurrentes.md`.
Contrato: `../Tino-API/docs/api/recurrentes.md` (Tino-API SPEC 07); `movimientos.md` para deshacer.

## Alcance

**Entra:**

- Ruta `/recurrentes` con «Recurrentes» habilitado en el menú lateral y en la hoja «Más».
- **Bandeja «Por confirmar»** con contador: vencimiento, texto relativo («hoy», «mañana», «en 3 días», «vencido ayer», «vencido hace 3 días»), concepto, categoría · cuenta, importe con el sentido de su tipo, «≈» y «fijo»/«estimado».
- **Confirmar** con el importe mostrado, **Ajustar** el importe en la fila (con «Último mes: …») y **Omitir**. Tras cada acción, un aviso de 5 s con «Deshacer». La bandeja vacía muestra «Nada por confirmar.».
- **Comprometido en {mes}:** total, barra pagado / por confirmar / programado, las tres filas con su número de pagos e «Ingreso esperado» (uno por línea).
- **Lista de plantillas** con contador: concepto, periodicidad, vencimiento, cuenta, categoría, importe y estado en el mes. También «Próximo …» si no vence en el mes y «Pausada desde …».
- **Panel de plantilla** por URL: `?plantilla=nueva` (alta) y `?plantilla=<id>` (edición, pausar o reanudar, eliminar).
- «Nueva plantilla» en la cabecera (escritorio) y al pie de la lista (móvil).
- Estado vacío sin plantillas. Carga y error de `/recurrentes`.
- Revalidación: confirmar o deshacer revalida `/recurrentes`, `/movimientos`, `/cuentas` y `/resumen`. Editar o borrar movimientos y cambiar cuentas revalida `/recurrentes`.
- Componentes nuevos con muestra en `/estilos` y entrada en `DESIGN.md`: `BandejaRecurrentes`, `ComprometidoMes`, `ListaPlantillas`, `PanelPlantilla`.

**Fuera de alcance (specs futuros):**

- TRM en el menú, contador de avisos y entradas a Deudas, Inversiones, Metas y Avisos (N-01, N-02, N-03).
- Abonos recurrentes a deudas con personas (N-78) y plantillas en USD (N-79).
- Confirmar una ocurrencia programada o cambiar su fecha al confirmar.
- Dividir la categoría de una plantilla.
- Historial de cambios de una plantilla.
- Comprometido de otros meses.
- Contador de la bandeja en el menú.
- Avisos o notificaciones de vencimiento.
- Deshacer una pausa o un borrado de plantilla.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume los ocho endpoints de `docs/api/recurrentes.md`. Para cargar el formulario consume `GET /captura` y `GET /cuentas` (con `cargar()` de `services/captura.ts`, SPEC 05), y para deshacer una confirmación, `DELETE /movimientos/:id`.

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/recurrentes.ts`: `Ref`, `EstadoOcurrencia`, `Periodicidad`, `OcurrenciaDto`, `RecurrenteDto`, `GrupoDto`, `RecurrentesDto` y `RecurrenteCuerpo`, tomados de `docs/api/recurrentes.md`. Montos como `string` en el borde y como `bigint` desde el repositorio hacia dentro. `confirmar` devuelve `Movimiento` con `aMovimiento` de `movimientos.ts`.

### Modelo de la web

```ts
type Ocurrencia = {
  recurrenteId: string; vencimiento: string; estado: EstadoOcurrencia;
  monto: bigint; estimado: boolean; movimientoId: string | null;
};

type Recurrente = {
  id: string; tipo: TipoMovimiento; concepto: string;
  monto: bigint; variable: boolean;
  periodicidad: Periodicidad; primerVencimiento: string; ultimoDia: boolean;
  cuentaOrigen: Ref | null; cuentaDestino: Ref | null; categoria: Ref | null;
  pausada: boolean; pausadaDesde: string | null;
  ultimoConfirmado: { monto: bigint; vencimiento: string } | null;
  ocurrenciasDelMes: Ocurrencia[];
  proximoVencimiento: string | null;
};

type Grupo = { monto: bigint; cantidad: number };

type Recurrentes = {
  fechaHoy: string; mes: string; ventanaDias: number;
  bandeja: Ocurrencia[];
  comprometido: { total: bigint; pagado: Grupo; porConfirmar: Grupo; programado: Grupo };
  ingresosEsperados: Ocurrencia[];
  recurrentes: Recurrente[];
};

/** Valores del formulario de plantilla (texto, como el de cuentas y la captura). */
type ValoresPlantilla = {
  tipo: TipoMovimiento; concepto: string; monto: string; variable: boolean;
  periodicidad: Periodicidad; primerVencimiento: string; ultimoDia: boolean;
  cuentaOrigenId: string | null; cuentaDestinoId: string | null; categoriaId: string | null;
};

type CampoPlantilla =
  | "tipo" | "concepto" | "monto" | "periodicidad" | "primerVencimiento"
  | "ultimoDia" | "cuentaOrigen" | "cuentaDestino" | "categoria";
```

### Dominio

```ts
// src/domain/recurrente/vencimiento.ts
textoRelativo(vencimiento: string, fechaHoy: string): string;
// = "hoy"; +1 "mañana"; +3 "en 3 días"; −1 "vencido ayer"; −3 "vencido hace 3 días". Aritmética de calendario (sumarDias).
estaVencida(vencimiento: string, fechaHoy: string): boolean;   // para el color; el estado lo da la API
formatearCada(p: Periodicidad): string;                          // "Semanal", "Quincenal", "Mensual", …
formatearVence(r: { periodicidad: Periodicidad; primerVencimiento: string; ultimoDia: boolean }): string;
// mensual/bimestral/trimestral: "Día 18" o "Último día"; anual: "18 nov"; semanal: "Jueves"; quincenal: "15 y último".
etiquetaUltimo(p: Periodicidad): string;
// "Última semana", "Última quincena", "Último mes", "Último bimestre", "Último trimestre", "Último año".
ocurrenciaDelMes(r: Recurrente): Ocurrencia | null;
// La que representa a la plantilla en el mes: la primera sin cerrar; si todas están cerradas, la última; null sin ocurrencias.

// src/domain/recurrente/comprometido.ts
anchosComprometido(c: { total: bigint; pagado: bigint; porConfirmar: bigint }): { pagado: number; porConfirmar: number };
// 0–100 enteros, en bigint con división entera; total 0 → { 0, 0 }. Solo para la barra.

// src/domain/recurrente/formulario.ts
VALORES_ALTA(fechaHoy: string): ValoresPlantilla;               // gasto, mensual, fijo, primer vencimiento = hoy
valoresDesdePlantilla(r: Recurrente): ValoresPlantilla;
cuerpoDesdeValores(v: ValoresPlantilla): RecurrenteCuerpo | null;
// null si el monto no se puede enviar. Limpia lo que no aplica al tipo (cuentas, categoría) y ultimoDia en semanal/quincenal.
permiteUltimoDia(p: Periodicidad): boolean;                     // mensual o más
cambiaCalendario(antes: ValoresPlantilla, despues: ValoresPlantilla): boolean;
// periodicidad, primerVencimiento o ultimoDia distintos → se muestra el aviso de reinicio.
hayCambios(antes: ValoresPlantilla, despues: ValoresPlantilla): boolean;
```

Signo y color de un importe (bandeja, lista e ingreso esperado), según el tipo, como el libro (`importeEnPatrimonio`):

- Gasto con `−` en `salida-texto`, ingreso con `+` en `entrada-texto`, transferencia sin signo y en tinta.
- Variable no pagada: «≈ » delante.
- Total comprometido con `−` en `salida` (cifra-l); en cero, «0» en tinta.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular. Botones de 48 px (C6), también en la bandeja.

**Escritorio:**

```
Recurrentes                                                      [+ Nueva plantilla]   secundario, enlace
┌───────────────────────────────────────────────────────┐   ┌──────────── 400 px ────────────┐
POR CONFIRMAR 2                   Aún no tocan los saldos     COMPROMETIDO EN NOVIEMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Internet Claro hogar confirmado: −89.900 ya cuenta en …  Deshacer      −1.618.170    cifra-l salida
12 nov   Internet Claro hogar      −89.900  [Confirmar][Ajustar] Omitir    ███████┄┄┄░░  barra 8 px
mañana   Servicios · Bancolombia      fijo                              ■ Pagado · 5 pagos   1.396.220
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  punteada   ⬚ Por confirmar · 4    191.150
14 nov   Gas Vanti               ≈ −31.870  [Confirmar][Ajustar] Omitir    ░ Programado · 2        30.800
en 3 días Servicios · Bancolombia  estimado                             Ingreso esperado · Salario 30 nov  +4.200.000
└──── 96 | flexible | 150 | auto ─────────────────────┘

PLANTILLAS 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPTO        CADA       VENCE     CUENTA                CATEGORÍA       IMPORTE   NOVIEMBRE
Arriendo        Mensual    Día 1     Bancolombia           Casa         −1.100.000   ✓ Pagado 1 nov
Gas Vanti       Mensual    Día 14    Bancolombia           Servicios       ≈ −32.400  Por confirmar · 14 nov
Acueducto EAAB  Bimestral  Día 18    Bancolombia           Servicios       ≈ −41.860  Próximo 18 dic
Salario …       Mensual    Último día Bancolombia          Salario      +4.200.000   📅 Programado 30 nov
«≈» marca un importe variable: se estima con el último valor y se ajusta al confirmar.
```

- **Distribución:** bandeja y comprometido en dos columnas (`minmax(0,1fr) | 400px`, 48 px entre ellas). Plantillas debajo, a todo el ancho. 48 px entre bloques.
- **Fila de la bandeja:** rejilla `96px | flexible | 150px | auto`, mínimo 64 px, con punteada abajo (es lo pendiente). Fecha en cifra-xs; debajo el texto relativo en `etiqueta` secundaria, o en `salida-texto` si está vencida. Concepto en cuerpo 600 y debajo «categoría · cuenta» en `etiqueta` secundaria; una transferencia muestra «Transferencia · Origen → Destino» y un gasto sin categoría, «Sin categoría». El importe va en cifra-s 500 con «fijo»/«estimado» en cifra-xs secundaria. Las acciones son «Confirmar» (primario), «Ajustar» (secundario) y «Omitir» (botón de texto en `secundario`).
- **Ajustando:** la fila pasa a fondo `hundido`. El importe se vuelve un campo en cifra-s con su signo, sobre una raya, con «Último mes: 31.870» (`etiquetaUltimo` + `ultimoConfirmado`) en cifra-xs debajo; sin último confirmado, nada. Los botones son «Confirmar 35.120» (primario, con `monto`) y «Cancelar» (secundario). Enter confirma y Escape cancela. Si el importe no es un entero mayor que cero, `MensajeError` bajo el campo y no se envía. Solo una fila se ajusta a la vez.
- **Aviso:** fila de 44 px arriba de las ocurrencias, sobre una división: marca de 16 px en `entrada`, el texto en cuerpo y «Deshacer» (botón de texto). Dura 5 s o hasta la siguiente acción en la bandeja. Al deshacer, desaparece.
- **Error de una acción:** `MensajeError` bajo la fila con el `mensaje` de la API, y la ocurrencia sigue en la bandeja. Con `OCURRENCIA_CERRADA` se refresca la página. Sin conexión: «No pudimos conectar. Intenta de nuevo.».
- **Comprometido:** total en cifra-l `salida`. Barra de 8 px con radio `muestra`: pagado en `texto`, por confirmar con contorno punteado en `texto`, programado en `linea`. Los anchos salen de `anchosComprometido`. Filas con muestra de 12 × 8, rótulo en cuerpo, « · N pagos» en `etiqueta` secundaria y cifra-s. Debajo, una línea por ingreso esperado: «Ingreso esperado · {concepto} {30 nov}» en `etiqueta` secundaria y el importe en cifra-s `entrada-texto`.
- **Plantillas:** rejilla `minmax(0,1.3fr) | 110px | 100px | minmax(0,1.2fr) | 150px | 140px | 170px` con rótulos sobre una división. Cada fila es un enlace a `?plantilla=<id>` (fondo `hundido` al pasar el cursor, como la fila de cuenta). Concepto en cuerpo; cada, vence, cuenta y categoría en `etiqueta` secundaria; importe en cifra-s. La columna del mes se rotula con su nombre («Noviembre») y su estado sale de `ocurrenciaDelMes`:

| Caso | Texto | Estilo |
|---|---|---|
| `pagada` | «Pagado {1 nov}» con check de 14 px | secundario |
| `por_confirmar` | «Por confirmar · {14 nov}» | `marca-texto`, subrayado punteado |
| `vencida` | «Vencido · {9 nov}» | `salida-texto`, subrayado punteado |
| `programada` | «Programado {25 nov}» con calendario de 14 px | secundario |
| `omitida` | «Omitido» | `terciario`, tachado |
| Sin ocurrencias en el mes | «Próximo {18 dic}», o «—» sin próximo | secundario |
| Pausada (manda sobre lo anterior) | «Pausada desde {12 nov}» | `terciario`; concepto e importe en `terciario` |

**Móvil (390 px):** título; **Comprometido** arriba (total, barra y filas sin número de pagos, ingresos esperados); **Por confirmar · N** con «No tocan los saldos». Cada ocurrencia lleva concepto 600, «{12 nov} · {mañana} · {cuenta}» e importe a la derecha, y debajo `1fr | 1fr | auto` con Confirmar, Ajustar y Omitir. Al ajustar, el campo va en cifra-l a todo el ancho con «COP», «Último mes: …» y `1fr | auto` con «Confirmar {importe}» y «Cancelar». **Plantillas · N** en filas: concepto, «{Mensual} · {Día 1} · {estado}» en `etiqueta` e importe; al pie, «+ Nueva plantilla» (`EnlaceTexto`).

**Panel de plantilla** (`PanelLateral`, `ancho="amplio"`; en móvil, la hoja inferior):

```
NUEVA PLANTILLA / EDITAR PLANTILLA                     Cerrar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ Gasto | Ingreso | Transferencia ]                      SelectorTipo segmentado (pestañas en móvil)
Concepto ______________________________                 CampoSubrayado, máx. 80
Importe   − 89.900                              COP      CampoMonto con signo del tipo
Importe   ( ) Fijo   ( ) Variable · se estima con el último confirmado      OpcionUnica
Cada      ( ) Semanal ( ) Quincenal ( ) Mensual ( ) Bimestral ( ) Trimestral ( ) Anual   OpcionUnica
Primer vencimiento  12/11/2026 ____                      date nativo con línea de CampoSubrayado
Día       ( ) Día 12 de cada mes  ( ) Último día de cada mes   OpcionUnica, solo mensual o más
Vence el día 12 de cada mes.                            nota (formatearCada + formatearVence)
Cuenta    [Bancolombia] [Nequi] [Visa Oro] …             FichaCuenta, dos por fila
Categoría [Servicios] [Casa] … [Sin categoría]           ChipCategoria; oculta en transferencia
──────────────────────────────────────────────────────── pie fijo
[ Crear plantilla ]  /  [ Guardar cambios ]
Pausar plantilla · Eliminar plantilla…                   solo edición
```

- **Cuentas por tipo:** gasto, «Cuenta» (origen); ingreso, «Cuenta» (destino); transferencia, «Desde» y «Hacia». Al cambiar de tipo, lo que no aplica se descarta (`cuerpoDesdeValores`). En alta se preselecciona la cuenta predeterminada de la captura, si la hay.
- **Primer vencimiento:** `min` = hoy en alta. En edición no lleva `min`: la API admite el que ya tenía y rechaza uno pasado si cambia el calendario (`PRIMER_VENCIMIENTO_PASADO`).
- **Aviso en edición:** si `cambiaCalendario`, una nota sobre el botón: «Cambiar la periodicidad o el primer vencimiento reinicia el calendario: lo que esté por confirmar antes de esa fecha desaparece.».
- **Errores:** el `mensaje` de la API va bajo su campo (`campo` → `CampoPlantilla`). Sin campo, `MensajeError` al pie. El monto se valida antes de enviar, como en cuentas («Escribe un valor en pesos, sin decimales.»).
- **Cerrar con cambios:** «¿Descartar los cambios?», como `PanelCuenta`.
- **Pausar / Reanudar** (botón de texto): `PATCH`, y el panel sigue abierto con el estado nuevo. Pausada, arriba del formulario aparece «Pausada desde {12 nov}. No genera ocurrencias nuevas.».
- **Eliminar plantilla…:** `BloqueEliminar` con «Se borra la plantilla y lo que tenía por confirmar. Los movimientos ya confirmados se quedan.». Al confirmar, el panel se cierra hacia `/recurrentes`.
- Al crear o guardar, el panel se cierra hacia `/recurrentes`.

### Textos literales

| Caso | Texto |
|---|---|
| Título | «Recurrentes» · «Nueva plantilla» |
| Bandeja | «Por confirmar» · «{N}» · escritorio «Aún no tocan los saldos» · móvil «Por confirmar · {N}», «No tocan los saldos» |
| Relativo | «hoy» · «mañana» · «en {N} días» · «vencido ayer» · «vencido hace {N} días» |
| Importe | «fijo» · «estimado» · «≈ » delante del variable |
| Sin categoría | «Sin categoría»; transferencia «Transferencia» |
| Acciones | «Confirmar» · «Ajustar» · «Omitir» · «Confirmar {importe}» · «Cancelar» |
| Último | «{Último mes}: {31.870}» (`etiquetaUltimo`) |
| Aviso, confirmar | «{Concepto} confirmado: {−89.900} ya cuenta en {cuenta}.» |
| Aviso, ajustar | «{Concepto} confirmado con {35.120}. Ya cuenta en {cuenta}.» |
| Aviso, omitir | «{Concepto} omitido. La plantilla sigue activa.» |
| Aviso | «Deshacer» |
| Bandeja vacía | «Nada por confirmar.» · «El próximo aparece {7} días antes de su vencimiento.» |
| Comprometido | «Comprometido en {noviembre}» · «Pagado» · «Por confirmar» · «Programado» · «{N} pagos» («1 pago») · «Ingreso esperado · {concepto} {30 nov}» |
| Plantillas | «Plantillas» · «Concepto» · «Cada» · «Vence» · «Cuenta» · «Categoría» · «Importe» · «{Noviembre}» |
| Nota | ««≈» marca un importe variable: se estima con el último valor y se ajusta al confirmar.» |
| Sin plantillas | `EstadoVacio`: «Recurrentes · 0» · «Aún no tienes plantillas.» · «Arriendo, servicios, salario: lo que se repite se confirma con un toque.» · «Nueva plantilla» |
| Panel | «Nueva plantilla» · «Editar plantilla» · «Concepto» · «Importe» · «Fijo» · «Variable · se estima con el último confirmado» · «Cada» · «Primer vencimiento» · «Día» · «Día {12} de cada mes» · «Último día de cada mes» · «Cuenta» · «Desde» · «Hacia» · «Categoría» · «Sin categoría» |
| Nota de vencimiento | mensual «Vence el día {12} de cada mes.» / «Vence el último día de cada mes.» · bimestral/trimestral «… cada 2 / 3 meses.» · anual «Vence cada año el {12 nov}.» · semanal «Vence cada {jueves}.» · quincenal «Vence el 15 y el último día de cada mes.» |
| Panel, acciones | «Crear plantilla» / «Creando…» · «Guardar cambios» / «Guardando…» · «Pausar plantilla» · «Reanudar plantilla» · «Eliminar plantilla…» |
| Pausada | «Pausada desde {12 nov}. No genera ocurrencias nuevas.» |
| Calendario | «Cambiar la periodicidad o el primer vencimiento reinicia el calendario: lo que esté por confirmar antes de esa fecha desaparece.» |
| Eliminar | «Eliminar plantilla» · «Se borra la plantilla y lo que tenía por confirmar. Los movimientos ya confirmados se quedan.» |
| Error | «No pudimos cargar tus recurrentes.» + «Reintentar» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Recurrentes | N-05 | `entradas.ts` → `/recurrentes`; `GET /recurrentes` |
| Bandeja | N-06, N-07, N-08, N-09, N-10 | `bandeja` (orden y estados de la API); contador = `bandeja.length` |
| Bandeja | N-11, N-12 | `vencimiento`, `fechaHoy` → `textoRelativo` |
| Bandeja | N-13, N-14, N-15 | `recurrentes[]` por `recurrenteId`: `concepto`, `categoria`, `cuentaOrigen`, `cuentaDestino` |
| Bandeja | N-16, N-17, N-18 | `tipo`, `OcurrenciaDto.monto`, `estimado` |
| Bandeja | N-19 | La web no registra nada hasta confirmar (RN-10) |
| Bandeja | N-20, N-21 | `POST /recurrentes/:id/confirmar` sin `monto`; aviso con el `MovimientoDto` |
| Bandeja | N-22, N-23, N-24, N-25 | Ajustar: `confirmar` con `monto`; `ultimoConfirmado` + `etiquetaUltimo`; `aDigitos` y `MONTO_*` |
| Bandeja | N-26, N-27 | `POST /recurrentes/:id/omitir`; aviso del cliente |
| Bandeja | N-28 | `DELETE /movimientos/:id` con el `id` que devolvió `confirmar` |
| Bandeja | N-29 | `DELETE /recurrentes/:id/omisiones/:vencimiento` |
| Bandeja | N-30, N-31 | `OCURRENCIA_CERRADA`, `OCURRENCIA_INVALIDA`, `CUENTA_ARCHIVADA` → `MensajeError` en la fila |
| Bandeja | N-32 | `bandeja: []` + `ventanaDias` |
| Comprometido | N-33 | `mes` → `formatearNombreMes` |
| Comprometido | N-34, N-35, N-36, N-37, N-38, N-39 | `comprometido.total`, `.pagado`, `.porConfirmar`, `.programado`; barra con `anchosComprometido` |
| Comprometido | N-40 | `ingresosEsperados` + `recurrentes[]` |
| Plantillas | N-41, N-42 | `recurrentes` (orden de la API); contador = `recurrentes.length` |
| Plantillas | N-43, N-44, N-45 | `concepto`; `periodicidad` → `formatearCada`; `primerVencimiento` + `ultimoDia` → `formatearVence` |
| Plantillas | N-46, N-47, N-48 | `cuentaOrigen`, `cuentaDestino`, `categoria`, `tipo`, `monto`, `variable` |
| Plantillas | N-49, N-50, N-51 | `ocurrenciasDelMes` → `ocurrenciaDelMes`; `proximoVencimiento`; `pausada`, `pausadaDesde` |
| Panel | N-52 a N-61 | `POST /recurrentes` con `RecurrenteCuerpo`; categorías de `GET /captura`, cuentas de `GET /cuentas` |
| Panel | N-62 a N-67 | Errores con `campo` de la API → campo del formulario |
| Panel | N-68 | `PUT /recurrentes/:id`; `cambiaCalendario` → aviso |
| Panel | N-69, N-70 | `PATCH /recurrentes/:id { pausada }` |
| Panel | N-71 | `DELETE /recurrentes/:id` tras `BloqueEliminar` |
| Todas | N-72 | `RecurrenteDto.id`; ocurrencia = `recurrenteId` + `vencimiento` |
| Todas | N-73, N-74, N-76, N-77, N-82, N-83 | Reglas de la API; la web muestra |
| Todas | N-75 | Revalidación de `/movimientos`, `/cuentas` y `/resumen` al confirmar o deshacer |
| Todas | N-80 | `loading.tsx`, `error.tsx` |
| Todas | N-81 | `formatearDinero` |
| Ya cubierto | N-04 | SPEC 05 |
| Fuera de alcance | N-01, N-02, N-03, N-78, N-79 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/recurrentes/
  page.tsx                                         # nuevo: GET /recurrentes, ?plantilla=
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
  acciones.ts                                      # nuevo: confirmar, omitir, deshacer ×2, crear, editar, pausar, eliminar
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/recurrentes"
src/app/(aplicacion)/cuentas/acciones.ts           # + revalida /recurrentes
src/app/(aplicacion)/cuentas/archivadas/acciones.ts # + revalida /recurrentes
src/app/estilos/page.tsx                           # + muestras de recurrentes
src/app/estilos/muestras-interactivas.tsx          # + bandeja y panel de muestra
src/components/recurrentes/
  bandeja-recurrentes.tsx                          # nuevo, cliente: filas, ajustar, aviso, deshacer
  comprometido-mes.tsx                             # nuevo: total, barra, filas, ingresos esperados
  lista-plantillas.tsx                             # nuevo: tabla y lista, estados del mes
  panel-plantilla.tsx                              # nuevo, cliente: alta, edición, pausa, eliminar
src/components/menu/entradas.ts                    # Recurrentes → /recurrentes
src/domain/recurrente/vencimiento.ts               # nuevo (+ vencimiento.test.ts)
src/domain/recurrente/comprometido.ts              # nuevo (+ comprometido.test.ts)
src/domain/recurrente/formulario.ts                # nuevo (+ formulario.test.ts)
src/services/recurrentes.ts                        # nuevo
src/repositories/api/recurrentes.ts                # nuevo (+ recurrentes.test.ts)
DESIGN.md                                          # + bandeja, comprometido, plantillas, panel
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos, y reciben las server actions por prop (como `AccionesCuenta`). Nunca importan `repositories/`.

## Plan de implementación

1. `domain/recurrente/vencimiento.ts` + pruebas: `textoRelativo` (hoy, mañana, en 3 días, vencido ayer, vencido hace 3 días, cambio de mes), `formatearVence` para las seis periodicidades y `ultimoDia`, `etiquetaUltimo` y `ocurrenciaDelMes` (sin ocurrencias, una abierta, varias con cerradas, todas cerradas).
2. `domain/recurrente/comprometido.ts` + pruebas: total cero, solo pagado, los tres grupos, redondeo que no pasa de 100. `domain/recurrente/formulario.ts` + pruebas: alta por defecto, desde plantilla, cuerpo por tipo (limpia cuentas y categoría), `ultimoDia` en semanal se descarta, monto inválido → `null`, `cambiaCalendario`.
3. `repositories/api/recurrentes.ts` + prueba con el JSON de `docs/api/recurrentes.md` (string → `bigint`) y con las rutas de las ocho llamadas. `services/recurrentes.ts`: `401` → `/login`. Lectura, escrituras con `Resultado` que nunca lanza al cliente.
4. Ruta: `page.tsx`, `loading.tsx`, `error.tsx`. «Recurrentes» en `entradas.ts`. `/recurrentes` en `RUTAS_AFECTADAS` y en las acciones de cuentas. `ComprometidoMes` y `ListaPlantillas` (escritorio y móvil) con estados del mes, pausada y próximo, y estado vacío. Al terminar, la pantalla se ve con datos reales, sin acciones.
5. `acciones.ts` (confirmar, omitir, deshacer confirmación, deshacer omisión) y `BandejaRecurrentes`: filas, confirmar, ajustar en la fila, omitir, aviso de 5 s con deshacer, errores en la fila y bandeja vacía.
6. `PanelPlantilla` en alta y edición (`?plantilla=nueva`, `?plantilla=<id>`; un id desconocido vuelve a `/recurrentes`), con `crear` y `editar` en `acciones.ts`, «Nueva plantilla» en cabecera y pie, errores por campo, aviso de calendario y descarte.
7. Pausar, reanudar y eliminar en el panel, con `pausar` y `eliminar` en `acciones.ts`.
8. `/estilos`: bandeja (normal, ajustando, aviso, vacía), comprometido, lista de plantillas con todos los estados y panel, en claro y oscuro.
9. `DESIGN.md`: bandeja de recurrentes, comprometido, lista de plantillas y panel de plantilla.

## Criterios de aceptación

Datos de prueba: los del diseño (`Recurrentes.dc.html`) con `fechaHoy` 2026-11-11.

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] «Recurrentes» está habilitado y activo en el menú lateral y en la hoja «Más», y lleva a `/recurrentes`.
- [ ] La bandeja dice «Por confirmar 4». Internet Claro hogar muestra «12 nov», «mañana», «Servicios · Bancolombia», «−89.900» y «fijo». Gas Vanti muestra «14 nov», «en 3 días», «≈ −31.870» y «estimado».
- [ ] Una ocurrencia vencida queda arriba con «vencido hace N días» en terracota.
- [ ] «Confirmar» en Internet saca la fila, muestra «Internet Claro hogar confirmado: −89.900 ya cuenta en Bancolombia.» y el movimiento aparece en `/movimientos` con fecha 12 nov; el saldo de Bancolombia baja 89.900 en `/cuentas`.
- [ ] «Deshacer» dentro de 5 s devuelve Internet a la bandeja y el movimiento desaparece de `/movimientos`. A los 5 s el aviso desaparece solo.
- [ ] «Ajustar» en Gas Vanti muestra el campo con «Último mes: 31.870». Con 35.120, el botón dice «Confirmar 35.120» y el movimiento queda en 35.120. Con el campo vacío o en 0 aparece el error y no se envía. Escape cancela.
- [ ] «Omitir» en Cuota de manejo la saca de la bandeja y del comprometido, con «Cuota de manejo omitido. La plantilla sigue activa.»; su fila en Plantillas dice «Omitido» tachado. «Deshacer» la devuelve.
- [ ] Confirmar una ocurrencia cuya cuenta está archivada muestra el mensaje de `CUENTA_ARCHIVADA` bajo la fila, y la ocurrencia sigue en la bandeja.
- [ ] Sin ocurrencias en la bandeja se ve «Nada por confirmar.» y «El próximo aparece 7 días antes de su vencimiento.».
- [ ] El comprometido dice «Comprometido en noviembre», el total con `−` en terracota, las tres filas con sus montos y «N pagos» de la API, y la barra con pagado más largo que por confirmar. «Ingreso esperado · Salario Andina SAS 30 nov +4.200.000».
- [ ] La lista dice «Plantillas 12», en el orden de la API, con «Mensual · Día 14», «Bimestral», «Último día», una transferencia en tinta sin signo, «≈» en las variables y los estados «Pagado 1 nov», «Por confirmar · 14 nov» y «Programado 30 nov».
- [ ] Una bimestral sin vencimiento en el mes muestra «Próximo {fecha}». Una pausada muestra «Pausada desde {fecha}» en tenue.
- [ ] Tocar una plantilla abre `?plantilla=<id>` con sus valores. Un id que no existe vuelve a `/recurrentes`.
- [ ] «Nueva plantilla» abre el panel. Crear un gasto mensual «Agua» de 40.000 desde mañana, en Bancolombia y Servicios, cierra el panel y la plantilla aparece en la lista con «Programado» o «Por confirmar» según la fecha.
- [ ] En el panel, transferencia muestra «Desde» y «Hacia» y oculta la categoría. Semanal y quincenal ocultan «Día». La nota de vencimiento cambia con la periodicidad.
- [ ] Un concepto vacío, un primer vencimiento pasado o cuentas iguales muestran el `mensaje` de la API bajo su campo.
- [ ] En edición, cambiar la periodicidad muestra el aviso de reinicio del calendario. Guardar sin cambiar el calendario conserva un primer vencimiento pasado.
- [ ] «Pausar plantilla» deja el panel abierto con «Pausada desde …» y «Reanudar plantilla». La lista la muestra pausada.
- [ ] «Eliminar plantilla…» pide la confirmación. Al confirmar, la plantilla sale de la lista y sus movimientos confirmados siguen en `/movimientos`.
- [ ] Eliminar desde `/movimientos` un movimiento confirmado devuelve su ocurrencia a la bandeja de `/recurrentes` sin recargar a mano.
- [ ] Sin plantillas se ve el estado vacío con «Nueva plantilla».
- [ ] En 390 px: comprometido arriba, bandeja con botones de 48 px en dos columnas más «Omitir», plantillas en filas, «+ Nueva plantilla» al pie y sin scroll horizontal.
- [ ] Con la API apagada, `/recurrentes` muestra «No pudimos cargar tus recurrentes.» y «Reintentar».
- [ ] `/estilos` muestra bandeja, comprometido, lista y panel en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`. En `comprometido.ts` solo los anchos son `number`.
- [ ] La web no suma ni resta montos: total, grupos, estimados y estados salen de `RecurrentesDto`.

## Decisiones

- **Sí:** un solo spec para la pantalla y el formulario de plantilla, por decisión del autor. **No:** separar el formulario en otro spec.
- **Sí:** panel por URL (`?plantilla=nueva`, `?plantilla=<id>`), como cuentas. **No:** páginas propias.
- **Sí:** formulario con piezas existentes (`SelectorTipo`, `CampoSubrayado`, `CampoMonto`, `OpcionUnica`, `FichaCuenta`, `ChipCategoria`) y `<input type="date">` nativo con la línea de `CampoSubrayado`. **No:** selects nativos ni un control nuevo. El «último día» es una `OpcionUnica` («Día N» / «Último día»), no una casilla, que no existe en el sistema.
- **Sí:** barra del comprometido con anchos de `anchosComprometido` en `domain/` web, con `bigint`. Es presentación, como la escala de la gráfica (SPEC 07). **No:** pedir porcentajes a la API ni quitar la barra.
- **Sí:** aviso de 5 s con «Deshacer», como la captura. **No:** que dure hasta la siguiente acción.
- **Sí:** un aviso propio en la bandeja (marca, texto, «Deshacer»), con los textos del diseño. **No:** forzar `AvisoRegistro`, cuyo formato («Registrado: …») no coincide.
- **Sí:** vencida con «vencido hace N días» en terracota. **No:** el mismo estilo que las demás.
- **Sí:** toda la fila de plantilla abre su edición. Pausar y eliminar viven en el panel. **No:** un menú «…» por fila.
- **Sí:** «+ Nueva plantilla» al pie de la lista en móvil. En escritorio, el botón de la cabecera, que es un enlace con aspecto de botón secundario.
- **Sí:** botones de 48 px en la bandeja (C6). **No:** los 36 / 44 px del diseño, que no son medidas del sistema.
- **Sí:** importes en cifra-s en bandeja y lista, y el campo de ajuste en cifra-s (escritorio) y cifra-l (móvil). **No:** los 17 y 28 px del diseño (desvíos ya registrados).
- **Sí:** 48 px entre bandeja y comprometido. **No:** los 56 px del diseño.
- **Sí:** el estado de una plantilla en el mes sale de `ocurrenciaDelMes`: la primera sin cerrar o, si no queda ninguna, la última. Una semanal muestra una sola. **No:** listar todas las del mes en la fila.
- **Sí:** «Pausada» manda sobre el estado del mes. Concepto e importe en tenue.
- **Sí:** «Omitir» sin confirmación previa: se deshace con el aviso. Eliminar plantilla sí pide confirmación (`BloqueEliminar`): no se deshace.
- **Sí:** solo una fila de la bandeja en ajuste a la vez.
- **Sí:** el error de una acción va bajo su fila. Con `OCURRENCIA_CERRADA` se refresca (otro dispositivo o doble toque).
- **Sí:** el texto relativo y las etiquetas de periodicidad se calculan en `domain/` web desde `fechaHoy` de la respuesta. El contrato lo asigna al cliente. **No:** usar el reloj del navegador.
- **Sí:** el aviso cita la cuenta afectada: la de origen en gasto y transferencia, la de destino en ingreso.
- **Sí:** al crear, el primer vencimiento por defecto es hoy y la cuenta, la predeterminada de la captura.
- **Sí:** revalidar `/recurrentes` desde las acciones de movimientos y de cuentas. Borrar o editar un confirmado cambia la bandeja y el estimado, y renombrar o archivar una cuenta cambia la lista.
- **Sí:** sin contador de la bandeja en el menú: no está en el diseño ni en el inventario.
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble toque en «Confirmar» crea dos movimientos | La API responde `OCURRENCIA_CERRADA` (único por cierre). En la web, el botón se deshabilita mientras la acción está en curso. |
| «Deshacer» tras revalidar: la fila ya no está en la lista | El aviso guarda el `movimientoId` (o `recurrenteId` + `vencimiento`) en el cliente, independiente de la lista. |
| El aviso sigue tras cerrar la página | Vive en el estado del componente: al salir de la ruta se pierde, como el de la captura. |
| Formulario largo en la hoja móvil | `PanelLateral` desplaza el contenido con el pie fijo. Se verifica en 390 px. |
| `fechaHoy` de la API y el día del navegador difieren (zona) | Todo texto relativo usa `fechaHoy` de la respuesta, nunca `new Date()`. |
| Una plantilla referencia una cuenta archivada que no está entre las fichas | En edición, la ficha de la cuenta archivada se muestra con su nombre (de la plantilla) y elegida; guardar responde `CUENTA_ARCHIVADA` bajo «Cuenta». |
| Anchos de la barra que no suman 100 por redondeo | Programado ocupa el resto (`flex-1`); solo se calculan pagado y por confirmar. |

## Lo que **no** entra en este spec

- TRM, avisos y entradas a secciones futuras.
- Abonos a deudas con personas y plantillas en USD.
- Confirmar programadas, cambiar la fecha al confirmar y dividir la categoría.
- Historial de plantillas y comprometido de otros meses.
- Contador en el menú y notificaciones.

Cada uno, si llega, va en su propio spec.
