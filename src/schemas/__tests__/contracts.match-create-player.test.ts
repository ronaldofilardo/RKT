import { describe, it, expect } from "@jest/globals";
import { MatchSchema, CreatePlayerInputSchema } from "../contracts";
import { fullCreatePlayer, validMatch } from "./contractsTestKit";

describe("MatchSchema", () => {
  it("accepts valid match", () => {
    expect(MatchSchema.safeParse(validMatch).success).toBe(true);
  });

  it("rejects invalid format", () => {
    expect(MatchSchema.safeParse({ ...validMatch, format: "INVALID" }).success).toBe(false);
  });

  it("rejects invalid state", () => {
    expect(MatchSchema.safeParse({ ...validMatch, state: "INVALID" }).success).toBe(false);
  });
});

describe("CreatePlayerInputSchema", () => {
  it("accepts minimal valid input", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "Carlos" }).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("accepts all optional fields", () => {
    expect(CreatePlayerInputSchema.safeParse(fullCreatePlayer).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "X", email: "bad" }).success).toBe(false);
  });

  it("rejects age < 1 or > 120", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "X", age: 0 }).success).toBe(false);
    expect(CreatePlayerInputSchema.safeParse({ name: "X", age: 121 }).success).toBe(false);
  });
});
