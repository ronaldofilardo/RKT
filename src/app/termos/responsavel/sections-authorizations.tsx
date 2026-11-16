import React from 'react';

export function TermosAuthorizationsSections() {
  return (
    <>
      <section id="autorizacao-1-dados" className="mb-6 border-b border-telemetry-border/20 pb-5 scroll-mt-6 target:border-telemetry-blue target:bg-telemetry-blue/5 target:p-4 target:rounded-xl transition-all">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Obrigatória</span>
          <h2 className="text-base font-bold text-telemetry-text-primary">3. Autorização 1 — Dados Esportivos e Operação no CT (DATA)</h2>
        </div>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          3.1. <strong>Finalidade:</strong> Criação do perfil esportivo, registro de partidas, cálculo de estatísticas individuais e acompanhamento técnico pelo CT.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          3.2. <strong>Equipe do CT:</strong> O Gestor do CT acessa todas as partidas de atletas vinculados ao seu CT. O Treinador do CT tem acesso às partidas que ele próprio anotou ou onde possua vínculo esportivo direto ativo. Treinadores sem vínculo e anotadores externos visualizam o menor anonimizado.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          3.3. <strong>Condição Obrigatória:</strong> Sem esta autorização não é possível cadastrar ou operar a conta do menor no CT.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          3.4. <strong>Revogação:</strong> Impede novas partidas. Partida em andamento conclui normalmente o registro de pontos para integridade do adversário, passando a projeção externa imediatamente ao modo anonimizado.
        </p>
      </section>

      <section id="autorizacao-2-transmissao" className="mb-6 border-b border-telemetry-border/20 pb-5 scroll-mt-6 target:border-telemetry-blue target:bg-telemetry-blue/5 target:p-4 target:rounded-xl transition-all">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold bg-telemetry-blue/10 text-telemetry-blue px-2 py-0.5 rounded">Opcional</span>
          <h2 className="text-base font-bold text-telemetry-text-primary">4. Autorização 2 — Transmissão e Compartilhamento (BROADCAST)</h2>
        </div>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          4.1. <strong>Acompanhamento pelo Responsável:</strong> Você poderá acompanhar todas as partidas do menor por meio de tela dedicada no seu painel autenticado.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          4.2. <strong>Anonimização Obrigatória para Terceiros:</strong> Apenas os envolvidos diretos (você, atletas em quadra, treinador da partida e gestor do CT) visualizam o nome civil do menor. Qualquer convidado por link, espectador ou público visualiza o Atleta com o nome <strong>obrigatoriamente anonimizado</strong> (ex.: <em>Atleta #8F2A7B</em>).
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          4.3. <strong>Revogação:</strong> Novos links de compartilhamento são bloqueados e links vigentes são revogados imediatamente. O Responsável e os envolvidos diretos mantêm acesso normal.
        </p>
      </section>

      <section id="autorizacao-3-pool" className="mb-6 border-b border-telemetry-border/20 pb-5 scroll-mt-6 target:border-telemetry-blue target:bg-telemetry-blue/5 target:p-4 target:rounded-xl transition-all">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold bg-telemetry-blue/10 text-telemetry-blue px-2 py-0.5 rounded">Opcional</span>
          <h2 className="text-base font-bold text-telemetry-text-primary">5. Autorização 3 — Pool Estatístico da Plataforma (STATS)</h2>
        </div>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          5.1. <strong>Finalidade:</strong> Desempenho de partidas incluído em modelos analíticos agregados para cálculo de médias regionais e comparativos técnicos por categoria e piso, visando ao aprimoramento do atleta.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          5.2. <strong>Salvaguarda de Amostra Mínima (N &ge; 10):</strong> O nome nunca é revelado e nenhum indicador é exibido com grupos inferiores a <strong>10 jogos ou atletas</strong>, impedindo qualquer reidentificação.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          5.3. <strong>Vedações:</strong> Não há venda de dados, publicidade direcionada, profiling comercial nem decisões automatizadas excludentes.
        </p>
      </section>
    </>
  );
}
