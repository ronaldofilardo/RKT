/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { RANKING_TYPES, type RankingType } from '@/lib/ranking/rankingConstants';
import { RankingForm } from '@/app/atletas/RankingForm';

type RankingState = {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
};

function createRankings(): Record<RankingType, RankingState> {
  return Object.fromEntries(
    RANKING_TYPES.map((type) => [type, {
      enabled: false,
      category: '',
      class: '',
      position: '',
      juvenilePosition: '',
    }]),
  ) as Record<RankingType, RankingState>;
}

describe('RankingForm — regressões reais de layout e interação', () => {
  it('renderiza Estadual em linha com Classe, Posição e Remover', () => {
    const rankings = createRankings();
    const onRankingToggle = jest.fn();
    const onRankingFieldChange = jest.fn();

    render(
      <RankingForm
        showHeader={false}
        form={{ gender: 'MALE' }}
        rankings={rankings}
        age={25}
        saving={false}
        onRankingToggle={onRankingToggle}
        onRankingFieldChange={onRankingFieldChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Estadual'));

    expect(onRankingToggle).toHaveBeenCalledWith('ESTADUAL');
  });

  it('exibe as opções de classe masculina e posição quando Estadual está ativo', () => {
    const rankings = createRankings();
    rankings.ESTADUAL.enabled = true;
    const onRankingFieldChange = jest.fn();

    render(
      <RankingForm
        showHeader={false}
        form={{ gender: 'MALE' }}
        rankings={rankings}
        age={25}
        saving={false}
        onRankingToggle={jest.fn()}
        onRankingFieldChange={onRankingFieldChange}
      />,
    );

    const classSelect = screen.getByLabelText('Classe');
    const positionInput = screen.getByLabelText('Posição');

    expect(classSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1ªMA' })).toBeInTheDocument();
    expect(positionInput).toBeInTheDocument();

    fireEvent.change(classSelect, { target: { value: '1ªMA' } });
    fireEvent.change(positionInput, { target: { value: '35' } });

    expect(onRankingFieldChange).toHaveBeenNthCalledWith(1, 'ESTADUAL', 'class', '1ªMA');
    expect(onRankingFieldChange).toHaveBeenNthCalledWith(2, 'ESTADUAL', 'position', '35');
  });

  it('adulto sem categoria: Classe + Posição juntas na linha 1 e sem linha 2', () => {
    const rankings = createRankings();
    rankings.ESTADUAL.enabled = true;

    const { container } = render(
      <RankingForm
        showHeader={false}
        form={{ gender: 'MALE' }}
        rankings={rankings}
        age={25}
        saving={false}
        onRankingToggle={jest.fn()}
        onRankingFieldChange={jest.fn()}
      />,
    );

    const rows = container.querySelectorAll('.grid.grid-cols-2');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContainElement(screen.getByLabelText('Classe'));
    expect(rows[0]).toContainElement(screen.getByLabelText('Posição'));
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
    expect(container.querySelector('.overflow-x-auto')).not.toBeInTheDocument();
  });

  it('exibe Categoria+Posição na linha 1 e Classe+Posição Ranking Juvenil na linha 2 para atleta juvenil de 17 anos', () => {
    const rankings = createRankings();
    rankings.ESTADUAL.enabled = true;
    rankings.ESTADUAL.category = '17-18';
    const onRankingFieldChange = jest.fn();
    const onRankingToggle = jest.fn();

    const { container } = render(
      <RankingForm
        showHeader={false}
        form={{ gender: 'MALE' }}
        rankings={rankings}
        age={17}
        saving={false}
        onRankingToggle={onRankingToggle}
        onRankingFieldChange={onRankingFieldChange}
      />,
    );

    const categorySelect = screen.getByLabelText('Categoria');
    const positionInput = screen.getByLabelText('Posição');
    const juvenilePositionInput = screen.getByLabelText('Posição Ranking Juvenil');
    const removerButton = screen.getByRole('button', { name: 'Remover' });

    expect(categorySelect).toBeInTheDocument();
    expect(positionInput).toBeInTheDocument();
    expect(juvenilePositionInput).toBeInTheDocument();
    expect(removerButton).toBeInTheDocument();

    // Layout em 2 linhas (sem scroll horizontal): Categoria+Posição / Classe+Posição Juvenil.
    const rows = container.querySelectorAll('.grid.grid-cols-2');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContainElement(categorySelect);
    expect(rows[0]).toContainElement(positionInput);
    expect(rows[1]).toContainElement(screen.getByLabelText('Classe'));
    expect(rows[1]).toContainElement(juvenilePositionInput);
    expect(container.querySelector('.overflow-x-auto')).not.toBeInTheDocument();

    // Interações de alteração dos campos
    fireEvent.change(positionInput, { target: { value: '115' } });
    expect(onRankingFieldChange).toHaveBeenCalledWith('ESTADUAL', 'position', '115');

    fireEvent.change(juvenilePositionInput, { target: { value: '42' } });
    expect(onRankingFieldChange).toHaveBeenCalledWith('ESTADUAL', 'juvenilePosition', '42');

    // Clicar em Remover desativa o ranking
    fireEvent.click(removerButton);
    expect(onRankingToggle).toHaveBeenCalledWith('ESTADUAL');
  });
});
