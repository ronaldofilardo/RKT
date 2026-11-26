'use client';

export function GuardianPrivacyHighlight() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-telemetry-blue/40 bg-telemetry-blue/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🛡️</span>
          <h3 className="text-base font-bold text-telemetry-text-primary">
            Destaque: Proteção em Partidas Compartilhadas
          </h3>
        </div>
        <p className="text-xs text-telemetry-text-secondary leading-relaxed">
          Quando uma partida envolvendo um menor é compartilhada, o RKT aplica camadas estritas de proteção automática:
        </p>
        <ul className="space-y-1.5 text-xs text-telemetry-text-secondary list-disc pl-5">
          <li>
            <strong className="text-telemetry-text-primary">Bloqueio por BROADCAST:</strong> sem a sua autorização ativa para transmissão, a partida não é listada publicamente nem transmitida.
          </li>
          <li>
            <strong className="text-telemetry-text-primary">Links seguros e revogáveis:</strong> links de acompanhamento usam tokens criptográficos (armazenados em hash SHA-256) com validade e possibilidade de revogação.
          </li>
          <li>
            <strong className="text-telemetry-text-primary">Círculo fechado vs. aberto:</strong> partidas restritas limitam o acesso aos convidados e controlam a lotação de espectadores.
          </li>
          <li>
            <strong className="text-telemetry-text-primary">Zero exposição cadastral:</strong> CPF, data de nascimento, e-mail e documentos nunca aparecem em telas ou links compartilhados.
          </li>
          <li>
            <strong className="text-telemetry-text-primary">Auditoria completa:</strong> você acompanha cada acesso registrado na aba <strong>Acessos</strong>.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-telemetry-border/30 bg-telemetry-card p-5 space-y-3">
        <h3 className="text-base font-semibold text-telemetry-text-primary">
          Sobre a Plataforma, ECA Digital e LGPD
        </h3>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          O RKT é uma plataforma de gestão e anotação tática de partidas de tênis operando em conformidade com a <strong>LGPD (Art. 14)</strong> e o <strong>ECA Digital (Lei nº 15.211/2025)</strong>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-telemetry-border/20 bg-telemetry-surface/30 p-3">
            <p className="font-semibold text-telemetry-text-primary mb-1">Monotutela Estrita</p>
            <p className="text-telemetry-text-muted">Apenas um responsável legal ativo por vez exerce a tutela e gerencia os consentimentos do dependente.</p>
          </div>
          <div className="rounded-lg border border-telemetry-border/20 bg-telemetry-surface/30 p-3">
            <p className="font-semibold text-telemetry-text-primary mb-1">Tríade de Autorizações</p>
            <p className="text-telemetry-text-muted"><strong>DATA</strong> (conta/operação), <strong>BROADCAST</strong> (transmissão) e <strong>STATS</strong> (estatísticas coletivas com N ≥ 10) são independentes e revogáveis.</p>
          </div>
          <div className="rounded-lg border border-telemetry-border/20 bg-telemetry-surface/30 p-3">
            <p className="font-semibold text-telemetry-text-primary mb-1">Pseudonimização (Atleta #XXXXXX)</p>
            <p className="text-telemetry-text-muted">Em exposições e estatísticas, o nome real do menor é substituído por identificador pseudonimizado.</p>
          </div>
          <div className="rounded-lg border border-telemetry-border/20 bg-telemetry-surface/30 p-3">
            <p className="font-semibold text-telemetry-text-primary mb-1">Emancipação aos 18 anos</p>
            <p className="text-telemetry-text-muted">Ao completar 18 anos, o próprio titular assume a gestão da conta e dos seus consentimentos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
