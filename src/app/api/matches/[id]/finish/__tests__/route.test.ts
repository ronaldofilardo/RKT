import { NextRequest } from "next/server";

// Mock do Prisma - inline para evitar hoisting issues
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  prisma: {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

// Dados de teste
const mockMatch = {
  id: "test-match-id",
  player1Id: "player-1-id",
  player2Id: "player-2-id",
  player1: { id: "player-1-id", name: "Player 1" },
  player2: { id: "player-2-id", name: "Player 2" },
  state: "IN_PROGRESS",
  finishedAt: null,
  winnerId: null,
};

const mockUpdatedMatch = {
  ...mockMatch,
  state: "FINISHED",
  winnerId: "player-2-id",
  finishedAt: new Date(),
};

// Helper para acessar o mock
const prismaMock = prisma as any;

describe("PATCH /api/matches/[id]/finish", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve atualizar partida com winnerId e finishedAt", async () => {
    prismaMock.match.findUnique.mockResolvedValue(mockMatch);
    prismaMock.match.update.mockResolvedValue(mockUpdatedMatch);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        winnerId: "player-2-id",
        finishedAt: new Date().toISOString(),
      }),
    } as unknown as NextRequest;

    const params = Promise.resolve({ id: "test-match-id" });

    const response = await PATCH(mockRequest, { params });

    expect(response.status).toBe(200);
    expect(prismaMock.match.findUnique).toHaveBeenCalledWith({
      where: { id: "test-match-id" },
      include: {
        player1: true,
        player2: true,
      },
    });
    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: "test-match-id" },
      data: expect.objectContaining({
        winnerId: "player-2-id",
        state: "FINISHED",
      }),
    });
  });

  it("deve retornar 400 se winnerId não for fornecido", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        winnerId: null,
      }),
    } as unknown as NextRequest;

    const params = Promise.resolve({ id: "test-match-id" });

    const response = await PATCH(mockRequest, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("winnerId is required");
  });

  it("deve retornar 404 se partida não existir", async () => {
    prismaMock.match.findUnique.mockResolvedValue(null);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        winnerId: "player-2-id",
      }),
    } as unknown as NextRequest;

    const params = Promise.resolve({ id: "non-existent-id" });

    const response = await PATCH(mockRequest, { params });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Match not found");
  });

  it("deve retornar 400 se winnerId não for um dos jogadores", async () => {
    prismaMock.match.findUnique.mockResolvedValue(mockMatch);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        winnerId: "invalid-player-id",
      }),
    } as unknown as NextRequest;

    const params = Promise.resolve({ id: "test-match-id" });

    const response = await PATCH(mockRequest, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Winner must be one of the players");
  });

  it("deve retornar 500 em caso de erro no servidor", async () => {
    prismaMock.match.findUnique.mockRejectedValue(new Error("Database error"));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        winnerId: "player-2-id",
      }),
    } as unknown as NextRequest;

    const params = Promise.resolve({ id: "test-match-id" });

    const response = await PATCH(mockRequest, { params });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});