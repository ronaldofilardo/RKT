/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { PointRow, getPlayerInitials } from '../timeline-rows';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails: {} as any,
    isTiebreak: false,
    gameIsDeuce: false,
    gameAdvantage: null,
    firstFault: undefined,
    ...overrides,
  } as TimelinePoint;
}

const baseProps = {
  matchId: 'match-1',
  isFirstPointOfGame: true,
  player1Name: 'Rafael Nadal',
  player2Name: 'Djokovic',
};

// ─── getPlayerInitials — regra de formatação das colunas SAC e Venc ───────────
describe('getPlayerInitials', () => {
  it('nome + sobrenome: usa a inicial de cada um, ex. "Rafael Nadal" → "R.N."', () => {
    expect(getPlayerInitials('Rafael Nadal')).toBe('R.N.');
  });

  it('nome com mais de 2 palavras: usa a inicial da primeira e da última', () => {
    expect(getPlayerInitials('Roger Federer Junior')).toBe('R.J.');
  });

  it('nome único: usa as 3 primeiras letras capitalizadas, ex. "Djokovic" → "Djo"', () => {
    expect(getPlayerInitials('Djokovic')).toBe('Djo');
  });

  it('nome único curto: mantém como está, capitalizado', () => {
    expect(getPlayerInitials('Ana')).toBe('Ana');
  });
});

describe('PointRow — regressão do novo layout (25 colunas, sem coluna SET)', () => {
  it('ACE no 1º saque: mostra ACE + efeito/direção do próprio ace na seção 1º saque; cascata (GOLPE/EFEITO/DIREÇÃO/SITUAÇÃO) fica em branco', () => {
    const p = makePoint({
      type: 'ACE',
      isFirstServe: true,
      isSecondServe: false,
      firstServeOutcome: 'ace',
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        tipo: 'winner',
        golpe: 'saque',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = Array.from(container.querySelectorAll('td')).map((td) => td.textContent);
    // [0]=no., [1]=SAC, [2]=Venc, [3]=GAMES, [4]=PONTOS,
    // [5]=1oSaque-ACE, [6]=OUT, [7]=NET, [8]=EFE, [9]=DIR,
    // [10]=2oSaque-ACE, [11]=OUT, [12]=NET, [13]=EFE, [14]=DIR,
    // [15]=SITUAÇÃO, [16]=TIPO, [17]=SUBTIPO1, [18]=SUBTIPO2, [19]=GOLPE, [20]=EFEITO, [21]=DIREÇÃO
    expect(cells[5]).toBe('ACE');
    expect(cells[8]).toBe('Flat');
    expect(cells[9]).toBe('Fe');
    // 2o saque inteiramente vazio (o ace foi no 1o)
    expect(cells[10]).toBe('–');
    expect(cells[13]).toBe('–');
    expect(cells[14]).toBe('–');
    // cascata (SITUAÇÃO em diante) não deve repetir os detalhes do saque
    expect(cells[15]).toBe('–'); // SITUAÇÃO
    expect(cells[19]).toBe('–'); // GOLPE
    expect(cells[20]).toBe('–'); // EFEITO
    expect(cells[21]).toBe('–'); // DIREÇÃO
  });

  it('Erro no 1º saque + ACE no 2º saque: seção 1º saque mostra o erro (com EFE/DIR do erro), seção 2º saque mostra o ACE (com EFE/DIR do próprio ace)', () => {
    const p = makePoint({
      type: 'ACE',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: 'ace',
      firstFault: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        tipo: 'winner',
        golpe: 'saque',
        efeito: 'flat',
        direcao: 'centro',
        previewBalls: 1,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = Array.from(container.querySelectorAll('td')).map((td) => td.textContent);
    // 1o saque: OUT + efeito/direção do ERRO (não do ace)
    expect(cells[6]).toBe('OUT');
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    // 2o saque: ACE + efeito/direção do próprio ace
    expect(cells[10]).toBe('ACE');
    expect(cells[13]).toBe('Flat');
    expect(cells[14]).toBe('Ce');
    // cascata continua vazia (o 2o saque decidiu o ponto)
    expect(cells[19]).toBe('–'); // GOLPE
  });

  it('Dupla Falta: seção 1º saque mostra o 1o erro, seção 2º saque mostra o 2o erro (OUT/NET + EFE/DIR do 2o); cascata em branco', () => {
    const p = makePoint({
      type: 'DOUBLE_FAULT',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: 'net',
      firstFault: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'saque',
        tipo: 'dupla_falta',
        golpe: 'saque',
        subtipo2: 'net',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = Array.from(container.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells[6]).toBe('OUT'); // 1o saque
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    expect(cells[12]).toBe('NET'); // 2o saque
    expect(cells[13]).toBe('Flat');
    expect(cells[14]).toBe('Fe');
    expect(cells[15]).toBe('–'); // SITUAÇÃO
    expect(cells[19]).toBe('–'); // GOLPE
  });

  it('Erro no 1º saque + acerto no 2º (rally comum): seção 1º saque mostra o erro, seção 2º fica vazia, cascata mostra os detalhes do rally', () => {
    const p = makePoint({
      type: 'WINNER',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: null,
      firstFault: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
      rallyLength: 4,
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        efeito: 'topspin',
        direcao: 'cruzada',
        previewBalls: 4,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = Array.from(container.querySelectorAll('td')).map((td) => td.textContent);
    // 1o saque: mostra só o erro
    expect(cells[6]).toBe('OUT');
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    // 2o saque: nenhum ACE/OUT/NET (o 2o saque foi bom)
    expect(cells[10]).toBe('–');
    expect(cells[11]).toBe('–');
    expect(cells[12]).toBe('–');
    expect(cells[13]).toBe('–');
    expect(cells[14]).toBe('–');
    // cascata mostra o rally normalmente
    expect(cells[15]).toBe('FQ'); // SITUAÇÃO
    expect(cells[19]).toBe('FH'); // GOLPE
    expect(cells[20]).toBe('Top'); // EFEITO
    expect(cells[21]).toBe('X'); // DIREÇÃO
  });

  it('Winner em rally comum (sem nenhum erro de saque): cascata mostra golpe/efeito/direção normalmente', () => {
    const p = makePoint({
      type: 'WINNER',
      rallyLength: 4,
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        efeito: 'topspin',
        direcao: 'cruzada',
        previewBalls: 4,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('W');
    expect(text).toContain('FQ');
    expect(text).toContain('FH');
    expect(text).toContain('Top');
    expect(text).toContain('X');
  });

  it('Erro não forçado em rally: badge ENF', () => {
    const p = makePoint({
      type: 'UNFORCED_ERROR',
      rallyLength: 2,
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'fundo',
        tipo: 'erro_nao_forcado',
        golpe: 'bh',
        subtipo2: 'net',
        previewBalls: 2,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('ENF');
    expect(text).toContain('BH');
  });

  it('Ponto sem rallyDetails: badge TIPO mostra –', () => {
    const p = makePoint({
      type: 'WINNER',
      rallyDetails: null,
      firstFault: undefined,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('–');
  });

  it('hasGap renderiza linha separadora "marcação interrompida"', () => {
    const p = makePoint({});
    render(<table><tbody><PointRow {...baseProps} point={p} hasGap={true} isLast={true} /></tbody></table>);
    expect(screen.getByText('marcação interrompida')).toBeInTheDocument();
  });

  it('vencedor PLAYER_2 usa borda vermelha, PLAYER_1 usa borda azul', () => {
    const p1 = makePoint({ winner: 'PLAYER_1' });
    const p2 = makePoint({ winner: 'PLAYER_2' });
    const { container: c1 } = render(<table><tbody><PointRow {...baseProps} point={p1} hasGap={false} isLast={true} /></tbody></table>);
    const row1 = c1.querySelector('tr');
    expect(row1?.className).toContain('border-l-blue-500');

    const { container: c2 } = render(<table><tbody><PointRow {...baseProps} point={p2} hasGap={false} isLast={true} /></tbody></table>);
    const row2 = c2.querySelector('tr');
    expect(row2?.className).toContain('border-l-red-500');
  });
});

describe('PointRow — colunas no., SAC, Venc (sem coluna SET)', () => {
  it('não renderiza mais nenhuma coluna/label "SET N" — no. é a 1a coluna', () => {
    const p = makePoint({ server: 'player1', pointNumber: 5 });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    expect(screen.queryByText('SET 1')).not.toBeInTheDocument();
    const cells = container.querySelectorAll('td');
    // [0] agora é "no." (antes era a célula do rótulo SET)
    expect(cells[0]?.textContent).toBe('5');
  });

  it('mostra as iniciais do ganhador do ponto na coluna Venc (não mais "1"/"2")', () => {
    const p = makePoint({ server: 'player1', winner: 'PLAYER_1' });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = container.querySelectorAll('td');
    // [0]=no., [1]=SAC, [2]=Venc(winner)
    expect(cells[2]?.textContent).toBe(getPlayerInitials(baseProps.player1Name));
  });

  it('mostra as iniciais do sacador na coluna SAC (não mais "1"/"2")', () => {
    const p = makePoint({ server: 'player2', winner: 'PLAYER_2' });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = container.querySelectorAll('td');
    // [1]=SAC
    expect(cells[1]?.textContent).toBe(getPlayerInitials(baseProps.player2Name));
  });

  it('GAMES mostra placar apenas no 1º ponto do game (demais = "–")', () => {
    const p1 = makePoint({ pointNumber: 1 });
    const p2 = makePoint({ pointNumber: 2 });
    const { container: c1 } = render(
      <table>
        <tbody>
          <PointRow {...baseProps} point={p1} hasGap={false} isLast={false} isFirstPointOfGame={true} />
        </tbody>
      </table>
    );
    const cells1 = c1.querySelectorAll('td');
    // [3]=GAMES (número do game), [4]=PONTOS
    expect(cells1[3]?.textContent).toBe('1');
    expect(cells1[4]?.textContent).toBe('0-0');

    const { container: c2 } = render(
      <table>
        <tbody>
          <PointRow {...baseProps} point={p2} hasGap={false} isLast={false} isFirstPointOfGame={false} />
        </tbody>
      </table>
    );
    const cells = c2.querySelectorAll('td');
    expect(cells[3]?.textContent).toBe('–');
  });
});
