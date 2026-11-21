# SPEC 07 — Resumen del mes

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, Tino-API SPEC 06
> **Fecha:** 2026-11-21
> **Objetivo:** Que el usuario vea en `/resumen` los ingresos, gastos y resultado de un mes frente al anterior, su gasto por categoría y la evolución de su patrimonio, con todas las cifras calculadas por la API.

## Por qué existe este spec

Es el primer informe (REGLAS §7 enmendado). Fija estos patrones:

- Una pantalla de solo lectura que muestra cifras **tal como llegan**: la web no suma, no resta ni calcula porcentajes (REGLAS §5, montos cifrados).
- Porcentajes en décimas (excepción del módulo): se formatean con aritmética entera, sin coma flotante.
- Una gráfica sin dependencias: la escala se calcula en `domain/` con `bigint`; solo salen como `number` las coordenadas en píxeles.
- Un filtro de presentación sobre una lista que ya llegó (`esSinClasificar`), porque el contrato lo prescribe así.

Diseño: `referencias/export-resumen/` (`Resumen Mes.dc.html`, `Vacios.dc.html` pantalla `resumen`, `Resumen.dc.html`).
Inventario: `../Tino-API/specs/necesidades/resumen.md`.
Contrato: `../Tino-API/docs/api/resumen.md`; `movimientos.md` para clasificar (Tino-API SPEC 06 y SPEC 04).

## Alcance

**Entra:**

- Ruta `/resumen` con `?mes=YYYY-MM` opcional. Sin él, el mes actual según la API.
- «Resumen» habilitado en el menú lateral y en la barra móvil. `/` redirige a `/resumen` (también el destino tras iniciar sesión).
- Cabecera: rótulo «Resumen del mes», mes como `h1` entre `‹` y `›`, «Este mes» fuera del actual. `‹` oculto si `desde ≤ inicio` (o sin `inicio`); `›` oculto en el mes actual. Subtítulo «1 – 31 oct · 142 movimientos · comparado con septiembre».
- Tres cifras (Ingresos, Gastos, Resultado neto) con mes anterior y variación absoluta y porcentual («—» si es `null`).
- Gasto por categoría: tabla en escritorio, lista en móvil. Barra por categoría, «Sin categoría» al final, fila de total con «100 %».
- Indicador «X % sin categoría · Clasificar N» que lleva a `/movimientos?mes=…&sinClasificar=1`.
- `/movimientos?sinClasificar=1`: solo los gastos sin categoría ni partes del mes, con «Ver todos». Se clasifican con la edición de SPEC 06.
- Patrimonio neto de hoy, gráfica de la serie (hasta 12 puntos) y su variación.
- «Cambio en {mes}» (puente) en escritorio y en móvil.
- Día uno (`tieneMovimientos: false`): «Hoy es tu primer día.», cifras en cero, categorías vacías, punto de partida; sin navegación. Variante sin cuentas.
- Carga y error de `/resumen`.
- `/resumen` se revalida tras registrar, editar o eliminar un movimiento y tras cambiar cuentas.
- Componentes nuevos con muestra en `/estilos`: `CifrasMes`, `GastoCategorias`, `GraficaPatrimonio`, `CambioDelMes`, `DiaUno`; `NavegacionMes` con límites y variante título.

**Fuera de alcance (specs futuros):**

- TRM en el menú, contador de avisos y entradas a Deudas, Recurrentes, Inversiones, Metas y Avisos (N-01, N-02, N-03).
- Revaluación de inversiones en el puente (N-45). Queda en «Otros cambios».
- USD, ajustes de saldo y otros informes (series por categoría, rangos libres, exportar).
- Un control de filtro dentro de `/movimientos` y cualquier otro filtro del catálogo.
- Un flujo propio para clasificar en lote.
- Detalle al pasar sobre la gráfica (tooltip) o al tocar una categoría.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume `GET /resumen?mes=` y, para clasificar, `GET /movimientos?mes=` y `PUT /movimientos/:id` (ya integrados en SPEC 06).

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/resumen.ts`: `Ref`, `ComparacionDto`, `CategoriaResumenDto`, `ResumenDto` de `docs/api/resumen.md`. Montos `string` en el borde; `bigint` desde el repositorio hacia dentro. Porcentajes: `number | null` en décimas, sin convertir.

### Modelo de la web

```ts
type Comparacion = { actual: bigint; anterior: bigint; variacion: bigint; variacionPorcentaje: number | null };

type CategoriaResumen = { categoria: Ref; monto: bigint; anterior: bigint; variacion: bigint; porcentaje: number | null };

type Resumen = {
  mes: string; mesAnterior: string; desde: string; hasta: string; fechaHoy: string;
  inicio: string | null;
  tieneMovimientos: boolean;
  cuentasActivas: number;
  cantidadMovimientos: number;
  ingresos: Comparacion; gastos: Comparacion; resultado: Comparacion;
  categorias: CategoriaResumen[];
  sinCategoria: Omit<CategoriaResumen, "categoria"> & { cantidad: number };
  patrimonio: { hoy: bigint; serie: { fecha: string; patrimonio: bigint }[]; variacionSerie: bigint };
  cambioDelMes: {
    fechaAnterior: string; fechaCierre: string;
    patrimonioAnterior: bigint; resultado: bigint; otrosCambios: bigint; patrimonioCierre: bigint;
  };
};
```

### Dominio

```ts
// src/domain/resumen/porcentaje.ts
formatearPorcentaje(decimas: number | null, opciones?: { signo?: boolean }): string;
// 274 → "27,4 %"; -1190 → "−119,0 %"; signo: 15 → "+1,5 %"; 0 → "0,0 %"; null → "—". Aritmética entera.
anchoBarra(porcentaje: number | null, maximo: number | null): number;
// 0–100: porcentaje de la API sobre el mayor de la lista (categorías y sin categoría). Nunca usa montos.

// src/domain/resumen/navegacion.ts
limitesMes(r: { mes: string; desde: string; inicio: string | null; fechaHoy: string }):
  { actual: string; hayAnterior: boolean; haySiguiente: boolean };
// actual = mesDeFecha(fechaHoy); hayAnterior = inicio !== null && desde > inicio; haySiguiente = mes < actual.

// src/domain/resumen/grafica.ts
geometriaSerie(serie: { fecha: string; patrimonio: bigint }[], lienzo: { ancho: number; alto: number }): {
  puntos: { x: number; y: number; etiqueta: string }[];   // "dic", …, "oct", "hoy"
  rejilla: { y: number; etiqueta: string }[];             // 3 líneas: "28 M", "31 M", "34 M"
};
// 12 casillas fijas; los n puntos ocupan las últimas n (hoy siempre a la derecha).
// Paso de rejilla redondo (1, 2 o 5 × 10^k). Rango cero → se abre alrededor del valor.
// Escala en bigint; solo x e y (px enteros) salen como number.

// src/domain/movimiento/sin-clasificar.ts
esSinClasificar(m: Movimiento): boolean;   // tipo "gasto", categoria null y partes []

// src/domain/dinero/formato.ts (+)
formatearCompacto(monto: bigint): string;  // 28_000_000n → "28 M"; 950_000n → "950 mil"; negativos con −

// src/domain/fecha/formato.ts (+)
formatearRango(desde: string, hasta: string): string;  // "2026-10-01", "2026-10-31" → "1 – 31 oct"
formatearNombreMes(mes: string): string;               // "2026-09" → "septiembre"
formatearMesCorto(mes: string): string;                // "2025-12" → "dic 2025"
```

Signo y color: Ingresos con `+` en `entrada`, Gastos con `−` en `salida`, Resultado con su signo en tinta; un cero va sin signo y en tinta. Variaciones con signo, en tinta. Patrimonio y puente en tinta, negativo con `−`.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular.

**Escritorio:**

```
RESUMEN DEL MES                                   rótulo secundario
‹  Octubre 2026  ›  Este mes        1 – 31 oct · 142 movimientos · comparado con septiembre
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  raya
INGRESOS            │ GASTOS              │ RESULTADO NETO
+4.262.500          │ −3.012.000          │ +1.250.500          cifra-l
Septiembre 4.200.000│ Septiembre …        │ Septiembre +1.071.000
Variación +62.500 · +1,5 %  …                                  etiqueta / cifra-xs

GASTO POR CATEGORÍA            4,8 % sin categoría · Clasificar 14
CATEGORÍA   [barra]          OCTUBRE    %     SEPTIEMBRE   VAR.     160 | flex | 120 | 72 | 120 | 110
Casa        ██████████     1.146.800  25,9 %  1.139.250  +7.550
…
Sin categoría  ┄┄┄           212.940   4,8 %    318.600  −105.660 punteada
Total gastos               4.425.110  100 %   4.676.810  −251.700 doble raya

PATRIMONIO NETO · 12 MESES     dic 2025 – hoy │ CAMBIO EN OCTUBRE
34.121.072      +6.708.692 desde dic 2025     │ Patrimonio al 30 sep   32.106.940
[gráfica 2/3]                                 │ Resultado del mes      +1.250.500
                                              │ Otros cambios            +426.775
                                              │ Patrimonio al 31 oct   33.784.215  doble raya
```

- La barra mide 6 px, radio `muestra`, en `texto`; la de «Sin categoría» es un contorno punteado `terciario`.
- «Sin categoría» se muestra si su `monto` o su `anterior` no es cero. El indicador, solo si `cantidad > 0`.
- Sin categorías ni sin categoría (un mes sin gastos): bajo el rótulo, «No hubo gastos en octubre.».
- Con `gastos.actual = "0"`, el total dice «—» en vez de «100 %».
- En el mes actual el cierre se rotula «Patrimonio a hoy».

**Gráfica:** SVG con `viewBox` fijo por formato (escritorio 690 × 240, móvil 358 × 180), estirado al ancho. Tres líneas de rejilla en `linea` con su etiqueta a la derecha, base en `raya`, línea de 1,5 px en `texto`, puntos huecos y el de hoy relleno. Etiquetas en cifra-xs secundaria; «hoy» en tinta. `role="img"` con «Patrimonio neto: de {primero} en {mes} a {hoy} hoy».

**Móvil (390 px):** cabecera con el rótulo, `h1` a la izquierda y `‹ ›` a la derecha; «Este mes» y el subtítulo debajo. Cifras apiladas: Ingresos y Gastos en cifra-m con «+1,5 % vs sep» en cifra-xs; Resultado en cifra-l entre raya y doble raya. Categorías en lista: nombre, monto, % y barra de 4 px; total en la cabecera de la sección; al pie «4,8 % sin categoría, en 14 gastos · Clasificar» (44 px). Patrimonio con «+6.708.692 desde dic 2025», gráfica y debajo «Cambio en octubre» con las mismas filas que escritorio.

**Día uno** (`tieneMovimientos: false`), sin navegación de meses:

```
RESUMEN DEL MES
Noviembre 2026
Hoy es tu primer día.                       [Registrar el primer gasto] [Agregar otra cuenta]
El resumen se arma solo con lo que registres. Por ahora solo están los saldos
iniciales de tus 3 cuentas, y esos no cuentan como ingresos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INGRESOS 0 (terciario)       │ GASTOS 0                 │ RESULTADO NETO 0
Sin ingresos registrados     │ Sin gastos registrados   │ Ingresos menos gastos
GASTO POR CATEGORÍA                  │ PATRIMONIO NETO    Punto de partida · 11 nov
(4 renglones vacíos, el último en    │ 975.372                       cifra-l
 doble raya en `linea`)              │ ●┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Cuando registres gastos aparecen     │ hoy dic ene … oct            hoy + los 11 meses siguientes
aquí, de mayor a menor, con su       │ La línea arranca hoy. Cada cierre de mes agrega un punto.
parte del total.
```

- «Registrar el primer gasto» (primario) abre la captura. «Agregar otra cuenta» (secundario) es un enlace a `/cuentas?cuenta=nueva`; en móvil no aparece.
- Móvil: mensaje corto, cifras apiladas, patrimonio y el botón al final.
- Una cuenta: «de tu cuenta». Sin cuentas: «Empieza por crear una cuenta: el resumen se arma con lo que registres en ella.» con «+ Nueva cuenta» (`EnlaceTexto`); sin patrimonio ni «Registrar el primer gasto».

**`/movimientos?mes=2026-10&sinClasificar=1`:**

```
Movimientos
‹  Octubre 2026  ›                    Este mes
GASTOS SIN CLASIFICAR · 14                     Ver todos
… solo esos gastos, mismas filas del libro …
```

- Cada fila abre `?mes=…&sinClasificar=1&movimiento=<id>`; cerrar la edición vuelve al filtro.
- Al guardar con categoría, la fila sale de la lista y se ve el aviso «Guardado: …» (y la oferta de regla de SPEC 06).
- Vacío: `EstadoVacio` con «Sin clasificar · octubre», «No quedan gastos sin clasificar en octubre.», «Todos tienen categoría o están divididos.» y «Ver todos».
- Cambiar de mes quita el filtro. `sinClasificar` con otro valor que `1` se ignora.

### Textos literales

| Caso | Texto |
|---|---|
| Rótulo | «Resumen del mes» |
| Subtítulo | «{1 – 31 oct} · {N} movimientos · comparado con {septiembre}»; «1 movimiento» en singular |
| Cifras | «Ingresos» · «Gastos» · «Resultado neto» · «{Septiembre}» · «Variación» |
| Variación | «{±variación} · {±porcentaje}»; sin base: «{±variación} · —» |
| Móvil, variación | «{±porcentaje} vs {sep}» |
| Categorías | «Gasto por categoría» · «Categoría» · «{Octubre}» · «%» · «{Septiembre}» · «Var.» · «Sin categoría» · «Total gastos» · «100 %» |
| Mes sin gastos | «No hubo gastos en {octubre}.» |
| Indicador | escritorio «{X %} sin categoría · Clasificar {N}» · móvil «{X %} sin categoría, en {N} gastos · Clasificar» («1 gasto») |
| Patrimonio | «Patrimonio neto · 12 meses» · «{mes corto} – hoy» · «{±variación} desde {dic 2025}» |
| Puente | «Cambio en {octubre}» · «Patrimonio al {30 sep}» · «Resultado del mes» · «Otros cambios» · «Patrimonio al {31 oct}» / «Patrimonio a hoy» |
| Día uno | «Hoy es tu primer día.» · escritorio «El resumen se arma solo con lo que registres. Por ahora solo están los saldos iniciales de tus {3 cuentas / tu cuenta}, y esos no cuentan como ingresos.» · móvil «El resumen se arma con lo que registres. Los saldos iniciales de {tus 3 cuentas / tu cuenta} no cuentan como ingresos.» |
| Día uno, cifras | «Sin ingresos registrados» · «Sin gastos registrados» · «Ingresos menos gastos» |
| Día uno, categorías | «Cuando registres gastos aparecen aquí, de mayor a menor, con su parte del total.» |
| Día uno, patrimonio | «Patrimonio neto» · «Punto de partida · {11 nov}» · «La línea arranca hoy. Cada cierre de mes agrega un punto.» |
| Día uno, acciones | «Registrar el primer gasto» · «Agregar otra cuenta» |
| Sin cuentas | «Empieza por crear una cuenta: el resumen se arma con lo que registres en ella.» · «+ Nueva cuenta» |
| Filtro | «Gastos sin clasificar · {N}» · «Ver todos» · vacío «Sin clasificar · {octubre}», «No quedan gastos sin clasificar en {octubre}.», «Todos tienen categoría o están divididos.» |
| Error | «No pudimos cargar el resumen.» + «Reintentar» |
| Navegación | la de SPEC 06 («Mes anterior: Septiembre 2026», «Este mes») |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Resumen | N-05 | `GET /resumen` sin `mes` |
| Resumen | N-06 | `mes` → `formatearMes` |
| Resumen | N-07, N-08 | `?mes=` con `sumarMeses`; `NavegacionMes` |
| Resumen | N-09 | `limitesMes` (`fechaHoy`); `MES_FUTURO` → `/resumen` |
| Resumen | N-10 | `MES_INVALIDO` → `/resumen`; `esMes` antes de pedir |
| Resumen | N-11 | `desde`, `hasta` |
| Resumen | N-12 | `cantidadMovimientos` |
| Resumen | N-13 | `mesAnterior` |
| Resumen | N-14, N-15, N-16 | `ingresos`, `gastos`, `resultado` `.actual` |
| Resumen | N-17, N-18, N-19 | `.anterior`, `.variacion`, `.variacionPorcentaje` |
| Resumen | N-20 | `variacionPorcentaje: null` → «—» |
| Resumen | N-21, N-22, N-30, N-40, N-41, N-42, N-48, N-62 | Reglas de cálculo de la API; la web muestra |
| Resumen | N-23 a N-26 | `categorias[]`: `monto`, `porcentaje`, `anterior`, `variacion` |
| Resumen | N-27, N-28 | Lista y orden de la API; «Sin categoría» al final en la web |
| Resumen | N-29 | `sinCategoria` |
| Resumen | N-31 | `gastos.*`; «100 %» rotulado |
| Resumen | N-32, N-33 | `sinCategoria.porcentaje`, `sinCategoria.cantidad` |
| Resumen | N-34 | `GET /movimientos?mes=` + `esSinClasificar` + `PUT /movimientos/:id` (SPEC 06) |
| Resumen | N-35 | `patrimonio.hoy` |
| Resumen | N-36, N-37, N-39 | `patrimonio.serie` |
| Resumen | N-38 | `patrimonio.variacionSerie` |
| Resumen | N-43, N-44, N-46, N-47 | `cambioDelMes` |
| Resumen | N-49 | `tieneMovimientos: true` con ceros |
| Resumen | N-50 | `loading.tsx`, `error.tsx` |
| Resumen | N-51 | `formatearDinero`, `formatearPorcentaje` |
| Resumen | N-52, N-53 | Cifras de la API; token del usuario |
| Día uno | N-54 | `tieneMovimientos: false` |
| Día uno | N-55 | `cuentasActivas` |
| Día uno | N-56, N-57 | Ceros y `categorias: []` |
| Día uno | N-58 | `inicio` + `patrimonio.hoy` |
| Día uno | N-59 | Sin `NavegacionMes` |
| Día uno | N-60, N-61 | Captura (`abrir`), `/cuentas?cuenta=nueva` |
| Ya cubierto | N-04 | SPEC 05 |
| Fuera de alcance | N-01, N-02, N-03, N-45 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/page.tsx                                   # / → /resumen
src/app/(aplicacion)/resumen/
  page.tsx                                         # nuevo: ?mes, GET /resumen
  loading.tsx                                      # nuevo
  error.tsx                                        # nuevo
src/app/(aplicacion)/movimientos/page.tsx          # + ?sinClasificar=1
src/app/(aplicacion)/captura/entrada.ts            # RUTAS_AFECTADAS + "/resumen"
src/app/(aplicacion)/cuentas/acciones.ts           # + revalida /resumen
src/app/(aplicacion)/cuentas/archivadas/acciones.ts # + revalida /resumen
src/app/estilos/page.tsx                           # + muestras del resumen
src/components/resumen/
  cifras-mes.tsx                                   # nuevo
  gasto-categorias.tsx                             # nuevo: tabla, lista, indicador
  grafica-patrimonio.tsx                           # nuevo: SVG (serie y día uno)
  cambio-del-mes.tsx                               # nuevo: puente
  dia-uno.tsx                                      # nuevo, cliente (abre la captura)
src/components/movimientos/
  navegacion-mes.tsx                               # + hayAnterior, haySiguiente, variante "titulo"
  libro-movimientos.tsx                            # + filtro: rótulo, vacío, enlaces con el filtro
  edicion-movimiento.tsx                           # cerrar conserva el filtro
src/components/menu/entradas.ts                    # Resumen → /resumen
src/domain/resumen/porcentaje.ts                   # nuevo (+ porcentaje.test.ts)
src/domain/resumen/navegacion.ts                   # nuevo (+ navegacion.test.ts)
src/domain/resumen/grafica.ts                      # nuevo (+ grafica.test.ts)
src/domain/movimiento/sin-clasificar.ts            # nuevo (+ sin-clasificar.test.ts)
src/domain/dinero/formato.ts                       # + formatearCompacto (+ pruebas)
src/domain/fecha/formato.ts                        # + formatearRango, formatearNombreMes, formatearMesCorto (+ pruebas)
src/services/resumen.ts                            # nuevo
src/repositories/api/resumen.ts                    # nuevo (+ resumen.test.ts)
DESIGN.md                                          # + resumen, gráfica, NavegacionMes ampliada
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos; nunca `repositories/`.

## Plan de implementación

1. `domain/fecha/formato.ts`: `formatearRango`, `formatearNombreMes`, `formatearMesCorto`. `domain/dinero/formato.ts`: `formatearCompacto`. Pruebas: rango de febrero bisiesto, «dic 2025», «28 M», «950 mil», «0», negativo.
2. `domain/resumen/porcentaje.ts` + pruebas: `274`, `-1190`, `0`, `1000`, `-5` («−0,5 %»), `null`, con y sin signo; `anchoBarra` con máximo `null` o `0`.
3. `domain/resumen/navegacion.ts` + pruebas: mes actual, mes de `inicio`, mes anterior a `inicio`, `inicio` nulo.
4. `domain/resumen/grafica.ts` + pruebas: 12 puntos, 2 puntos (últimas casillas), 1 punto, serie plana, patrimonio negativo; y siempre en el lienzo; etiquetas «hoy» y meses.
5. `repositories/api/resumen.ts` + prueba con el JSON de `docs/api/resumen.md` (string → `bigint`, porcentajes intactos). `services/resumen.ts`: `401` → `/login`; `MES_INVALIDO` y `MES_FUTURO` → `/resumen`.
6. Ruta: `resumen/page.tsx` (`?mes` mal formado → `/resumen`), `loading.tsx`, `error.tsx`. `entradas.ts`: Resumen → `/resumen`. `src/app/page.tsx` → `/resumen`. `/resumen` en `RUTAS_AFECTADAS` y en las acciones de cuentas. `NavegacionMes` gana `hayAnterior`, `haySiguiente` (flecha oculta deja su hueco de 44 px) y `variante="titulo"`. Al terminar se navega entre meses con la cabecera y el subtítulo.
7. `cifras-mes.tsx` (escritorio y móvil) + `/estilos`.
8. `domain/movimiento/sin-clasificar.ts` + pruebas. `/movimientos?sinClasificar=1`: filtra en `page.tsx`; `LibroMovimientos` recibe el filtro (rótulo con «Ver todos», vacío, enlaces); `EdicionMovimiento` cierra hacia la URL con el filtro.
9. `gasto-categorias.tsx`: tabla en escritorio, lista en móvil, sin categoría, total, mes sin gastos e indicador con enlace al filtro + `/estilos`.
10. `grafica-patrimonio.tsx` y `cambio-del-mes.tsx`, en escritorio (2/3 y 1/3) y en móvil (apilados) + `/estilos`.
11. `dia-uno.tsx`: con cuentas (escritorio y móvil) y sin cuentas; gráfica de punto de partida + `/estilos`.
12. `DESIGN.md`: resumen, cifras, tabla de categorías, gráfica, puente, día uno y `NavegacionMes` con límites.

## Criterios de aceptación

Datos de ejemplo: los de `docs/api/resumen.md` (noviembre 2026, `inicio` 2026-10-01).

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] `/` y el inicio de sesión llevan a `/resumen`; «Resumen» está activo en el menú y en la barra móvil.
- [ ] La cabecera dice «Noviembre 2026» y «1 – 30 nov · 3 movimientos · comparado con octubre».
- [ ] En noviembre no hay `›` ni «Este mes»; `‹` lleva a `?mes=2026-10`, donde no hay `‹` (`desde` = `inicio`), sí `›` y «Este mes».
- [ ] `?mes=2026-12`, `?mes=2026-13` y `?mes=hola` redirigen a `/resumen`.
- [ ] `?mes=2026-08` (antes de `inicio`) muestra las cifras en cero, sin `‹` y sin el mensaje de día uno.
- [ ] Ingresos muestra «0», «Octubre 2.000.000» y «−2.000.000 · −100,0 %».
- [ ] Gastos muestra «−300.000» en terracota y «−120.000 · −28,6 %»; Resultado «−300.000» en tinta y «−1.880.000 · −119,0 %» (el porcentaje de la API, sin recalcular).
- [ ] Una variación con anterior cero muestra «—».
- [ ] Gasto por categoría lista Comida 260.000 · 86,7 %, Mercado 30.000 · 10,0 %, Transporte 0 · 0,0 % con anterior 20.000, y al final «Sin categoría» 10.000 · 3,3 %; el total dice 300.000 · 100 % · 420.000 · −120.000.
- [ ] La barra de Comida es la más larga y la de Transporte no se ve.
- [ ] El indicador dice «3,3 % sin categoría · Clasificar 1» y lleva a `/movimientos?mes=2026-11&sinClasificar=1`.
- [ ] Ese filtro muestra solo el gasto sin clasificar y «Gastos sin clasificar · 1»; «Ver todos» vuelve a `?mes=2026-11`.
- [ ] Clasificarlo como Comida lo saca de la lista, muestra «No quedan gastos sin clasificar en noviembre.» y, de vuelta en `/resumen`, Comida sube a 270.000 y el indicador desaparece.
- [ ] Patrimonio muestra «2.280.000» y «−300.000 desde oct 2026»; la gráfica tiene 2 puntos en las dos últimas casillas, el último relleno, con «oct» y «hoy».
- [ ] Con 12 puntos la gráfica muestra 12 puntos, 3 líneas de rejilla con etiquetas compactas y el rango «dic 2025 – hoy».
- [ ] «Cambio en noviembre» muestra Patrimonio al 31 oct 2.580.000, Resultado del mes −300.000, Otros cambios 0 y «Patrimonio a hoy» 2.280.000 sobre doble raya; en octubre el cierre dice «Patrimonio al 31 oct».
- [ ] En 390 px, el resumen se ve sin scroll horizontal, con cifras apiladas, lista de categorías, gráfica y el puente debajo.
- [ ] Registrar un gasto de 20.000 desde `/resumen` sube Gastos a 320.000 sin recargar a mano.
- [ ] Editar el saldo inicial de una cuenta cambia Patrimonio hoy en `/resumen`.
- [ ] Un usuario con 3 cuentas y sin movimientos ve «Hoy es tu primer día.», «tus 3 cuentas», cifras 0 en tenue, «Punto de partida · {inicio}», sin `‹ ›`; «Registrar el primer gasto» abre la captura y «Agregar otra cuenta» lleva a `/cuentas?cuenta=nueva`.
- [ ] Con una sola cuenta el texto dice «tu cuenta»; en móvil no aparece «Agregar otra cuenta».
- [ ] Sin cuentas se ve «Empieza por crear una cuenta…» con «+ Nueva cuenta», sin patrimonio ni «Registrar el primer gasto».
- [ ] Con la API apagada, `/resumen` muestra «No pudimos cargar el resumen.» y «Reintentar».
- [ ] `/estilos` muestra los componentes del resumen y `NavegacionMes` con límites en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`; en `grafica.ts` solo las coordenadas en px son `number`.
- [ ] La web no suma, resta ni calcula porcentajes de montos: cada cifra mostrada sale de un campo de `ResumenDto`.

## Decisiones

- **Sí:** cifras y porcentajes tal como llegan; la web solo formatea. **No:** recalcular el total de categorías ni el «100 %» (pueden no sumar 1000 por redondeo).
- **Sí:** «Clasificar» como filtro `?sinClasificar=1` sobre `/movimientos`, editando con SPEC 06. El contrato lo prescribe y la oferta de regla de SPEC 06 sigue sirviendo. **No:** flujo propio de clasificación (formulario nuevo) ni endpoint nuevo.
- **Sí:** filtrar en la web con `esSinClasificar`. Es presentación sobre una lista ya cargada, no una consulta analítica; la definición es la de la API.
- **Sí:** el filtro solo se abre desde el resumen y se quita al cambiar de mes. **No:** control de filtro en `/movimientos` (los filtros siguen fuera).
- **Sí:** «en N gastos» en móvil, no «movimientos»: la cifra cuenta solo gastos (N-33).
- **Sí:** portada `/` → `/resumen`. Es la primera entrada del menú y de la barra.
- **Sí:** puente también en móvil, bajo la gráfica, con las mismas filas. **No:** omitirlo como el diseño.
- **Sí:** gráfica en SVG propio, escala en `domain/` con `bigint`. **No:** librería (dependencia nueva y montos a `number`).
- **Sí:** 12 casillas fijas con hoy a la derecha; menos puntos ocupan las últimas. La escala de tiempo no se estira.
- **Sí:** variación del patrimonio como «desde {mes}». **No:** «en 12 meses» del diseño: es falso con menos de 12 puntos.
- **Sí:** barras proporcionales al `porcentaje` de la API sobre el mayor. **No:** dividir montos en la web.
- **Sí:** cifras en tokens: escritorio cifra-l (32) en vez de 40/44; móvil cifra-m (20) y cifra-l para el resultado en vez de 24/32; etiquetas de la gráfica en cifra-xs (12) en vez de 11; barra con radio `muestra` (2) en vez de 1. Mismo criterio que SPEC 05 con el monto móvil.
- **Sí:** reutilizar `NavegacionMes` con `hayAnterior`, `haySiguiente` y variante título; flecha oculta conserva su hueco. **No:** componente nuevo de navegación.
- **Sí:** «Este mes» fuera del actual, como `/movimientos`.
- **Sí:** mes actual desde `fechaHoy` de la respuesta. **No:** pedir el perfil para calcularlo.
- **Sí:** mes inválido o futuro redirige a `/resumen`, como `/movimientos`. **No:** página de error para una URL tecleada.
- **Sí:** «Sin categoría» solo si tiene monto o anterior; el indicador solo con `cantidad > 0`.
- **Sí:** día uno solo con `tieneMovimientos: false`; un mes vacío muestra ceros (N-49).
- **Sí:** día uno sin cuentas invita a crear una, sin patrimonio ni «Registrar el primer gasto» (la captura pide cuenta).
- **Sí:** «Agregar otra cuenta» solo en escritorio, como el diseño.
- **Sí:** `/resumen` en `RUTAS_AFECTADAS` y en las acciones de cuentas: saldos iniciales, altas y archivos cambian el patrimonio y `cuentasActivas`.
- **Sí:** sin tooltip ni detalle por categoría: no están en el diseño ni en el inventario.
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Serie plana o de un punto: división por cero en la escala | `geometriaSerie` abre el rango alrededor del valor; prueba dedicada. |
| Patrimonio negativo | Rejilla y `formatearCompacto` con `−`; prueba dedicada. |
| `/resumen` desactualizado tras registrar o cambiar cuentas | `revalidatePath("/resumen")` en captura, movimientos y cuentas; criterio de aceptación. |
| El filtro web difiere de `sinCategoria.cantidad` | Misma definición que el contrato (gasto, sin categoría, sin partes); prueba de `esSinClasificar`. |
| Porcentajes con coma flotante | `formatearPorcentaje` opera sobre el entero en décimas con `%` y división entera. |
| La gráfica escala el texto al estirarse | `viewBox` distinto por formato; tamaños pensados para cada ancho. |
| Mes actual distinto entre `/resumen` (API) y `/movimientos?mes=` (perfil) | Ambos salen de la zona del perfil; sin `?mes` manda la API. |

## Lo que **no** entra en este spec

- TRM, avisos y entradas a secciones futuras.
- Revaluación de inversiones y USD.
- Otros informes y exportar.
- Filtros en `/movimientos` y clasificación en lote.
- Tooltip en la gráfica y detalle por categoría.

Cada uno, si llega, va en su propio spec.
