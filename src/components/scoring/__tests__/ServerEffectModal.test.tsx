/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ServerEffectModal } from '../ServerEffectModal';

describe('ServerEffectModal', () => {
  const defaultProps = {
    fontScale: 1,
    winnerName: 'Play2',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Erro de 1º Saque (FAULT_FIRST)', () => {
    it('NÃO deve mostrar "Ponto para:" no erro de primeiro saque', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      expect(screen.getByText('1º Saque')).toBeInTheDocument();
      expect(screen.queryByText(/Ponto para:/i)).not.toBeInTheDocument();
    });

    it('deve mostrar título de erro de saque com tipo do erro no 1º saque', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      expect(screen.getByText(/Erro de Saque \(Out\)/i)).toBeInTheDocument();
    });

    it('deve mostrar botão "Registrar e Continuar" no 1º saque', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      expect(screen.getByText('Registrar e Continuar')).toBeInTheDocument();
    });
  });

  describe('Erro de 2º Saque (DOUBLE_FAULT)', () => {
    it('deve mostrar "Ponto para:" no erro de segundo saque (dupla falta)', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="second"
          errorType="out"
        />
      );

      expect(screen.getByText('2º Saque')).toBeInTheDocument();
      expect(screen.getByText(/Ponto para:/i)).toBeInTheDocument();
      expect(screen.getByText('Play2')).toBeInTheDocument();
    });

    it('deve mostrar mensagem informativa sobre dupla falta', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="second"
          errorType="out"
        />
      );

      expect(
        screen.getByText(/O ponto já está definido para o adversário por dupla falta/i)
      ).toBeInTheDocument();
    });

    it('deve mostrar botão "Registrar Dupla Falta" no 2º saque', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="second"
          errorType="out"
        />
      );

      expect(screen.getByText('Registrar Dupla Falta')).toBeInTheDocument();
    });

    it('deve mostrar título de erro de saque no 2º saque', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="second"
          errorType="net"
        />
      );

      expect(screen.getByText(/Erro de Saque \(Net\)/i)).toBeInTheDocument();
    });
  });

  describe('Saque Vencedor (Ace ou Winner)', () => {
    it('deve mostrar "Ponto para:" com nome do vencedor no contexto winner', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="winner"
          serveStep="first"
          winnerName="Play1"
        />
      );

      expect(screen.getByText(/Ponto para:/i)).toBeInTheDocument();
      expect(screen.getByText('Play1')).toBeInTheDocument();
    });

    it('deve mostrar título de efeito do saque no contexto winner', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="winner"
          serveStep="first"
          winnerName="Play1"
        />
      );

      expect(screen.getByText(/Efeito do Saque/i)).toBeInTheDocument();
    });

    it('deve mostrar botão "Confirmar Ponto" no contexto winner', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="winner"
          serveStep="first"
          winnerName="Play1"
        />
      );

      expect(screen.getByText('Confirmar Ponto')).toBeInTheDocument();
    });
  });

  describe('Campos opcionais de efeito e direção', () => {
    it('deve mostrar opções de efeito da falha no contexto error', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      expect(screen.getByText(/Efeito da Falha \(opcional\)/i)).toBeInTheDocument();
      expect(screen.getByText('TopSpin')).toBeInTheDocument();
      expect(screen.getByText('Slice')).toBeInTheDocument();
      expect(screen.getByText('Flat')).toBeInTheDocument();
    });

    it('deve mostrar opções de direção da falha no contexto error', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      expect(screen.getByText(/Direção da Falha \(opcional\)/i)).toBeInTheDocument();
      expect(screen.getByText('Aberto')).toBeInTheDocument();
      expect(screen.getByText('Centro')).toBeInTheDocument();
      expect(screen.getByText('Fechado')).toBeInTheDocument();
    });

    it('deve mostrar opções de efeito no contexto winner', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="winner"
          serveStep="first"
          winnerName="Play1"
        />
      );

      expect(screen.getByText(/🎾 Efeito do Saque/)).toBeInTheDocument();
    });
  });

  describe('Botão Cancelar', () => {
    it('deve chamar onCancel ao clicar em Cancelar sem seleção prévia', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('deve mostrar diálogo de confirmação ao cancelar após selecionar efeito', () => {
      render(
        <ServerEffectModal
          {...defaultProps}
          context="error"
          serveStep="first"
          errorType="out"
        />
      );

      fireEvent.click(screen.getByText('TopSpin'));
      fireEvent.click(screen.getByText('Cancelar'));

      expect(screen.getByText(/Descartar detalhes do saque\?/i)).toBeInTheDocument();
    });
  });
});