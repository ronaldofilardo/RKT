import type { SelectablePlayer } from './ServerSelectionModal';
import { ServeOrderCard, type ServeOrderCardConfig } from './doubles-serve-order-card';

interface DoublesServeOrderSectionProps {
  servingSide: 'player1' | 'player2';
  activeFirstServerP1: string;
  activeFirstServerP2: string;
  onFirstServerP1: (playerId: string) => void;
  onFirstServerP2: (playerId: string) => void;
  selectedP1: SelectablePlayer;
  selectedP1Partner: SelectablePlayer;
  selectedP2: SelectablePlayer;
  selectedP2Partner: SelectablePlayer;
}

export function DoublesServeOrderSection({
  servingSide, activeFirstServerP1, activeFirstServerP2, onFirstServerP1, onFirstServerP2,
  selectedP1, selectedP1Partner, selectedP2, selectedP2Partner,
}: DoublesServeOrderSectionProps) {
  const dupla1: ServeOrderCardConfig = {
    isActive: servingSide === 'player1',
    borderClass: 'border-sky-500/20', titleClass: 'text-sky-400', receiverTitleClass: 'text-sky-400/70',
    activeButtonClass: 'bg-telemetry-blue text-white font-bold',
    title: 'Quem começa sacando na Dupla 1?', receiverTitle: 'Dupla 1 (Recebedora)',
    activeId: activeFirstServerP1, onSelect: onFirstServerP1,
    options: [{ id: selectedP1.id || '', name: selectedP1.name }, { id: selectedP1Partner.id || '', name: selectedP1Partner.name }],
  };
  const dupla2: ServeOrderCardConfig = {
    isActive: servingSide === 'player2',
    borderClass: 'border-emerald-500/20', titleClass: 'text-emerald-400', receiverTitleClass: 'text-emerald-400/70',
    activeButtonClass: 'bg-emerald-600 text-white font-bold',
    title: 'Quem começa sacando na Dupla 2?', receiverTitle: 'Dupla 2 (Recebedora)',
    activeId: activeFirstServerP2, onSelect: onFirstServerP2,
    options: [{ id: selectedP2.id || '', name: selectedP2.name }, { id: selectedP2Partner.id || '', name: selectedP2Partner.name }],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      {/* Sacador 1 de cada dupla (a que recebe mostra o aviso do Game 2) */}
      <ServeOrderCard {...dupla1} />
      <ServeOrderCard {...dupla2} />
    </div>
  );
}
