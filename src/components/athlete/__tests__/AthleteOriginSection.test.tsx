/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteOriginSection } from '../AthleteOriginSection';

function renderSection(props: Partial<React.ComponentProps<typeof AthleteOriginSection>> = {}) {
  const onChange = jest.fn();
  return {
    ...render(
      <AthleteOriginSection
        uf={props.uf ?? null}
        city={props.city ?? null}
        club={props.club ?? null}
        onChange={onChange}
      />
    ),
    onChange,
  };
}

describe('AthleteOriginSection', () => {
  it('renderiza os tres campos: UF, Cidade e Clube', () => {
    renderSection();
    expect(screen.getByLabelText('Estado (UF)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toBeInTheDocument();
    expect(screen.getByLabelText('Clube do Atleta')).toBeInTheDocument();
  });

  it('emite valores ao selecionar uma UF', () => {
    const { onChange } = renderSection();
    const ufSelect = screen.getByLabelText('Estado (UF)') as HTMLSelectElement;
    fireEvent.change(ufSelect, { target: { value: 'SP' } });
    expect(onChange).toHaveBeenCalledWith({
      uf: 'SP', city: null, club: null,
    });
  });

  it('emite valores ao digitar na cidade', () => {
    const { onChange } = renderSection();
    const cityInput = screen.getByLabelText('Cidade') as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: 'Curitiba' } });
    expect(onChange).toHaveBeenCalledWith({
      uf: null, city: 'Curitiba', club: null,
    });
  });

  it('emite valores ao digitar no clube', () => {
    const { onChange } = renderSection();
    const clubInput = screen.getByLabelText('Clube do Atleta') as HTMLInputElement;
    fireEvent.change(clubInput, { target: { value: 'Pinheiros' } });
    expect(onChange).toHaveBeenCalledWith({
      uf: null, city: null, club: 'Pinheiros',
    });
  });

  it('nao aceita UF invalida', () => {
    const { onChange } = renderSection();
    const ufSelect = screen.getByLabelText('Estado (UF)') as HTMLSelectElement;
    fireEvent.change(ufSelect, { target: { value: 'XX' } });
    expect(onChange).toHaveBeenCalledWith({
      uf: null, city: null, club: null,
    });
  });

  it('renderiza valores iniciais quando fornecidos', () => {
    renderSection({ uf: 'RJ', city: 'Rio de Janeiro', club: 'Flamengo' });
    expect((screen.getByLabelText('Estado (UF)') as HTMLSelectElement).value).toBe('RJ');
    expect((screen.getByLabelText('Cidade') as HTMLInputElement).value).toBe('Rio de Janeiro');
    expect((screen.getByLabelText('Clube do Atleta') as HTMLInputElement).value).toBe('Flamengo');
  });
});
