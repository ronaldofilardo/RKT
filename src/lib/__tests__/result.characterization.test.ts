/**
 * Characterization tests for Result<T, E> utility.
 */

import { ok, err, isOk, isErr, tryAsync } from "@/lib/result";

describe("Result<T, E>", () => {
  describe("ok()", () => {
    it("cria um Result success com value", () => {
      const r = ok(42);
      expect(r.success).toBe(true);
      if (r.success) expect(r.value).toBe(42);
    });
  });

  describe("err()", () => {
    it("cria um Result failure com error", () => {
      const e = new Error("oops");
      const r = err(e);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error).toBe(e);
    });
  });

  describe("isOk() type guard", () => {
    it("retorna true para success", () => {
      const r = ok(1);
      expect(isOk(r)).toBe(true);
    });

    it("retorna false para failure", () => {
      const r = err(new Error("x"));
      expect(isOk(r)).toBe(false);
    });
  });

  describe("isErr() type guard", () => {
    it("retorna true para failure", () => {
      const r = err(new Error("x"));
      expect(isErr(r)).toBe(true);
    });

    it("retorna false para success", () => {
      const r = ok(1);
      expect(isErr(r)).toBe(false);
    });
  });

  describe("tryAsync()", () => {
    it("retorna success quando a promise resolve", async () => {
      const r = await tryAsync(async () => "ok");
      expect(r.success).toBe(true);
      if (r.success) expect(r.value).toBe("ok");
    });

    it("retorna failure com Error quando promise rejeita com Error", async () => {
      const error = new Error("async fail");
      const r = await tryAsync(async () => {
        throw error;
      });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error).toBe(error);
    });

    it("wrapa non-Error throws em Error", async () => {
      const r = await tryAsync(async () => {
        throw "string error";
      });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.message).toBe("string error");
    });

    it("wrapa null throws em Error", async () => {
      const r = await tryAsync(async () => {
        throw null;
      });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.message).toBe("null");
    });
  });
});
