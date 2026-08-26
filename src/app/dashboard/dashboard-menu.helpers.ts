type Navigate = (view: 'dashboard' | 'history' | 'annotated' | 'live' | 'pending' | 'atletas' | 'profile' | 'admin' | 'newMatch') => void;

export function createDashboardMenuItems(navigate: Navigate, isAdmin: boolean, logout: () => void) {
  const items = [
    { emoji: '🏠', label: 'Início', action: () => navigate('dashboard') },
    { emoji: '📜', label: 'Histórico', action: () => navigate('history') },
    { emoji: '📝', label: 'Partidas Anotadas', action: () => navigate('annotated') },
    { emoji: '🔴', label: 'Ao Vivo', action: () => navigate('live') },
    { emoji: '⏳', label: 'Aguardando', action: () => navigate('pending') },
    { emoji: '📋', label: 'Atletas', action: () => navigate('atletas') },
    { emoji: '👤', label: 'Dados Pessoais', action: () => navigate('profile') },
  ];
  if (isAdmin) items.push({ emoji: '⚙️', label: 'Admin', action: () => navigate('admin') });
  items.push({ emoji: '📝', label: 'Nova Partida', action: () => navigate('newMatch') });
  return [...items, { emoji: '🚪', label: 'Sair', action: logout }];
}
