import { describe, it, expect } from "@jest/globals";
import { RallyDetailsSchema } from "../contracts";
import { fullRally, validRally } from "./contractsTestKit";

describe("RallyDetailsSchema", () => {
  it("accepts minimal valid object", () => {
    expect(RallyDetailsSchema.safeParse(validRally).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    expect(RallyDetailsSchema.safeParse(fullRally).success).toBe(true);
  });

  it("rejects when required fields are missing", () => {
    expect(RallyDetailsSchema.safeParse({}).success).toBe(false);
  });

  it("rejects negative previewBalls", () => {
    expect(RallyDetailsSchema.safeParse({ ...validRally, previewBalls: -1 }).success).toBe(false);
  });

  it("rejects note exceeding 500 chars", () => {
    expect(RallyDetailsSchema.safeParse({ ...validRally, note: "x".repeat(501) }).success).toBe(false);
  });

  it("accepts note at exactly 500 chars", () => {
    expect(RallyDetailsSchema.safeParse({ ...validRally, note: "x".repeat(500) }).success).toBe(true);
  });
});
