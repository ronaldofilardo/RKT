import { describe, it, expect } from "@jest/globals";
import { LoginPayloadSchema, RankingEntrySchema, RankingsSchema } from "../contracts";
import { parsedError } from "./contractsTestKit";

describe("LoginPayloadSchema", () => {
  it("accepts identifier + password", () => {
    expect(LoginPayloadSchema.safeParse({ identifier: "user@test.com", password: "pass" }).success).toBe(true);
  });

  it("accepts email + password", () => {
    expect(LoginPayloadSchema.safeParse({ email: "user@test.com", password: "pass" }).success).toBe(true);
  });

  it("rejects when both identifier and email are missing", () => {
    const result = LoginPayloadSchema.safeParse({ password: "pass" });
    expect(result.success).toBe(false);
    expect(parsedError(result)).toContain("e-mail ou CPF");
  });

  it("rejects password shorter than 1", () => {
    expect(LoginPayloadSchema.safeParse({ identifier: "user", password: "" }).success).toBe(false);
  });
});

describe("RankingEntrySchema", () => {
  it("accepts valid ranking entry", () => {
    expect(RankingEntrySchema.safeParse({ position: 1 }).success).toBe(true);
  });

  it("accepts optional fields", () => {
    expect(
      RankingEntrySchema.safeParse({ position: 5, category: "U18", class: "A", juvenilePosition: 3 }).success,
    ).toBe(true);
  });

  it("rejects position < 1", () => {
    expect(RankingEntrySchema.safeParse({ position: 0 }).success).toBe(false);
  });
});

describe("RankingsSchema", () => {
  it("accepts valid rankings record", () => {
    expect(
      RankingsSchema.safeParse({
        ATP: { position: 1 },
        CBT: { position: 10 },
      }).success,
    ).toBe(true);
  });

  it("rejects invalid ranking type key", () => {
    expect(
      RankingsSchema.safeParse({ INVALID: { position: 1 } }).success,
    ).toBe(false);
  });
});
