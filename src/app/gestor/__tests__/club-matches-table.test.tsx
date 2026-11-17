/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClubMatchesTable } from '../club-matches-table';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

jest.mock('@/contexts/FloatingSpectatorContext', () => ({
  useFloatingSpectatorOptional: jest.fn(),
}));

const mockedHook = useFloatingSpectatorOptional as jest.Mock;

const match = (id: string, state: string, format = 'BEST_OF_3', scoreState?: unknown) => ({
  id, state, format, createdAt: '2026-10-29T10:00:00Z',
  startedAt: null, finishedAt: null, createdByUserId: 'u1',
  player1: { id: 'p1', name: 'Ana' }, player2: { id: 'p2', name: 'Bia' },
  createdByUser: { id: 'u1', name: 'Coach', email: 'c@x.com' },
  scoreState,
});

describe('ClubMatchesTable — Ver Partida', () => {
  it('exibe coluna Placar e Formato abreviado (com rótulo completo no tooltip)', () => {
    mockedHook.mockReturnValue(null);
    const score = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 7, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 3 } },
      ],
    };
    render(<ClubMatchesTable matches={[match('m0', 'FINISHED', 'BEST_OF_3_NO_AD', score)]} />);
    expect(screen.getByText('Placar')).toBeInTheDocument();
    expect(screen.getByText('M3 No-Ad')).toHaveAttribute('title', 'Melhor de 3 sets "no ad"');
    expect(screen.getByText('6/4 7/6(3)')).toBeInTheDocument();
  });

  it('em andamento: abre o popup de acompanhamento (sem navegar)', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });
    render(<ClubMatchesTable matches={[match('m1', 'IN_PROGRESS')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m1', 'Ana × Bia');
    expect(screen.queryByRole('link', { name: 'Ver Partida' })).toBeNull();
  });

  it('agendada: também abre o popup', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });
    render(<ClubMatchesTable matches={[match('m2', 'SCHEDULED')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m2', 'Ana × Bia');
  });

  it('finalizada: mantém o link para o relatório', () => {
    mockedHook.mockReturnValue({ open: jest.fn() });
    render(<ClubMatchesTable matches={[match('m3', 'FINISHED')]} />);
    expect(screen.getByRole('link', { name: 'Ver Partida' })).toHaveAttribute('href', '/match/m3/report');
  });

  it('sem provider: em andamento cai no link da tela de acompanhamento', () => {
    mockedHook.mockReturnValue(null);
    render(<ClubMatchesTable matches={[match('m4', 'IN_PROGRESS')]} />);
    expect(screen.getByRole('link', { name: 'Ver Partida' })).toHaveAttribute('href', '/matches/acompanhar/m4');
  });

  it('exibe o ícone de timeline apontando para o relatório em partidas finalizadas', () => {
    mockedHook.mockReturnValue({ open: jest.fn() });
    render(<ClubMatchesTable matches={[match('m5', 'FINISHED')]} />);
    expect(screen.getByRole('link', { name: 'Ver timeline' })).toHaveAttribute('href', '/match/m5/report');
  });

  it('mantém o ícone de timeline mesmo com o popup de acompanhamento ativo', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });
    render(<ClubMatchesTable matches={[match('m6', 'IN_PROGRESS')]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m6', 'Ana × Bia');
    expect(screen.getByRole('link', { name: 'Ver timeline' })).toHaveAttribute('href', '/match/m6/report');
  });

  it('renderiza o botão "Nova Partida" e aciona onCreateMatch', () => {
    const onCreateMatch = jest.fn();
    render(<ClubMatchesTable matches={[]} onCreateMatch={onCreateMatch} />);

    const btn = screen.getByRole('button', { name: /Nova Partida/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onCreateMatch).toHaveBeenCalledTimes(1);
  });

  it('renderiza o botão "Indicar" e aciona onAssignCoach', () => {
    const onAssignCoach = jest.fn();
    const m = match('m7', 'SCHEDULED');
    render(<ClubMatchesTable matches={[m]} onAssignCoach={onAssignCoach} />);

    const btn = screen.getByRole('button', { name: /Indicar/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAssignCoach).toHaveBeenCalledWith(m);
  });

  it('exibe nome do anotador designado quando presente', () => {
    const m = {
      ...match('m8', 'SCHEDULED'),
      assignedCoach: { id: 'c1', name: 'Treinador Roberto' },
    };
    render(<ClubMatchesTable matches={[m]} />);
    expect(screen.getByText('Treinador Roberto')).toBeInTheDocument();
  });

  it('exibe múltiplos anotadores designados quando presentes', () => {
    const m = {
      ...match('m-multi', 'SCHEDULED'),
      assignedCoaches: [
        { coach: { id: 'c1', name: 'Treinador Roberto' } },
        { coach: { id: 'c2', name: 'Treinadora Maria' } },
      ],
    };
    render(<ClubMatchesTable matches={[m]} />);
    expect(screen.getByText('Treinador Roberto, Treinadora Maria')).toBeInTheDocument();
  });

  it('exibe botão de exclusão apenas quando criada pelo próprio usuário', () => {
    const onDelete = jest.fn();
    const ownMatch = { ...match('m-own', 'SCHEDULED'), createdByUserId: 'gestor-1' };
    const otherMatch = { ...match('m-other', 'SCHEDULED'), createdByUserId: 'other-user' };

    const { rerender } = render(
      <ClubMatchesTable matches={[ownMatch]} currentUserId="gestor-1" onDeleteMatch={onDelete} />
    );
    const deleteBtn = screen.getByTitle('Excluir partida');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(ownMatch);

    rerender(
      <ClubMatchesTable matches={[otherMatch]} currentUserId="gestor-1" onDeleteMatch={onDelete} />
    );
    expect(screen.queryByTitle('Excluir partida')).not.toBeInTheDocument();
  });

  it('exibe botão Anotar e aciona onAnnotateMatch', () => {
    const onAnnotate = jest.fn();
    const m = match('m-annotate', 'SCHEDULED');
    render(<ClubMatchesTable matches={[m]} onAnnotateMatch={onAnnotate} />);

    const btn = screen.getByRole('button', { name: 'Anotar' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAnnotate).toHaveBeenCalledWith(m);
  });

  it('partida de duplas: exibe badge Duplas e nomes dos parceiros nos dois lados', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });

    const doublesMatch = {
      ...match('m-doubles', 'SCHEDULED'),
      matchType: 'DOUBLES' as const,
      player1: { id: 'p1', name: 'Cloe Grapeggia', club: 'Eco Tênis Clube' },
      player1Partner: { id: 'p1p', name: 'Laura Silva', club: 'Eco Tênis Clube' },
      player2: { id: 'p2', name: 'Valentina Moletta', club: 'Eco Tênis Clube' },
      player2Partner: { id: 'p2p', name: 'Julia Santos', club: 'Clube Curitibano' },
    };

    render(<ClubMatchesTable matches={[doublesMatch]} />);

    // Deve exibir badge de Duplas
    expect(screen.getByText('Duplas')).toBeInTheDocument();

    // Deve exibir ambos os jogadores do lado 1
    expect(screen.getByText('Cloe Grapeggia')).toBeInTheDocument();
    expect(screen.getByText('Laura Silva')).toBeInTheDocument();

    // Deve exibir ambos os jogadores do lado 2
    expect(screen.getByText('Valentina Moletta')).toBeInTheDocument();
    expect(screen.getByText('Julia Santos')).toBeInTheDocument();

    // Clubes/afiliações de cada atleta
    expect(screen.getAllByText('Eco Tênis Clube').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Clube Curitibano')).toBeInTheDocument();

    // Abertura com título composto de duplas
    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m-doubles', '[Duplas] Cloe Grapeggia / Laura Silva × Valentina Moletta / Julia Santos');
  });

  it('sub-abas internas: alterna entre "Meu clube" e "Outros" exibindo tabelas e badges corretos', () => {
    const clubMatch = match('m-club', 'SCHEDULED');
    const externalMatch = {
      ...match('m-ext', 'SCHEDULED'),
      player1: { id: 'p-ext1', name: 'Atleta Visitante', club: 'Outro CT' },
      player2: { id: 'p-ext2', name: 'Atleta da Casa', club: 'Eco Tênis Clube' },
    };

    render(
      <ClubMatchesTable
        matches={[clubMatch]}
        externalMatches={[externalMatch]}
      />
    );

    // Inicialmente na sub-aba "Meu clube"
    const myClubTab = screen.getByRole('tab', { name: /Meu clube/i });
    const othersTab = screen.getByRole('tab', { name: /Outros/i });

    expect(myClubTab).toHaveAttribute('aria-selected', 'true');
    expect(othersTab).toHaveAttribute('aria-selected', 'false');

    // Mostra partida do clube e oculta partida externa
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Atleta Visitante')).not.toBeInTheDocument();

    // Alterna para "Outros"
    fireEvent.click(othersTab);

    expect(myClubTab).toHaveAttribute('aria-selected', 'false');
    expect(othersTab).toHaveAttribute('aria-selected', 'true');

    // Mostra partida externa e oculta tabela do clube
    expect(screen.getByText('Atleta Visitante')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();

    // Alterna de volta para "Meu clube"
    fireEvent.click(myClubTab);
    expect(myClubTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('sub-aba "Outros": exibe empty state amigável quando externalMatches for vazio', () => {
    render(<ClubMatchesTable matches={[match('m-c1', 'SCHEDULED')]} externalMatches={[]} />);

    const othersTab = screen.getByRole('tab', { name: /Outros/i });
    fireEvent.click(othersTab);

    expect(
      screen.getByText(/Nenhuma partida agendada por outros clubes ou treinadores externos/i),
    ).toBeInTheDocument();
  });

  it('renderiza o botão "Info." e aciona onEditMatchInfo ao clicar', () => {
    const onEditMatchInfo = jest.fn();
    const m = match('m-edit-info', 'SCHEDULED');
    render(<ClubMatchesTable matches={[m]} onEditMatchInfo={onEditMatchInfo} />);

    const btn = screen.getByRole('button', { name: /Editar informações da partida/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Info.');

    fireEvent.click(btn);
    expect(onEditMatchInfo).toHaveBeenCalledTimes(1);
    expect(onEditMatchInfo).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-edit-info' }));
  });

  it('renderiza o botão "Info." também na aba "Outros" e aciona onEditMatchInfo', () => {
    const onEditMatchInfo = jest.fn();
    const ext = match('m-ext-info', 'SCHEDULED');
    render(<ClubMatchesTable matches={[]} externalMatches={[ext]} onEditMatchInfo={onEditMatchInfo} />);

    const othersTab = screen.getByRole('tab', { name: /Outros/i });
    fireEvent.click(othersTab);

    const btn = screen.getByRole('button', { name: /Editar informações da partida/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onEditMatchInfo).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-ext-info' }));
  });
});
