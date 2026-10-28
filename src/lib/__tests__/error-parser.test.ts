import { extractErrorMessage } from "../error-parser";

describe("extractErrorMessage", () => {
  it("retorna a string diretamente quando o erro é uma string", () => {
    expect(extractErrorMessage("Falha na rede")).toBe("Falha na rede");
  });

  it("retorna a mensagem de um Error instanciado", () => {
    expect(extractErrorMessage(new Error("CPF inválido"))).toBe("CPF inválido");
  });

  it("traduza falha de rede (Failed to fetch) para mensagem de conexão", () => {
    expect(extractErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
    );
  });

  it("extrai a mensagem do objeto quando difere do código", () => {
    expect(extractErrorMessage({ code: "NOT_FOUND", message: "Atleta não encontrado" })).toBe(
      "Atleta não encontrado",
    );
  });

  it("monta mensagem a partir de details.fieldErrors", () => {
    expect(
      extractErrorMessage({
        code: "VALIDATION_ERROR",
        details: { fieldErrors: { cpf: ["Informe um CPF válido com 11 dígitos"] } },
      }),
    ).toBe("cpf: Informe um CPF válido com 11 dígitos");
  });

  it("traduza códigos conhecidos do dicionário", () => {
    expect(extractErrorMessage({ code: "CONFLICT" })).toBe(
      "Este e-mail ou CPF já está cadastrado no sistema.",
    );
    expect(extractErrorMessage({ code: "FORBIDDEN" })).toBe(
      "Ação não permitida para o seu perfil de acesso.",
    );
    expect(extractErrorMessage({ code: "INTERNAL_ERROR" })).toBe(
      "Não conseguimos processar esta ação no momento. Nossa equipe foi notificada.",
    );
  });

  it("retorna o fallback padrão para erros desconhecidos", () => {
    expect(extractErrorMessage(null)).toBe("Ocorreu um erro inesperado. Tente novamente.");
    expect(extractErrorMessage({ code: "CODIGO_DESCONHECIDO" }, "Fallback customizado")).toBe(
      "Fallback customizado",
    );
  });
});
