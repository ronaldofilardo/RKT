import React from 'react';

export function TermosIntroSections() {
  return (
    <>
      <section id="controladoria" className="mb-6 border-b border-telemetry-border/20 pb-5">
        <h2 className="text-base font-bold text-telemetry-text-primary mb-2">1. Controladoria Conjunta e Partes</h2>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          1.1. O tratamento de dados no ecossistema RKT é realizado em regime de <strong>controladoria conjunta</strong> entre a <strong>Plataforma RKT</strong> (infraestrutura técnica e pool de estatísticas) e o <strong>Centro de Treinamento (CT)</strong> (gestão esportiva local, cadastro e conferência presencial de documentos).
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          1.2. Este termo aplica-se a atletas com menos de 18 anos (&quot;Atleta&quot;) e é celebrado pelo pai, pela mãe ou pelo tutor legal (&quot;Responsável&quot;).
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          1.3. O sistema adota <strong>Monotutela Estrita</strong>: cada Atleta possui exatamente 1 único Responsável legal ativo na plataforma. O Atleta menor não pode assinar este termo por conta própria.
        </p>
      </section>

      <section id="dados-tratados" className="mb-6 border-b border-telemetry-border/20 pb-5">
        <h2 className="text-base font-bold text-telemetry-text-primary mb-2">2. Dados Coletados e Tratados</h2>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          2.1. <strong>Identificação:</strong> Nome completo, data de nascimento, CPF, CT vinculado e dados de contato do Responsável (nome, CPF, telefone/WhatsApp).
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          2.2. <strong>Dados Esportivos:</strong> Local da partida (CT/clube e quadra), data, horário, placar, pontos, tipos e direções de golpes e tempos de jogo.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed mb-2">
          2.3. <strong>Não Coleta de Dados Especiais:</strong> A plataforma <strong>não coleta dados de saúde</strong>, prontuários nem imagens de câmeras.
        </p>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          2.4. <strong>Anotações Técnicas:</strong> Comentários e áudios do anotador são restritos aos envolvidos diretos da partida e nunca são exibidos a convidados externos.
        </p>
      </section>
    </>
  );
}
