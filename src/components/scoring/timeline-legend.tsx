export function TimelineLegend({ player1Name, player2Name }: { player1Name: string; player2Name: string }) {
  return (
    <div className="mt-3 text-[10px] text-telemetry-text-muted bg-telemetry-elevated border border-white/5 rounded-lg px-3 py-2 space-y-1">
      <p className="font-semibold text-telemetry-text-primary mb-1">Como ler esta tabela</p>
      <p>Cada linha é um ponto disputado, na ordem em que aconteceu. <strong>no.</strong> = número do ponto; <strong>SAC</strong> = sacador ({player1Name}/{player2Name}); <strong>Venc</strong> = ganhador do ponto ({player1Name}/{player2Name}).</p>
      <p><strong>GAMES</strong> = placar de games/set (mostrado só no 1º ponto de cada game).</p>
      <p><strong>PONTOS</strong> = placar de pontos (15-0, Deuce, Adv. P1).</p>
      <p><strong>1º / 2º Saque</strong>: mostra ACE, OUT ou NET conforme o resultado de cada saque, além de efeito e direção. Apenas um dos saques é preenchido por ponto.</p>
      <p><strong>TIPO</strong>: <strong>Ace</strong> = Ace · <strong>DF</strong> = Dupla Falta · <strong>W</strong> = ponto vencedor direto (Winner) · <strong>ENF</strong> = Erro Não Forçado · <strong>EF</strong> = Erro Forçado</p>
      <p><strong>ERRO</strong> = tipo de erro na rede (Pass = Passada, DEV = Devolução). <strong>ONDE</strong> = onde errou (out, net).</p>
      <p><strong>SITUAÇÃO</strong> (DEV, FQ, Rede, Pass, Sq) / <strong>GOLPE</strong> (FH, BH, VFH, VBH, Sm) / <strong>EFEITO</strong> (Top, Sl, Flat) / <strong>DIREÇÃO</strong> (X, Parl, Ce, In Out, In In, Ab, Fe) descrevem como o ponto terminou.</p>
      <p><strong>ESPECIAL</strong> = golpe especial (Lob, Drop, SV, bate-pronto).</p>
      <p><strong>RALLY</strong> = faixa de bolas trocadas conforme duração marcada (1-4, 5-8, +9).</p>
    </div>
  );
}
