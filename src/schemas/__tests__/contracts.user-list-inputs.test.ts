import { describe, it, expect } from "@jest/globals";
import { CreateUserInputSchema, ListPlayersInputSchema, ListUsersInputSchema } from "../contracts";
import { parsedData, validCreateUser } from "./contractsTestKit";

describe("CreateUserInputSchema", () => {
  it("accepts valid input", () => {
    expect(CreateUserInputSchema.safeParse(validCreateUser).success).toBe(true);
  });

  it("rejects password shorter than 6", () => {
    expect(CreateUserInputSchema.safeParse({ ...validCreateUser, password: "12345" }).success).toBe(false);
  });

  it("rejects CPF shorter than 11", () => {
    expect(CreateUserInputSchema.safeParse({ ...validCreateUser, cpf: "123" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(CreateUserInputSchema.safeParse({ ...validCreateUser, email: "bad" }).success).toBe(false);
  });
});

describe("ListPlayersInputSchema", () => {
  it("applies default limit = 20", () => {
    const result = ListPlayersInputSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(parsedData(result).limit).toBe(20);
  });

  it("accepts valid cursor and limit", () => {
    expect(ListPlayersInputSchema.safeParse({ cursor: "abc", limit: 50 }).success).toBe(true);
  });

  it("rejects limit < 1", () => {
    expect(ListPlayersInputSchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects limit > 100", () => {
    expect(ListPlayersInputSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe("ListUsersInputSchema", () => {
  it("applies default limit = 20", () => {
    const result = ListUsersInputSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(parsedData(result).limit).toBe(20);
  });

  it("accepts role filter", () => {
    expect(ListUsersInputSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
  });
});
