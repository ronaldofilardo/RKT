import React from 'react';

export function TermosLegalSections() {
  return (
    <>
      <section id="direitos-titular" className="mb-6 border-b border-telemetry-border/20 pb-5">
        <h2 className="text-base font-bold text-telemetry-text-primary mb-2">6. Direitos do Titular (LGPD Art. 18)</h2>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          Você pode revogar ou alterar as autorizações BROADCAST e STATS a qualquer momento no Painel do Responsável, ou solicitar confirmação, correção, exportação de dados ou anonimização completa pelo canal <code>privacidade@rkt.app</code>.
        </p>
      </section>

      <section id="retencao-maioridade" className="mb-6 border-b border-telemetry-border/20 pb-5">
        <h2 className="text-base font-bold text-telemetry-text-primary mb-2">7. Guarda de Provas e Maioridade Civil</h2>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          7.1. <strong>Retenção Probatória:</strong> Os registros técnicos de comprovação de consentimento (ConsentRecord e ConsentEvent) são guardados por <strong>5 (cinco) anos</strong> após encerramento ou anonimização para cumprimento regulatório.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          7.2. <strong>Emancipação aos 18 Anos:</strong> A tutela do Responsável encerra-se automaticamente no dia do 18º aniversário. O jovem passa a gerir suas próprias permissões no primeiro acesso subsequente.
        </p>
      </section>

      <section id="declaracao-tutela" className="mb-6 bg-telemetry-elevated/20 border border-telemetry-border/30 rounded-xl p-4 scroll-mt-6 target:border-telemetry-blue target:ring-2 target:ring-telemetry-blue/40 target:bg-telemetry-blue/10 transition-all">
        <h2 className="text-sm font-bold text-telemetry-text-primary mb-1">8. Declaração de Responsabilidade Legal e Tutela Civil</h2>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          Ao marcar a caixa de declaração, você atesta expressamente sob as penas da lei que é pai, mãe ou tutor legal do atleta menor, que conferiu as informações cadastrais e que as autorizações marcadas expressam a sua vontade livre e informada sob o ECA Digital (Lei 15.211/2025) e a LGPD (Lei 13.709/2018).
        </p>
      </section>
    </>
  );
}
