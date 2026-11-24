import { enviar, ErrorApi, obtener } from "./cliente";
import { aTrm, tasaEnCentesimas, type Trm, type TrmDto } from "./trm";

/*
 * Contrato de Tino API (docs/api/cuentas.md, Tino-API SPEC 03, 10 y 14). Se
 * copia, no se redefine. Montos como string con un entero en unidades menores.
 */
export type Ref = { id: string; nombre: string };
/** `inversion`: solo la crea `POST /inversiones` (SPEC 10). */
export type TipoCuenta = "efectivo" | "banco" | "tarjeta_credito" | "inversion";
export type Naturaleza = "activo" | "pasivo";
export type Moneda = "COP" | "USD";

export type CuentaDto = {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  /** `"COP"` salvo en una inversión en dólares; fija. */
  moneda: Moneda;
  naturaleza: Naturaleza;
  detalle: string | null;
  /** En una inversión, su valor de mercado en COP (`"0"` si es USD y no hay TRM). */
  saldo: string;
  /** En una inversión, el efectivo inicial en su moneda. */
  saldoInicial: string;
  tarjeta: TarjetaDto | null;
  /** Solo en una inversión, en su moneda. `tasa`: TRM aplicada; `null` en COP o sin TRM. */
  inversion: { efectivo: string; valorMercado: string; tasa: string | null } | null;
  archivadaEn: string | null;
};

/** Tino-API SPEC 14. */
export type TarjetaDto = {
  cupo: string;
  disponible: string;
  porcentajeUsado: number;
  /** `null`: tarjeta sin condiciones (N-79). */
  diaCorte: number | null;
  diaPago: number | null;
  /** Centésimas de punto: 198 = 1,98 % M.V. */
  tasaMensual: number | null;
  /** Centésimas de punto: 2652 = 26,52 % E.A. */
  tasaEfectivaAnual: number | null;
  cuotaManejo: string | null;
  cuentaPago: Ref | null;
};

/** Condiciones de la tarjeta en `POST` y `PATCH /cuentas`. `null` en un opcional lo borra. */
export type CondicionesTarjeta = {
  diaCorte?: number;
  diaPago?: number;
  tasaMensual?: number | null;
  cuotaManejo?: string | null;
  cuentaPagoId?: string | null;
};

export type ListaArchivadasDto = { cuentas: CuentaDto[] };

/** Cuerpo de `POST /cuentas`. */
export type AltaCuenta = {
  nombre: string;
  tipo: TipoCuenta;
  detalle?: string;
  /** Entero ≥ 0, `^\d{1,19}$`. En la tarjeta, la deuda inicial. */
  saldoInicial: string;
  /** Obligatorio y > 0 en `tarjeta_credito`; prohibido en las demás. */
  cupo?: string;
  /** Obligatorio con `diaCorte` y `diaPago` en `tarjeta_credito`; prohibido en las demás (SPEC 14). */
  tarjeta?: CondicionesTarjeta;
};

/** Cuerpo de `PATCH /cuentas/:id`: solo los campos que cambian, al menos uno. */
export type EdicionCuenta = {
  nombre?: string;
  /** Solo dentro de la misma naturaleza: efectivo ↔ banco. */
  tipo?: TipoCuenta;
  /** `null` lo borra. */
  detalle?: string | null;
  saldoInicial?: string;
  /** Solo si la cuenta es `tarjeta_credito`; > 0. */
  cupo?: string;
  /** Solo en una tarjeta, parcial. La primera vez en una tarjeta sin condiciones, con los dos días. */
  tarjeta?: CondicionesTarjeta;
};

export type GrupoCuentasDto = {
  total: string;
  cuentas: CuentaDto[];
};

export type ListaCuentasDto = {
  fechaSaldos: string;
  activos: GrupoCuentasDto;
  pasivos: GrupoCuentasDto;
  patrimonioNeto: string;
  trm: TrmDto | null;
  trmDesactualizada: boolean;
};

/*
 * Modelo de la web. Todo monto en `bigint` (REGLAS §6). No se recalcula nada:
 * totales, disponible, porcentaje y patrimonio vienen de la API (REGLAS §5).
 */
export type Cuenta = {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  moneda: Moneda;
  naturaleza: Naturaleza;
  detalle: string | null;
  /** En un pasivo, la deuda, positiva. En una inversión, su valor de mercado en COP. */
  saldo: bigint;
  /** En un pasivo, la deuda inicial; en una inversión, el efectivo inicial en su moneda. Solo para editarlo. */
  saldoInicial: bigint;
  tarjeta: Tarjeta | null;
  /** Solo en una inversión, en su moneda. `tasa` en centésimas de peso por US$. */
  inversion: { efectivo: bigint; valorMercado: bigint; tasa: bigint | null } | null;
  /** ISO 8601, tal cual llega. `null` = no archivada. */
  archivadaEn: string | null;
};

/** Condiciones de la tarjeta en la web. Tasas en centésimas de punto; disponible y porcentaje de la API. */
export type Tarjeta = {
  cupo: bigint;
  disponible: bigint;
  porcentajeUsado: number;
  diaCorte: number | null;
  diaPago: number | null;
  tasaMensual: number | null;
  tasaEfectivaAnual: number | null;
  cuotaManejo: bigint | null;
  cuentaPago: Ref | null;
};

export type GrupoCuentas = { total: bigint; cuentas: Cuenta[] };

export type ListaCuentas = {
  /** `"YYYY-MM-DD"`, tal cual llega. */
  fechaSaldos: string;
  activos: GrupoCuentas;
  pasivos: GrupoCuentas;
  /** Ya con su signo. */
  patrimonioNeto: bigint;
  /** TRM de hoy para la cabecera; `null` si nunca se obtuvo. */
  trm: Trm | null;
  trmDesactualizada: boolean;
};

export type { Trm };

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
function aMonto(valor: string): bigint {
  return BigInt(valor);
}

export function aTarjeta(dto: TarjetaDto): Tarjeta {
  return {
    cupo: aMonto(dto.cupo),
    disponible: aMonto(dto.disponible),
    porcentajeUsado: dto.porcentajeUsado,
    diaCorte: dto.diaCorte,
    diaPago: dto.diaPago,
    tasaMensual: dto.tasaMensual,
    tasaEfectivaAnual: dto.tasaEfectivaAnual,
    cuotaManejo: dto.cuotaManejo === null ? null : aMonto(dto.cuotaManejo),
    cuentaPago: dto.cuentaPago,
  };
}

export function aCuenta(dto: CuentaDto): Cuenta {
  return {
    id: dto.id,
    nombre: dto.nombre,
    tipo: dto.tipo,
    moneda: dto.moneda,
    naturaleza: dto.naturaleza,
    detalle: dto.detalle,
    saldo: aMonto(dto.saldo),
    saldoInicial: aMonto(dto.saldoInicial),
    tarjeta: dto.tarjeta && aTarjeta(dto.tarjeta),
    inversion: dto.inversion && {
      efectivo: aMonto(dto.inversion.efectivo),
      valorMercado: aMonto(dto.inversion.valorMercado),
      tasa: dto.inversion.tasa === null ? null : tasaEnCentesimas(dto.inversion.tasa),
    },
    archivadaEn: dto.archivadaEn,
  };
}

function aGrupo(dto: GrupoCuentasDto): GrupoCuentas {
  // El orden del arreglo es el del usuario: no se reordena (N-25, N-28).
  return { total: aMonto(dto.total), cuentas: dto.cuentas.map(aCuenta) };
}

export function aListaCuentas(dto: ListaCuentasDto): ListaCuentas {
  return {
    fechaSaldos: dto.fechaSaldos,
    activos: aGrupo(dto.activos),
    pasivos: aGrupo(dto.pasivos),
    patrimonioNeto: aMonto(dto.patrimonioNeto),
    trm: dto.trm && aTrm(dto.trm),
    trmDesactualizada: dto.trmDesactualizada,
  };
}

/** `GET /cuentas`: cuentas no archivadas, agrupadas, con totales y patrimonio. */
export async function listarCuentas(): Promise<ListaCuentas> {
  const dto = await obtener<ListaCuentasDto>("/cuentas");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /cuentas.");
  return aListaCuentas(dto);
}

/** `PUT /cuentas/orden`: guarda el orden completo de un grupo. Atómico en la API. */
export async function guardarOrdenGrupo(naturaleza: Naturaleza, ids: string[]): Promise<void> {
  await enviar<null>("PUT", "/cuentas/orden", { naturaleza, ids });
}

/** Ruta de una cuenta. `id` ya validado como UUID por quien llama; se codifica igual. */
function rutaCuenta(id: string, sufijo = ""): string {
  return `/cuentas/${encodeURIComponent(id)}${sufijo}`;
}

/** Respuesta que debía traer una `CuentaDto` y llegó vacía. */
function cuentaDe(dto: CuentaDto | null, ruta: string): Cuenta {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió la cuenta en ${ruta}.`);
  return aCuenta(dto);
}

/**
 * `GET /cuentas/:id`, también archivada. `null` si la API responde 404
 * (`CUENTA_NO_ENCONTRADA`: inexistente, de otro usuario o préstamo).
 */
export async function obtenerCuenta(id: string): Promise<Cuenta | null> {
  const dto = await obtener<CuentaDto>(rutaCuenta(id));
  return dto && aCuenta(dto);
}

/** `POST /cuentas`: la API la pone al final de su grupo. */
export async function crearCuenta(alta: AltaCuenta): Promise<Cuenta> {
  return cuentaDe(await enviar<CuentaDto>("POST", "/cuentas", alta), "/cuentas");
}

/** `PATCH /cuentas/:id` con solo los campos que cambian. */
export async function editarCuenta(id: string, edicion: EdicionCuenta): Promise<Cuenta> {
  const ruta = rutaCuenta(id);
  return cuentaDe(await enviar<CuentaDto>("PATCH", ruta, edicion), ruta);
}

/** `DELETE /cuentas/:id`: borrado definitivo, archivada o no. */
export async function eliminarCuenta(id: string): Promise<void> {
  await enviar<null>("DELETE", rutaCuenta(id));
}

/** `POST /cuentas/:id/archivar`: solo con saldo cero (`SALDO_NO_CERO`). */
export async function archivarCuenta(id: string): Promise<Cuenta> {
  const ruta = rutaCuenta(id, "/archivar");
  return cuentaDe(await enviar<CuentaDto>("POST", ruta), ruta);
}

/** `POST /cuentas/:id/restaurar`. Sin `nombre`, sin cuerpo; con él, la restaura con ese nombre. */
export async function restaurarCuenta(id: string, nombre?: string): Promise<Cuenta> {
  const ruta = rutaCuenta(id, "/restaurar");
  return cuentaDe(await enviar<CuentaDto>("POST", ruta, nombre === undefined ? undefined : { nombre }), ruta);
}

/** `GET /cuentas/archivadas`: la archivada más reciente primero (orden de la API). */
export async function listarArchivadas(): Promise<Cuenta[]> {
  const dto = await obtener<ListaArchivadasDto>("/cuentas/archivadas");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /cuentas/archivadas.");
  return dto.cuentas.map(aCuenta);
}
