import { describe, it, expect } from "@jest/globals";
import { CreateMatchInputSchema, DeleteMatchInputSchema, FinishMatchInputSchema } from "../contracts";
import { fullCreateMatch, fullFinishMatch, parsedError, validCreateMatch } from "./contractsTestKit";

describe("CreateMatchInputSchema", () => {
  it("accepts valid input", () => {
    expect(CreateMatchInputSchema.safeParse(validCreateMatch).success).toBe(true);
  });

  it("rejects when player1Id === player2Id", () => {
    const result = CreateMatchInputSchema.safeParse({ ...validCreateMatch, player2Id: "player-1" });
    expect(result.success).toBe(false);
    expect(parsedError(result)).toContain("diferente");
  });

  it("accepts optional fields", () => {
    expect(CreateMatchInputSchema.safeParse(fullCreateMatch).success).toBe(true);
  });
});

describe("DeleteMatchInputSchema", () => {
  it("accepts soft delete", () => {
    expect(DeleteMatchInputSchema.safeParse({ type: "soft" }).success).toBe(true);
  });

  it("accepts hard delete with reason", () => {
    expect(DeleteMatchInputSchema.safeParse({ type: "hard", reason: "test" }).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(DeleteMatchInputSchema.safeParse({ type: "invalid" }).success).toBe(false);
  });

  it("rejects reason > 500 chars", () => {
    expect(DeleteMatchInputSchema.safeParse({ type: "soft", reason: "x".repeat(501) }).success).toBe(false);
  });
});

describe("FinishMatchInputSchema", () => {
  it("accepts valid finish with reason", () => {
    expect(FinishMatchInputSchema.safeParse({ reason: "COMPLETED" }).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    expect(FinishMatchInputSchema.safeParse(fullFinishMatch).success).toBe(true);
  });

  it("rejects invalid reason", () => {
    expect(FinishMatchInputSchema.safeParse({ reason: "INVALID" }).success).toBe(false);
  });
});
