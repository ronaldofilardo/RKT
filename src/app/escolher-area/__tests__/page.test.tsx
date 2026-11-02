/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import EscolherAreaPage from '../page';
import * as areaHook from '../use-area-selection';

jest.mock('../use-area-selection');
jest.mock('@/components/ui/brand-logo', () => ({
  BrandLogo: () => <div data-testid="brand-logo" />,
}));

describe('EscolherAreaPage (/escolher-area)', () => {
  const mockSelectArea = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado de carregamento', () => {
    (areaHook.useAreaSelection as jest.Mock).mockReturnValue({
      areas: [],
      loading: true,
      switching: null,
      selectArea: mockSelectArea,
    });

    render(<EscolherAreaPage />);
    expect(screen.getByText('Carregando áreas disponíveis...')).toBeInTheDocument();
  });

  it('renderiza opções de áreas e permite seleção', () => {
    (areaHook.useAreaSelection as jest.Mock).mockReturnValue({
      areas: [
        { code: 'TREINADOR_AVULSO', label: 'Treinador Particular', prefix: '/treinador', home: '/treinador' },
        { code: 'ATLETA', label: 'Painel do Atleta', prefix: '/atleta', home: '/atleta' },
      ],
      loading: false,
      switching: null,
      selectArea: mockSelectArea,
    });

    render(<EscolherAreaPage />);
    expect(screen.getByText('Escolha sua Área')).toBeInTheDocument();
    expect(screen.getByText('Treinador Particular')).toBeInTheDocument();
    expect(screen.getByText('Painel do Atleta')).toBeInTheDocument();

    const treinadorBtn = screen.getByText('Treinador Particular').closest('button');
    expect(treinadorBtn).not.toBeNull();
    fireEvent.click(treinadorBtn!);

    expect(mockSelectArea).toHaveBeenCalledWith('TREINADOR_AVULSO', undefined, '/treinador');
  });
});

