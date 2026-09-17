import { describe, it, expect } from "@jest/globals";
import {
  VencedorSchema,
  RallySituacaoSchema,
  RallyTipoSchema,
  RallyGolpeSchema,
  RallySubtipo1Schema,
  RallySubtipo2Schema,
  RallyEfeitoSchema,
  RallyDirecaoSchema,
  RallyGolpeEspSchema,
  RallyDurationSchema,
  RallyDetailsSchema,
  RoleSchema,
  MatchStateSchema,
  MatchFinishReasonSchema,
  MatchFormatSchema,
  PointTypeSchema,
  PlayerSchema,
  UserSchema,
  GameScoreSchema,
  SetScoreSchema,
  MatchScoreStateSchema,
  MatchSchema,
  CreatePlayerInputSchema,
  CreateUserInputSchema,
  ListPlayersInputSchema,
  ListUsersInputSchema,
  CreateMatchInputSchema,
  DeleteMatchInputSchema,
  FinishMatchInputSchema,
  AnnotationSessionStatusSchema,
  LoginPayloadSchema,
  RankingEntrySchema,
  RankingsSchema,
} from "../contracts";

describe("Enum Schemas", () => {
  describe("VencedorSchema", () => {
    it("accepts valid values", () => {
      expect(VencedorSchema.safeParse("sacador").success).toBe(true);
      expect(VencedorSchema.safeParse("devolvedor").success).toBe(true);
    });
    it("rejects invalid values", () => {
      expect(VencedorSchema.safeParse("invalid").success).toBe(false);
    });
  });

  describe("RallySituacaoSchema", () => {
    const valid = ["devolucao", "fundo", "passada", "rede", "saque"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(RallySituacaoSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid", () => {
      expect(RallySituacaoSchema.safeParse("foo").success).toBe(false);
    });
  });

  describe("RallyTipoSchema", () => {
    const valid = ["erro_nao_forcado", "erro_forcado", "winner", "dupla_falta"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(RallyTipoSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid", () => {
      expect(RallyTipoSchema.safeParse("ace").success).toBe(false);
    });
  });

  describe("RallyGolpeSchema", () => {
    const valid = ["fh", "bh", "vfh", "vbh", "smash", "saque"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(RallyGolpeSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallySubtipo1Schema", () => {
    it("accepts passing_shot and devolucao_saque", () => {
      expect(RallySubtipo1Schema.safeParse("passing_shot").success).toBe(true);
      expect(RallySubtipo1Schema.safeParse("devolucao_saque").success).toBe(true);
    });
  });

  describe("RallySubtipo2Schema", () => {
    it("accepts out and net", () => {
      expect(RallySubtipo2Schema.safeParse("out").success).toBe(true);
      expect(RallySubtipo2Schema.safeParse("net").success).toBe(true);
    });
  });

  describe("RallyEfeitoSchema", () => {
    it.each(["topspin", "slice", "flat"])("accepts '%s'", (v) => {
      expect(RallyEfeitoSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyDirecaoSchema", () => {
    const valid = ["cruzada", "paralela", "centro", "inside_out", "inside_in", "aberto", "fechado"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(RallyDirecaoSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyGolpeEspSchema", () => {
    const valid = ["lob", "drop_shot", "bate_pronto", "swing_volley"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(RallyGolpeEspSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("RallyDurationSchema", () => {
    it.each(["opcao_1", "opcao_2", "opcao_3"])("accepts '%s'", (v) => {
      expect(RallyDurationSchema.safeParse(v).success).toBe(true);
    });
  });

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
    const valid = ["SCHEDULED", "IN_PROGRESS", "FINISHED", "CANCELLED"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(MatchStateSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("MatchFinishReasonSchema", () => {
    const valid = ["COMPLETED", "ABANDONED", "WALKOVER", "INJURY", "OUTRO"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(MatchFinishReasonSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("MatchFormatSchema", () => {
    const valid = [
      "BEST_OF_3",
      "BEST_OF_3_MATCH_TB",
      "BEST_OF_3_NO_AD",
      "BEST_OF_5",
      "SHORT_SET_2V2_NO_AD",
      "MATCH_TB_10",
      "PRO_SET_8",
    ];
    it.each(valid)("accepts '%s'", (v) => {
      expect(MatchFormatSchema.safeParse(v).success).toBe(true);
    });
    it("rejects invalid format", () => {
      expect(MatchFormatSchema.safeParse("BEST_OF_7").success).toBe(false);
    });
  });

  describe("PointTypeSchema", () => {
    const valid = ["ACE", "WINNER", "FORCED_ERROR", "UNFORCED_ERROR", "DOUBLE_FAULT", "FAULT_FIRST", "FAULT_SECOND"];
    it.each(valid)("accepts '%s'", (v) => {
      expect(PointTypeSchema.safeParse(v).success).toBe(true);
    });
  });

  describe("AnnotationSessionStatusSchema", () => {
    it.each(["IN_PROGRESS", "COMPLETED", "ABANDONED"])("accepts '%s'", (v) => {
      expect(AnnotationSessionStatusSchema.safeParse(v).success).toBe(true);
    });
  });
});

describe("RallyDetailsSchema", () => {
  const validRally = {
    vencedor: "sacador",
    situacao: "saque",
    tipo: "winner",
    golpe: "saque",
    previewBalls: 1,
  };

  it("accepts minimal valid object", () => {
    expect(RallyDetailsSchema.safeParse(validRally).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const full = {
      ...validRally,
      direcao: "cruzada",
      efeito: "topspin",
      golpe_esp: "lob",
      subtipo1: "passing_shot",
      subtipo2: "out",
      duracao: "opcao_1",
      rallyLength: 10,
      note: "great point",
    };
    expect(RallyDetailsSchema.safeParse(full).success).toBe(true);
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
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Admin User",
    email: "admin@test.com",
    cpf: "12345678901",
    role: "ADMIN",
  };

  it("accepts valid user", () => {
    expect(UserSchema.safeParse(validUser).success).toBe(true);
  });

  it("applies default isActive = true", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
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

describe("GameScoreSchema", () => {
  it("accepts valid game score", () => {
    expect(GameScoreSchema.safeParse({ player1: 0, player2: 0 }).success).toBe(true);
  });

  it("accepts with optional deuce and advantage", () => {
    expect(
      GameScoreSchema.safeParse({ player1: 3, player2: 3, isDeuce: true, advantage: "player1", secondServe: true }).success,
    ).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(GameScoreSchema.safeParse({ player1: -1, player2: 0 }).success).toBe(false);
  });
});

describe("SetScoreSchema", () => {
  it("accepts valid set score", () => {
    expect(SetScoreSchema.safeParse({ player1: 6, player2: 4 }).success).toBe(true);
  });

  it("accepts tiebreak score", () => {
    expect(
      SetScoreSchema.safeParse({
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      }).success,
    ).toBe(true);
  });

  it("rejects non-integer scores", () => {
    expect(SetScoreSchema.safeParse({ player1: 1.5, player2: 0 }).success).toBe(false);
  });
});

describe("MatchScoreStateSchema", () => {
  const validState = {
    sets: [{ player1: 6, player2: 4 }],
    currentGame: { player1: 0, player2: 0 },
    server: "player1",
    isFinished: false,
    winner: null,
  };

  it("accepts valid match score state", () => {
    expect(MatchScoreStateSchema.safeParse(validState).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(MatchScoreStateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid server value", () => {
    expect(MatchScoreStateSchema.safeParse({ ...validState, server: "player3" }).success).toBe(false);
  });
});

describe("MatchSchema", () => {
  const validMatch = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    format: "BEST_OF_3",
    state: "SCHEDULED",
    player1: { id: "seed_p1", name: "Player 1" },
    player2: { id: "seed_p2", name: "Player 2" },
    scoreState: null,
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

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
    expect(
      CreatePlayerInputSchema.safeParse({
        name: "Carlos",
        email: "c@test.com",
        gender: "MALE",
        age: 20,
        dominance: "RIGHT",
        backhand: "TWO_HANDED",
        club: "RKT",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "X", email: "bad" }).success).toBe(false);
  });

  it("rejects age < 1 or > 120", () => {
    expect(CreatePlayerInputSchema.safeParse({ name: "X", age: 0 }).success).toBe(false);
    expect(CreatePlayerInputSchema.safeParse({ name: "X", age: 121 }).success).toBe(false);
  });
});

describe("CreateUserInputSchema", () => {
  const valid = {
    name: "Admin",
    email: "admin@test.com",
    cpf: "12345678901",
    password: "123456",
    role: "ADMIN",
  };

  it("accepts valid input", () => {
    expect(CreateUserInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects password shorter than 6", () => {
    expect(CreateUserInputSchema.safeParse({ ...valid, password: "12345" }).success).toBe(false);
  });

  it("rejects CPF shorter than 11", () => {
    expect(CreateUserInputSchema.safeParse({ ...valid, cpf: "123" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(CreateUserInputSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
});

describe("ListPlayersInputSchema", () => {
  it("applies default limit = 20", () => {
    const result = ListPlayersInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
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
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it("accepts role filter", () => {
    expect(ListUsersInputSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
  });
});

describe("CreateMatchInputSchema", () => {
  const valid = {
    player1Id: "player-1",
    player2Id: "player-2",
    format: "BEST_OF_3",
  };

  it("accepts valid input", () => {
    expect(CreateMatchInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when player1Id === player2Id", () => {
    const result = CreateMatchInputSchema.safeParse({ ...valid, player2Id: "player-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("diferente");
    }
  });

  it("accepts optional fields", () => {
    expect(
      CreateMatchInputSchema.safeParse({
        ...valid,
        tournamentName: "Open",
        category: "U18",
        scheduledAt: "2026-09-01T10:00:00Z",
      }).success,
    ).toBe(true);
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
    expect(
      FinishMatchInputSchema.safeParse({
        reason: "ABANDONED",
        note: "player left",
        winnerId: "550e8400-e29b-41d4-a716-446655440000",
        isManualScoreEdit: true,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid reason", () => {
    expect(FinishMatchInputSchema.safeParse({ reason: "INVALID" }).success).toBe(false);
  });
});

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
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("e-mail ou CPF");
    }
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
