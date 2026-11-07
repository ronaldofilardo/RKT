/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChangeServerModal } from '../ChangeServerModal';
import { Game2ServerSelectionModal } from '../Game2ServerSelectionModal';
import { EditScoreServerSection } from '../EditScoreServerSection';
import type { MatchData } from '@/hooks/useScoringHandlers.types';

describe('ChangeServerModal — Tolerância a Falhas e Troca Ágil de Sacador', () => {
  const singlesMatch: MatchData = {
    id: 'm-singles',
    player1Id: 'p1',
    player2Id: 'p2',
    player1: { id: 'p1', name: 'Carlos Alcaraz' },
    player2: { id: 'p2', name: 'Jannik Sinner' },
    matchType: 'SINGLES',
    format: 'BEST_OF_3',
    status: 'IN_PROGRESS',
    courtType: 'HARD',
    initialServerId: 'p1',
  };

  const doublesMatch: MatchData = {
    id: 'm-doubles',
    player1Id: 'p1',
    player2Id: 'p2',
    player1: { id: 'p1', name: 'Carlos Alcaraz' },
    player1Partner: { id: 'p1p', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Novak Djokovic' },
    player2Partner: { id: 'p2p', name: 'Roger Federer' },
    matchType: 'DOUBLES',
    format: 'BEST_OF_3',
    status: 'IN_PROGRESS',
    courtType: 'CLAY',
    initialServerId: 'p1',
  };

  describe('Partidas de Simples', () => {
    it('exibe diálogo de confirmação com aviso de bloqueio para inverter sacador para o adversário', async () => {
      const onSelectServer = jest.fn();
      const onClose = jest.fn();

      render(
        <ChangeServerModal
          isOpen={true}
          onClose={onClose}
          match={singlesMatch}
          activeServerId="p1"
          onSelectServer={onSelectServer}
        />
      );

      expect(screen.getByText('Inverter sacador inicial')).toBeInTheDocument();
      expect(screen.getByText(/Jannik Sinner/)).toBeInTheDocument();
      expect(
        screen.getByText(/não será mais possível alterar o sacador ao longo de toda a partida/i)
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Confirmar troca/i }));
      });
      expect(onSelectServer).toHaveBeenCalledWith('p2');
    });

    it('inverte corretamente para o adversário mesmo quando activeServerId é omitido', async () => {
      const onSelectServer = jest.fn();
      const onClose = jest.fn();

      render(
        <ChangeServerModal
          isOpen={true}
          onClose={onClose}
          match={{ ...singlesMatch, scoreState: { server: 'player1' } as any }}
          onSelectServer={onSelectServer}
        />
      );

      expect(screen.getByText('Inverter sacador inicial')).toBeInTheDocument();
      expect(screen.getByText(/Jannik Sinner/)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Confirmar troca/i }));
      });
      expect(onSelectServer).toHaveBeenCalledWith('p2');
    });

    it('cancela sem chamar onSelectServer ao clicar Cancelar', () => {
      const onSelectServer = jest.fn();
      const onClose = jest.fn();

      render(
        <ChangeServerModal
          isOpen={true}
          onClose={onClose}
          match={singlesMatch}
          activeServerId="p1"
          onSelectServer={onSelectServer}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
      expect(onSelectServer).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Partidas de Duplas', () => {
    it('exibe os 4 jogadores organizados por Dupla 1 e Dupla 2 com destaque no sacador atual', async () => {
      const onSelectServer = jest.fn();
      const onClose = jest.fn();

      render(
        <ChangeServerModal
          isOpen={true}
          onClose={onClose}
          match={doublesMatch}
          activeServerId="p1"
          onSelectServer={onSelectServer}
        />
      );

      expect(screen.getByText('Corrigir Sacador do Game')).toBeInTheDocument();
      expect(screen.getByText('Dupla 1')).toBeInTheDocument();
      expect(screen.getByText('Dupla 2')).toBeInTheDocument();
      expect(screen.getByText('Saca')).toBeInTheDocument();

      // Troca para o parceiro da Dupla 1 com 1 toque (R. Nadal)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /R\. Nadal/i }));
      });
      expect(onSelectServer).toHaveBeenCalledWith('p1p');
    });

    it('permite passar o saque para qualquer jogador da Dupla 2', async () => {
      const onSelectServer = jest.fn();
      const onClose = jest.fn();

      render(
        <ChangeServerModal
          isOpen={true}
          onClose={onClose}
          match={doublesMatch}
          activeServerId="p1"
          onSelectServer={onSelectServer}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /R\. Federer/i }));
      });
      expect(onSelectServer).toHaveBeenCalledWith('p2p');
    });
  });
});

describe('Game2ServerSelectionModal — Regra 14 ITF Just-in-Time', () => {
  it('exibe micro-prompt do Game 2 para escolher quem saca na dupla', async () => {
    const onSelectServer = jest.fn();
    const onClose = jest.fn();

    render(
      <Game2ServerSelectionModal
        isOpen={true}
        onClose={onClose}
        teamName="Dupla 2"
        player1={{ id: 'p2', name: 'Novak Djokovic' }}
        player2={{ id: 'p2p', name: 'Roger Federer' }}
        currentServerId="p2"
        onSelectServer={onSelectServer}
      />
    );

    expect(screen.getByText(/Game 2 — Quem vai sacar\?/i)).toBeInTheDocument();
    expect(screen.getByText('Dupla 2')).toBeInTheDocument();

    // 1 toque no parceiro (R. Federer)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /R\. Federer/i }));
    });
    expect(onSelectServer).toHaveBeenCalledWith('p2p');
  });
});

describe('EditScoreServerSection — Seletor Explícito no Editar Placar', () => {
  it('em simples permite alternar quem saca no game', () => {
    const onSelectServer = jest.fn();

    render(
      <EditScoreServerSection
        currentServer="player1"
        selectedServer="player1"
        onSelectServer={onSelectServer}
        playerNames={{ p1: 'Alcaraz', p2: 'Sinner' }}
      />
    );

    expect(screen.getByText(/Sacador do game atual/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sinner' }));
    expect(onSelectServer).toHaveBeenCalledWith('player2');
  });

  it('em duplas lista os 4 atletas divididos por dupla', () => {
    const onSelectServer = jest.fn();

    render(
      <EditScoreServerSection
        currentServer="player1"
        selectedServer="player1"
        onSelectServer={onSelectServer}
        playerNames={{ p1: 'Alcaraz', p2: 'Djokovic' }}
        doubles={{
          player1PartnerName: 'Nadal',
          player2PartnerName: 'Federer',
          player1Id: 'p1',
          player1PartnerId: 'p1p',
          player2Id: 'p2',
          player2PartnerId: 'p2p',
        }}
      />
    );

    expect(screen.getByText('Dupla 1')).toBeInTheDocument();
    expect(screen.getByText('Dupla 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nadal' }));
    expect(onSelectServer).toHaveBeenCalledWith('player1', 'p1p');
  });
});
