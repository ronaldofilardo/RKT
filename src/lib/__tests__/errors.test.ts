import {
  ApiError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  MethodNotAllowedError,
  RateLimitError,
} from "../errors";

describe("ApiError", () => {
  it("should create an ApiError with code, details, and status", () => {
    const err = new ApiError("TEST_CODE", { field: "x" }, 500);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("TEST_CODE");
    expect(err.details).toEqual({ field: "x" });
    expect(err.status).toBe(500);
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("TEST_CODE");
  });

  it("should default status to 400", () => {
    const err = new ApiError("ERR");
    expect(err.status).toBe(400);
    expect(err.details).toBeUndefined();
  });
});

describe("ValidationError", () => {
  it("should set code VALIDATION_ERROR and status 400", () => {
    const err = new ValidationError({ email: ["invalido"] });
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.status).toBe(400);
    expect(err.name).toBe("ValidationError");
    expect(err.details).toEqual({ email: ["invalido"] });
  });
});

describe("NotFoundError", () => {
  it("should set code NOT_FOUND and status 404", () => {
    const err = new NotFoundError("Match", "abc123");
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
    expect(err.name).toBe("NotFoundError");
    expect(err.details).toEqual({ resource: "Match", id: "abc123" });
  });
});

describe("ForbiddenError", () => {
  it("should set code FORBIDDEN and status 403", () => {
    const err = new ForbiddenError("ADMIN", "USER");
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.name).toBe("ForbiddenError");
    expect(err.details).toEqual({ requiredRole: "ADMIN", currentRole: "USER" });
  });

  it("should handle missing currentRole", () => {
    const err = new ForbiddenError("ADMIN");
    expect(err.details).toEqual({ requiredRole: "ADMIN", currentRole: undefined });
  });
});

describe("UnauthorizedError", () => {
  it("should set code UNAUTHORIZED and status 401", () => {
    const err = new UnauthorizedError("Token expirado");
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.status).toBe(401);
    expect(err.name).toBe("UnauthorizedError");
    expect(err.details).toEqual({ message: "Token expirado" });
  });

  it("should default message to 'Nao autorizado'", () => {
    const err = new UnauthorizedError();
    expect(err.details).toEqual({ message: "Não autorizado" });
  });
});

describe("ConflictError", () => {
  it("should set code CONFLICT and status 409 with flat existing object", () => {
    const existing = { id: "m1", playerP1: "p1", playerP2: "p2" };
    const err = new ConflictError("Partida ja existe", existing);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("CONFLICT");
    expect(err.status).toBe(409);
    expect(err.name).toBe("ConflictError");
    expect(err.details).toEqual(existing);
  });

  it("should handle missing existing", () => {
    const err = new ConflictError("Duplicate");
    expect(err.details).toBeUndefined();
  });
});

describe("MethodNotAllowedError", () => {
  it("should set code METHOD_NOT_ALLOWED and status 405", () => {
    const err = new MethodNotAllowedError("GET");
    expect(err).toBeInstanceOf(MethodNotAllowedError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("METHOD_NOT_ALLOWED");
    expect(err.status).toBe(405);
    expect(err.name).toBe("MethodNotAllowedError");
    expect(err.details).toEqual({ method: "GET" });
  });
});

describe("RateLimitError", () => {
  it("should set code RATE_LIMIT_EXCEEDED and status 429", () => {
    const err = new RateLimitError("login", 10, "1h");
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(err.status).toBe(429);
    expect(err.name).toBe("RateLimitError");
    expect(err.details).toEqual({ endpoint: "login", limit: 10, window: "1h" });
  });
});

describe("inheritance chain", () => {
  it("all custom errors should be instance of ApiError and Error", () => {
    const errors = [
      new ValidationError({}),
      new NotFoundError("R", "1"),
      new ForbiddenError("ADMIN"),
      new UnauthorizedError(),
      new ConflictError("msg"),
      new MethodNotAllowedError("POST"),
      new RateLimitError("ep", 1, "1s"),
    ];
    for (const e of errors) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e).toBeInstanceOf(Error);
    }
  });
});
