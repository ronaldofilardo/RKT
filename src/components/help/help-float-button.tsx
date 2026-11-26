'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { showHelpEntry } from '@/core/help/help-perfil.logic';

/**
 * Botão flutuante "Ajuda" para telas sem menu (Fatia 4 da Central de Ajuda).
 * Posicionado no canto superior direito, abaixo do cabeçalho da partida (em paisagem,
 * colado à borda): evita cobrir os alvos de toque da área de jogo (cartões dos
 * jogadores e barras de anotação), que ocupam o restante da tela.
 * A visibilidade espelha o item AJUDA do rodapé via `showHelpEntry`.
 */
export function HelpFloatButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const area = sessionStorage.getItem('active_area');
    const role = sessionStorage.getItem('user_role');
    setVisible(showHelpEntry(area, role));
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/help"
      aria-label="Abrir a Central de Ajuda"
      title="Central de Ajuda"
      className="fixed right-2 top-10 landscape:top-2 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-telemetry-card/90 text-sm font-semibold text-telemetry-text-muted shadow-lg hover:bg-telemetry-active hover:text-white focus-visible:border-telemetry-blue"
    >
      ?
    </Link>
  );
}
