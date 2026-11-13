import type { MenuItem } from './menu-types';

export const link = (
  key: string,
  label: string,
  href: string,
  icon: string,
  disabled = false,
  badge?: string,
): MenuItem => ({
  key,
  label,
  href,
  icon,
  disabled,
  badge,
});

/** Item ainda não desenvolvido: desabilitado, sem rota. */
export const soon = (key: string, label: string, icon: string): MenuItem => ({
  key,
  label,
  icon,
  disabled: true,
  badge: 'Em breve',
});

