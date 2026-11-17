import { describe, it, expect } from "@jest/globals";
import { ArrangementInputSchema } from "../contracts";
import { aliasedArrangement, parsedData, validArrangement } from "./contractsTestKit";

describe("ArrangementInputSchema", () => {
  it("aceita payload canônico com afterSet e version", () => {
    const res = ArrangementInputSchema.safeParse(validArrangement);
    expect(res.success).toBe(true);
    expect(parsedData(res).afterSet).toBe(1);
    expect(parsedData(res).version).toBe(5);
  });

  it("suporta aliases setIndex e expectedVersion via preprocess", () => {
    const res = ArrangementInputSchema.safeParse(aliasedArrangement);
    expect(res.success).toBe(true);
    expect(parsedData(res).afterSet).toBe(2);
    expect(parsedData(res).version).toBe(10);
  });

  it("rejeita serveOrder que não seja tupla de 2 strings", () => {
    const invalid = {
      ...validArrangement,
      serveOrder: {
        player1: ["p1"],
        player2: ["p2", "p2p"],
      },
    };
    expect(ArrangementInputSchema.safeParse(invalid).success).toBe(false);
  });
});
