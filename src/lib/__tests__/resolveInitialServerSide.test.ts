import { resolveInitialServerSide, resolveServerSideFromId } from "../resolveInitialServerSide";

describe("resolveInitialServerSide", () => {
  it("deve resolver player1 em partida de simples quando initialServerId for player1", () => {
    const match = { player1Id: "p1", player2Id: "p2", initialServerId: "p1" };
    expect(resolveInitialServerSide(match)).toBe("player1");
  });

  it("deve resolver player2 em partida de simples quando initialServerId for player2", () => {
    const match = { player1Id: "p1", player2Id: "p2", initialServerId: "p2" };
    expect(resolveInitialServerSide(match)).toBe("player2");
  });

  it("deve resolver player1 em duplas quando initialServerId for o parceiro do player1", () => {
    const match = {
      player1Id: "p1",
      player2Id: "p2",
      player1PartnerId: "p1_partner",
      player2PartnerId: "p2_partner",
      initialServerId: "p1_partner",
    };
    expect(resolveInitialServerSide(match)).toBe("player1");
  });

  it("deve resolver player2 em duplas quando initialServerId for o parceiro do player2", () => {
    const match = {
      player1Id: "p1",
      player2Id: "p2",
      player1PartnerId: "p1_partner",
      player2PartnerId: "p2_partner",
      initialServerId: "p2_partner",
    };
    expect(resolveInitialServerSide(match)).toBe("player2");
  });

  it("deve usar player1 como fallback se initialServerId for nulo", () => {
    const match = { player1Id: "p1", player2Id: "p2", initialServerId: null };
    expect(resolveInitialServerSide(match)).toBe("player1");
  });

  it("resolveServerSideFromId identifica corretamente os lados", () => {
    const match = {
      player1Id: "p1",
      player2Id: "p2",
      player1PartnerId: "p1_partner",
      player2PartnerId: "p2_partner",
    };
    expect(resolveServerSideFromId("p1_partner", match)).toBe("player1");
    expect(resolveServerSideFromId("p2_partner", match)).toBe("player2");
    expect(resolveServerSideFromId("unknown", match)).toBeNull();
  });
});
