import { describe, expect, it } from "vitest";
import { aplicarCambio, rotuloOpcion, TIPOS, zonaLegible } from "./antelacion";
import type { AvisoConfig } from "./presentacion";

const CONFIG: AvisoConfig[] = [
  { tipo: "recurrente", activo: true, dias: 3, opciones: [1, 3, 5, 7] },
  { tipo: "cobro", activo: true, dias: 30, opciones: [0, 14, 30] },
  { tipo: "deuda", activo: true, dias: 3, opciones: [1, 3, 7] },
  { tipo: "precio_manual", activo: false, dias: 7, opciones: [3, 7, 14] },
];

describe("TIPOS", () => {
  it("nombra los cuatro tipos con su prefijo", () => {
    expect(TIPOS.recurrente).toEqual({
      rotulo: "Recurrentes por confirmar",
      descripcion: "Cuando aparecen en la bandeja, antes de vencer.",
      prefijo: "Avisar",
    });
    expect(TIPOS.cobro.prefijo).toBe("Repetir después");
    expect(TIPOS.deuda.rotulo).toBe("Lo que debes");
    expect(TIPOS.precio_manual.prefijo).toBe("Después de");
  });
});

describe("rotuloOpcion", () => {
  it.each([
    ["recurrente", 1, "1 día antes"],
    ["recurrente", 3, "3 días antes"],
    ["recurrente", 5, "5 días antes"],
    ["recurrente", 7, "1 semana antes"],
    ["cobro", 0, "Nunca"],
    ["cobro", 14, "Cada 2 semanas"],
    ["cobro", 30, "Cada mes"],
    ["deuda", 1, "1 día antes"],
    ["deuda", 3, "3 días antes"],
    ["deuda", 7, "1 semana antes"],
    ["precio_manual", 3, "3 días"],
    ["precio_manual", 7, "7 días"],
    ["precio_manual", 14, "14 días"],
  ] as const)("%s %i → %s", (tipo, dias, rotulo) => {
    expect(rotuloOpcion(tipo, dias)).toBe(rotulo);
  });

  it("un valor desconocido dice sus días, con «antes» si el prefijo es «Avisar»", () => {
    expect(rotuloOpcion("recurrente", 10)).toBe("10 días antes");
    expect(rotuloOpcion("deuda", 2)).toBe("2 días antes");
    expect(rotuloOpcion("cobro", 60)).toBe("60 días");
    expect(rotuloOpcion("precio_manual", 21)).toBe("21 días");
  });
});

describe("aplicarCambio", () => {
  it("la casilla cambia solo `activo` de su tipo", () => {
    const tras = aplicarCambio(CONFIG, "recurrente", { activo: false });
    expect(tras[0]).toEqual({ ...CONFIG[0], activo: false });
    expect(tras.slice(1)).toEqual(CONFIG.slice(1));
  });

  it("elegir `dias` sin `activo` enciende el tipo", () => {
    const tras = aplicarCambio(CONFIG, "precio_manual", { dias: 14 });
    expect(tras[3]).toEqual({ ...CONFIG[3], activo: true, dias: 14 });
    expect(tras.slice(0, 3)).toEqual(CONFIG.slice(0, 3));
  });

  it("`dias` con `activo` respeta `activo`", () => {
    expect(aplicarCambio(CONFIG, "cobro", { dias: 14, activo: false })[1]).toEqual({ ...CONFIG[1], dias: 14, activo: false });
  });
});

describe("zonaLegible", () => {
  it("nombra la zona del perfil", () => {
    expect(zonaLegible("America/Bogota")).toBe("hora de Colombia");
  });

  it("una zona inválida queda tal cual", () => {
    expect(zonaLegible("Marte/Olympus")).toBe("Marte/Olympus");
  });
});
