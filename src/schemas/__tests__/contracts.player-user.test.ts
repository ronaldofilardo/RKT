import { describe, it, expect } from "@jest/globals";
import { PlayerSchema, UserSchema } from "../contracts";
import { parsedData, validUser } from "./contractsTestKit";

describe("PlayerSchema", () => {
  it("accepts valid player with CUID", () => {
    expect(PlayerSchema.safeParse({ id: "cmtyiva2i000210t43n1z2i7l", name: "Alcaraz" }).success).toBe(true);
  });

  it("accepts valid player with UUID", () => {
    expect(PlayerSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000", name: "Sinner" }).success).toBe(true);
  });

  it("accepts valid player with seed ID", () => {
    expect(PlayerSchema.safeParse({ id: "seed_player_alcaraz", name: "Carlos" }).success).toBe(true);
  });

  it("accepts player with optional club", () => {
    expect(PlayerSchema.safeParse({ id: "seed_player_1", name: "Carlos", club: "RKT" }).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(PlayerSchema.safeParse({ id: "seed_player_1", name: "A" }).success).toBe(false);
  });

  it("rejects invalid ID format", () => {
    expect(PlayerSchema.safeParse({ id: "invalid id!", name: "X" }).success).toBe(false);
  });
});

describe("UserSchema", () => {
  it("accepts valid user", () => {
    expect(UserSchema.safeParse(validUser).success).toBe(true);
  });

  it("applies default isActive = true", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    expect(parsedData(result).isActive).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(UserSchema.safeParse({ ...validUser, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(UserSchema.safeParse({ ...validUser, name: "X" }).success).toBe(false);
  });

  it("accepts nullish club", () => {
    expect(UserSchema.safeParse({ ...validUser, club: null }).success).toBe(true);
    expect(UserSchema.safeParse({ ...validUser, club: undefined }).success).toBe(true);
  });
});
