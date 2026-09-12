import { describe, it, expect } from "@jest/globals";
import { PointFlowInputSchema } from "../contracts";

describe("PointFlowInputSchema — flexibleIdValidator and payload validation", () => {
  const validBasePayload = {
    winnerId: "seed_player_alcaraz",
    type: "ACE" as const,
    serverId: "seed_player_alcaraz",
    timestamp: 1789225858568,
    sequenceNumber: 1,
    clientEventId: "ed655e66-3400-4c39-8d26-957fdd15baf9",
    rallyDetails: {
      vencedor: "sacador" as const,
      situacao: "saque" as const,
      tipo: "winner" as const,
      golpe: "saque" as const,
      previewBalls: 1,
    },
    rallyLength: 1,
    isFirstServe: true,
    isSecondServe: false,
  };

  it("deve aceitar payload com IDs no formato de seed (seed_player_alcaraz)", () => {
    const result = PointFlowInputSchema.safeParse(validBasePayload);
    expect(result.success).toBe(true);
  });

  it("deve aceitar payload com IDs no formato CUID (24-25 chars)", () => {
    const result = PointFlowInputSchema.safeParse({
      ...validBasePayload,
      winnerId: "cmtyiva2i000210t43n1z2i7l",
      serverId: "cmtyiva2i000210t43n1z2i7l",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar payload com IDs no formato UUID", () => {
    const result = PointFlowInputSchema.safeParse({
      ...validBasePayload,
      winnerId: "550e8400-e29b-41d4-a716-446655440000",
      serverId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar payload com IDs no formato UUID prefixado", () => {
    const result = PointFlowInputSchema.safeParse({
      ...validBasePayload,
      winnerId: "pa2da1636-d6c4-4184-8fca-8dd8d5d8f3f9",
      serverId: "pac07fc77-ffd3-466e-af56-0ffc079d158a",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar winnerId ou serverId com formato inválido", () => {
    const result = PointFlowInputSchema.safeParse({
      ...validBasePayload,
      winnerId: "invalid ID with spaces",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.winnerId).toContain(
        "Must be a valid CUID, UUID or prefixed UUID"
      );
    }
  });
});
