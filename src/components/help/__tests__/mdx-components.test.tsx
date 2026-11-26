/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { useMDXComponents } from '@/mdx-components';

describe('useMDXComponents (tabelas e formatação)', () => {
  it('registra todos os elementos de tabela semânticos', () => {
    const components = useMDXComponents();
    expect(components.table).toBeDefined();
    expect(components.thead).toBeDefined();
    expect(components.tbody).toBeDefined();
    expect(components.tr).toBeDefined();
    expect(components.th).toBeDefined();
    expect(components.td).toBeDefined();
  });

  it('renderiza estrutura de tabela com wrapper responsivo e classes semânticas', () => {
    const { table: Table, thead: Thead, tbody: Tbody, tr: Tr, th: Th, td: Td } = useMDXComponents();

    render(
      <Table>
        <Thead>
          <Tr>
            <Th>Termo</Th>
            <Th>Significado</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Atleta</Td>
            <Td>Perfil de quem joga</Td>
          </Tr>
        </Tbody>
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Termo')).toBeInTheDocument();
    expect(screen.getByText('Atleta')).toBeInTheDocument();
    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
  });
});
