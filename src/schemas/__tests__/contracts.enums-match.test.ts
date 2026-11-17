import { describe, it, expect } from "@jest/globals";
import {
  RoleSchema,
  MatchStateSchema,
  MatchFinishReasonSchema,
  MatchFormatSchema,
  PointTypeSchema,
  AnnotationSessionStatusSchema,
} from "../contracts";
import {
  annotationSessionStatusValues,
  matchFinishReasonValues,
  matchFormatValues,
  matchStateValues,
  pointTypeValues,
} from "./contractsTestKit";

describe("Enum Schemas", () => {
  describe("RoleSchema", () => {
    it("accepts ADMIN and ANNOTATOR", () => {
      expect(RoleSchema.safeParse("ADMIN").success).toBe(true);
      expect(RoleSchema.safeParse("ANNOTATOR").success).toBe(true);
    });
    it("rejects USER", () => {
      expect(RoleSchema.safeParse("USER").success).toBe(false);
    });
  });

  describe("MatchStateSchema", () => {
    it.each(matchStateValues)("accepts '%s'", (v) => {
      expect(MatchStateSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("MatchFinishReasonSchema", () => {
    it.each(matchFinishReasonValues)("accepts '%s'", (v) => {
      expect(MatchFinishReasonSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("MatchFormatSchema", () => {
    it.each(matchFormatValues)("accepts '%s'", (v) => {
      expect(MatchFormatSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid format", () => {
      expect(MatchFormatSchema.safeParse("BEST_OF_7").success).toBe(false);
    });
  });

  describe("PointTypeSchema", () => {
    it.each(pointTypeValues)("accepts '%s'", (v) => {
      expect(PointTypeSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("AnnotationSessionStatusSchema", () => {
    it.each(annotationSessionStatusValues)("accepts '%s'", (v) => {
      expect(AnnotationSessionStatusSchema.safeParse(v).success).toBe(true);
    });
  });
});
