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
});
