/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { GestorDashboard } from '../dashboard';

const mockChrome = jest.fn();
jest.mock('@/app/dashboard/components/DashboardChrome', () => ({
  DashboardChrome: (props: Record<string, unknown>) => { mockChrome(props); return <header data-testid="chrome" />; },
}));
jest.mock('@/app/match/new/components/NewAthleteModal', () => ({ NewAthleteModal: () => null }));
jest.mock('../cadastrar-membro-modal', () => ({ CadastrarMembroModal: () => null }));
jest.mock('../coaches-table', () => ({ CoachesTable: () => null }));
jest.mock('../athletes-table', () => ({ AthletesTable: () => null }));
jest.mock('../club-info', () => ({ ClubInfo: () => null }));
jest.mock('../managers-section', () => ({ ManagersSection: () => null }));
jest.mock('../dashboard-header', () => ({ DashboardHeader: () => null }));
jest.mock('../tab-nav', () => ({ TabNav: () => null }));

const me = {
  user: { id: 'u1', name: 'Eduardo', email: 'e@x.com', role: 'ANNOTATOR', cpf: '1', mustChangePassword: false },
  memberships: [{ kind: 'GESTOR', ctId: 'ct1', status: 'ACTIVE' }],
  ctStatus: 'ACTIVE' as const,
};

describe('GestorDashboard - cabeçalho', () => {
  beforeEach(() => {
    mockChrome.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }) as unknown as typeof fetch;
  });

  it('renderiza o cabeçalho sem o menu hambúrguer (showMenu=false)', async () => {
    render(<GestorDashboard me={me} tab="coaches" setTab={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('chrome')).toBeInTheDocument());
    expect(mockChrome).toHaveBeenCalledWith(expect.objectContaining({ title: 'Painel do Gestor', showMenu: false }));
  });
});
