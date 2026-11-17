import { describe, it, expect } from "@jest/globals";
import { VencedorSchema, RallySituacaoSchema, RallyTipoSchema, RallyGolpeSchema } from "../contracts";
import { rallyGolpeValues, rallySituacaoValues, rallyTipoValues } from "./contractsTestKit";

describe("Enum Schemas", () => {
  describe("VencedorSchema", () => {
    it("accepts valid values", () => {
      expect(VencedorSchema.safeParse("sacador").success).toBe(true);
      expect(VencedorSchema.safeParse("devolvedor").success).toBe(true);
    });
    it("rejects invalid values", () => {
      expect(VencedorSchema.safeParse("invalid").success).toBe(false);
    });
  });

  describe("RallySituacaoSchema", () => {
    it.each(rallySituacaoValues)("accepts '%s'", (v) => {
      expect(RallySituacaoSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid", () => {
      expect(RallySituacaoSchema.safeParse("foo").success).toBe(false);
    });
  });

  describe("RallyTipoSchema", () => {
    it.each(rallyTipoValues)("accepts '%s'", (v) => {
      expect(RallyTipoSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid", () => {
      expect(RallyTipoSchema.safeParse("ace").success).toBe(false);
    });
  });

  describe("RallyGolpeSchema", () => {
    it.each(rallyGolpeValues)("accepts '%s'", (v) => {
      expect(RallyGolpeSchema.safeParse(v).success).toBe(true);
    });
  });
});
