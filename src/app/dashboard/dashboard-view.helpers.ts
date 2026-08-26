export type DashboardView = 'dashboard' | 'annotated' | 'live' | 'pending' | 'history';

export function getDashboardView(pathname: string | null): DashboardView {
  if (pathname?.startsWith('/partidasanotadas')) return 'annotated';
  if (pathname?.startsWith('/partidasaovivo')) return 'live';
  if (pathname?.startsWith('/aguardandoanotador')) return 'pending';
  if (pathname?.startsWith('/historico')) return 'history';
  return 'dashboard';
}
