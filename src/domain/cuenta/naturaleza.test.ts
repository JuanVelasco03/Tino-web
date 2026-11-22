import { describe, expect, it } from "vitest";
import { admiteGastoIngreso, efectoEnPatrimonio, efectoEnSaldo, naturalezaDe, type TipoCuenta } from "./naturaleza";

describe("naturalezaDe (RN-02)", () => {
  it.each<[TipoCuenta, "activo" | "pasivo"]>([
    ["efectivo", "activo"],
    ["banco", "activo"],
    ["inversion", "activo"],
    ["prestamo_otorgado", "activo"], // me deben: es un activo
    ["tarjeta_credito", "pasivo"],
    ["deuda_contraida", "pasivo"], // yo debo: es un pasivo
  ])("%s es %s", (tipo, esperada) => {
    expect(naturalezaDe(tipo)).toBe(esperada);
  });
});

describe("efectoEnSaldo — gasto (salida) (RN-02)", () => {
  it("un gasto en efectivo reduce el saldo", () => {
    expect(efectoEnSaldo("efectivo", "salida", 15_000n)).toBe(-15_000n);
  });

  it("un gasto desde la cuenta bancaria reduce el saldo", () => {
    expect(efectoEnSaldo("banco", "salida", 120_000n)).toBe(-120_000n);
  });

  it("un consumo con tarjeta de crédito aumenta la deuda", () => {
    expect(efectoEnSaldo("tarjeta_credito", "salida", 350_000n)).toBe(350_000n);
  });

  it("un retiro de la cuenta de inversión reduce la posición", () => {
    expect(efectoEnSaldo("inversion", "salida", 500_000n)).toBe(-500_000n);
  });

  it("la devolución de un préstamo (salida de la cuenta de préstamo) reduce lo que me deben", () => {
    expect(efectoEnSaldo("prestamo_otorgado", "salida", 200_000n)).toBe(-200_000n);
  });

  it("un cargo sobre la deuda contraída aumenta lo que debo", () => {
    expect(efectoEnSaldo("deuda_contraida", "salida", 80_000n)).toBe(80_000n);
  });
});

describe("efectoEnSaldo — ingreso (entrada) (RN-02)", () => {
  it("un ingreso en el banco aumenta el saldo", () => {
    expect(efectoEnSaldo("banco", "entrada", 3_500_000n)).toBe(3_500_000n);
  });

  it("un ingreso en efectivo aumenta el saldo", () => {
    expect(efectoEnSaldo("efectivo", "entrada", 40_000n)).toBe(40_000n);
  });

  it("un abono a la tarjeta de crédito reduce la deuda", () => {
    expect(efectoEnSaldo("tarjeta_credito", "entrada", 300_000n)).toBe(-300_000n);
  });

  it("entregar un préstamo (entrada a la cuenta de préstamo) aumenta lo que me deben", () => {
    expect(efectoEnSaldo("prestamo_otorgado", "entrada", 100_000n)).toBe(100_000n);
  });

  it("pagar la deuda contraída reduce lo que debo", () => {
    expect(efectoEnSaldo("deuda_contraida", "entrada", 250_000n)).toBe(-250_000n);
  });

  it("una inversión que recibe dinero aumenta la posición", () => {
    expect(efectoEnSaldo("inversion", "entrada", 1_000_000n)).toBe(1_000_000n);
  });
});

describe("efectoEnPatrimonio (signo en la lista general)", () => {
  it("un gasto desde un activo reduce el patrimonio", () => {
    expect(efectoEnPatrimonio("banco", "salida", 18_500n)).toBe(-18_500n);
  });

  it("un consumo con tarjeta también reduce el patrimonio (más deuda)", () => {
    expect(efectoEnPatrimonio("tarjeta_credito", "salida", 27_900n)).toBe(-27_900n);
  });

  it("un ingreso a un activo aumenta el patrimonio", () => {
    expect(efectoEnPatrimonio("banco", "entrada", 4_850_000n)).toBe(4_850_000n);
  });

  it("abonar a la tarjeta (menos deuda) aumenta el patrimonio de esa cuenta", () => {
    expect(efectoEnPatrimonio("tarjeta_credito", "entrada", 1_200_000n)).toBe(1_200_000n);
  });
});

describe("admiteGastoIngreso", () => {
  it("una inversión solo admite transferencias", () => {
    expect(admiteGastoIngreso("inversion")).toBe(false);
  });

  it("las demás cuentas sí", () => {
    for (const tipo of ["efectivo", "banco", "tarjeta_credito"] as const) expect(admiteGastoIngreso(tipo)).toBe(true);
  });
});
