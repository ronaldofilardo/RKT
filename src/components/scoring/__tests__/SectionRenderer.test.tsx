/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionRenderer } from '../SectionRenderer';
import type { PointDetailsForm, Vencedor } from '../point-details-logic';

const emptyForm: PointDetailsForm = {
  situacao: null,
  tipo: null,
  golpe: null,
  subtipo1: null,
  subtipo2: null,
  efeito: null,
  duracao: null,
  direcao: null,
  golpeEsp: null,
};

function makeRefs() {
  return {
    tipoRef: React.createRef<HTMLDivElement>(),
    golpeRef: React.createRef<HTMLDivElement>(),
    duracaoRef: React.createRef<HTMLDivElement>(),
    subtipo1Ref: React.createRef<HTMLDivElement>(),
    subtipo2Ref: React.createRef<HTMLDivElement>(),
    efeitoRef: React.createRef<HTMLDivElement>(),
  };
}

function renderSectionRenderer(
  form: Partial<PointDetailsForm> = {},
  vencedor: Vencedor = 'sacador',
  dispatch = jest.fn(),
) {
  const refs = makeRefs();
  const result = render(
    <SectionRenderer
      form={{ ...emptyForm, ...form }}
      vencedor={vencedor}
      dispatch={dispatch}
      refs={refs}
    />,
  );
  return { ...result, dispatch, refs };
}

describe('SectionRenderer', () => {
  describe('seção 1 - Situação do Ponto', () => {
    it('renderiza os pills de situação', () => {
      renderSectionRenderer();
      expect(screen.getByText('Devolução de Saque')).toBeInTheDocument();
      expect(screen.getByText('Fundo de Quadra')).toBeInTheDocument();
      expect(screen.getByText('Passada')).toBeInTheDocument();
      expect(screen.getByText('Rede')).toBeInTheDocument();
    });

    it('dispatch SET_SITUACAO ao clicar em uma situação', () => {
      const { dispatch } = renderSectionRenderer();
      fireEvent.click(screen.getByText('Fundo de Quadra'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SITUACAO', value: 'fundo' });
    });
  });

  describe('seção 2 - Resultado do Ponto', () => {
    it('não renderiza quando situacao é null', () => {
      renderSectionRenderer();
      expect(screen.queryByText('Resultado do Ponto')).not.toBeInTheDocument();
    });

    it('renderiza quando situacao está selecionada', () => {
      renderSectionRenderer({ situacao: 'fundo' });
      expect(screen.getByText(/Resultado do Ponto/)).toBeInTheDocument();
    });

    it('mostra descrição quando tipo é null', () => {
      renderSectionRenderer({ situacao: 'fundo' });
      expect(screen.getByText('Selecione como o ponto terminou')).toBeInTheDocument();
    });

    it('dispatch SET_TIPO ao selecionar tipo', () => {
      const { dispatch } = renderSectionRenderer({ situacao: 'fundo' });
      fireEvent.click(screen.getByText('Winner'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_TIPO', value: 'winner' });
    });
  });

  describe('seção 3 - Golpe', () => {
    it('não renderiza quando tipo é null', () => {
      renderSectionRenderer({ situacao: 'fundo' });
      expect(screen.queryByText(/^3\. Golpe$/)).not.toBeInTheDocument();
    });

    it('renderiza quando situacao e tipo estão selecionados', () => {
      renderSectionRenderer({ situacao: 'fundo', tipo: 'winner' });
      expect(screen.getByText(/Golpe/)).toBeInTheDocument();
    });

    it('dispatch SET_GOLPE ao selecionar golpe', () => {
      const { dispatch } = renderSectionRenderer({ situacao: 'fundo', tipo: 'winner' });
      fireEvent.click(screen.getByText(/Forehand/));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_GOLPE', value: 'fh' });
    });
  });

  describe('seção 4 - Tipo de Erro (Rede)', () => {
    it('renderiza quando vencedor=sacador, situacao=rede, tipo=erro_nao_forcado', () => {
      renderSectionRenderer(
        { situacao: 'rede', tipo: 'erro_nao_forcado', golpe: 'fh' },
        'sacador',
      );
      expect(screen.getByText(/Tipo de Erro/)).toBeInTheDocument();
    });

    it('não renderiza quando vencedor=devolvedor e situacao=rede', () => {
      renderSectionRenderer(
        { situacao: 'rede', tipo: 'erro_nao_forcado', golpe: 'fh' },
        'devolvedor',
      );
      expect(screen.queryByText(/Tipo de Erro/)).not.toBeInTheDocument();
    });

    it('dispatch SET_SUBTIPO1 ao selecionar subtipo1', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'rede', tipo: 'erro_nao_forcado', golpe: 'fh' },
        'sacador',
      );
      fireEvent.click(screen.getByText('Passing Shot'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SUBTIPO1', value: 'passing_shot' });
    });
  });

  describe('seção "Onde Errou?"', () => {
    it('renderiza quando passada + erro + voleio/smash', () => {
      renderSectionRenderer(
        { situacao: 'passada', tipo: 'erro_nao_forcado', golpe: 'vbh' },
        'sacador',
      );
      expect(screen.getByText(/Onde Errou/)).toBeInTheDocument();
    });

    it('dispatch SET_SUBTIPO2 ao selecionar subtipo2', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'passada', tipo: 'erro_nao_forcado', golpe: 'vbh' },
        'sacador',
      );
      fireEvent.click(screen.getByText('Fora (Out)'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SUBTIPO2', value: 'out' });
    });
  });

  describe('seção Efeito', () => {
    it('renderiza quando golpe selecionado e não é passada+erro nem rede+winner', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      expect(screen.getByText(/Efeito/)).toBeInTheDocument();
    });

    it('dispatch SET_EFEITO ao selecionar efeito', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      fireEvent.click(screen.getByText('Topspin'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EFEITO', value: 'topspin' });
    });
  });

  describe('seção Direção', () => {
    it('renderiza quando golpe está selecionado', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      expect(screen.getByText(/Direção/)).toBeInTheDocument();
    });

    it('seleciona null na direção quando efeito é necessário mas não foi selecionado', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      const direcaoSection = screen.getByText(/Direção/).parentElement!;
      const direcaoBtns = direcaoSection.querySelectorAll('button');
      expect(direcaoBtns.length).toBeGreaterThan(0);
      const hasActiveBtn = Array.from(direcaoBtns).some(btn =>
        btn.className.includes('bg-blue-50'),
      );
      expect(hasActiveBtn).toBe(false);
    });

    it('dispatch SET_DIRECAO ao selecionar direção', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' },
        'sacador',
      );
      fireEvent.click(screen.getByText('Cruzada'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DIRECAO', value: 'cruzada' });
    });
  });

  describe('seção Golpe Especial', () => {
    it('renderiza quando topspin + sacador + fundo + winner', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' },
        'sacador',
      );
      expect(screen.getByText(/Golpe Especial/)).toBeInTheDocument();
    });

    it('não renderiza quando golpe é smash', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'smash', efeito: 'topspin' },
        'sacador',
      );
      expect(screen.queryByText(/Golpe Especial/)).not.toBeInTheDocument();
    });

    it('dispatch SET_GOLPE_ESP ao selecionar golpe especial', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' },
        'sacador',
      );
      fireEvent.click(screen.getByText('Lob'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_GOLPE_ESP', value: 'lob' });
    });
  });

  describe('seção Duração do Rallye', () => {
    it('renderiza quando golpe é selecionado e situacao não é devolucao/saque', () => {
      renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      expect(screen.getByText(/Duração do Rallye/)).toBeInTheDocument();
    });

    it('não renderiza quando situacao é devolucao', () => {
      renderSectionRenderer(
        { situacao: 'devolucao', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      expect(screen.queryByText(/Duração do Rallye/)).not.toBeInTheDocument();
    });

    it('dispatch SET_DURACAO ao selecionar duração', () => {
      const { dispatch } = renderSectionRenderer(
        { situacao: 'fundo', tipo: 'winner', golpe: 'fh' },
        'sacador',
      );
      fireEvent.click(screen.getByText('3 a 6 bolas'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DURACAO', value: 'opcao_1' });
    });
  });

  describe('numeração das seções', () => {
    it('usa numeração "4" para Onde Errou quando subtipo1 não está presente', () => {
      renderSectionRenderer(
        {
          situacao: 'passada',
          tipo: 'erro_nao_forcado',
          golpe: 'vbh',
        },
        'sacador',
      );
      expect(screen.getByText(/4\. Onde Errou/)).toBeInTheDocument();
    });

    it('usa numeração correta para Efeito sem subtipo1 nem subtipo2', () => {
      renderSectionRenderer(
        {
          situacao: 'fundo',
          tipo: 'winner',
          golpe: 'fh',
        },
        'sacador',
      );
      expect(screen.getByText(/4\. Efeito/)).toBeInTheDocument();
    });
  });
});
