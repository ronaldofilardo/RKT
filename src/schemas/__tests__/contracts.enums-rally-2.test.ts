import { describe, it, expect } from "@jest/globals";
import {
  RallySubtipo1Schema,
  RallySubtipo2Schema,
  RallyEfeitoSchema,
  RallyDirecaoSchema,
  RallyGolpeEspSchema,
  RallyDurationSchema,
} from "../contracts";
import { rallyDirecaoValues, rallyGolpeEspValues } from "./contractsTestKit";

describe("Enum Schemas", () => {
  describe("RallySubtipo1Schema", () => {
    it("accepts passing_shot and devolucao_saque", () => {
      expect(RallySubtipo1Schema.safeParse("passing_shot").success).toBe(true);
      expect(RallySubtipo1Schema.safeParse("devolucao_saque").success).toBe(true);
    });
  });

  describe("RallySubtipo2Schema", () => {
    it("accepts out and net", () => {
      expect(RallySubtipo2Schema.safeParse("out").success).toBe(true);
      expect(RallySubtipo2Schema.safeParse("net").success).toBe(true);
    });
  });

  describe("RallyEfeitoSchema", () => {
    it.each(["topspin", "slice", "flat"])("accepts '%s'", (v) => {
      expect(RallyEfeitoSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyDirecaoSchema", () => {
    it.each(rallyDirecaoValues)("accepts '%s'", (v) => {
      expect(RallyDirecaoSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyGolpeEspSchema", () => {
    it.each(rallyGolpeEspValues)("accepts '%s'", (v) => {
      expect(RallyGolpeEspSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyDurationSchema", () => {
    it.each(["opcao_1", "opcao_2", "opcao_3"])("accepts '%s'", (v) => {
      expect(RallyDurationSchema.safeParse(v).success).toBe(true);
    });
  });
});
