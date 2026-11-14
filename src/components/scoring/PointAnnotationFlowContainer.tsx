'use client';

import { usePointAnnotationFlow } from './usePointAnnotationFlow';
import { HowPointEndedModal } from './HowPointEndedModal';
import { WhereWinnerModal } from './WhereWinnerModal';
import { AceDetailsModal } from './AceDetailsModal';
import { SelectPointWinnerModal } from './SelectPointWinnerModal';
import { PointDetailsModal } from './PointDetailsModal';
import type { RallySituacao, RallyTipo } from '@/core/scoring/rally.types';
import type { RallyDetailsWithAttribution } from '@/core/scoring/types';
import type { PointDetailsDoublesInfo } from './use-point-details-modal.types';

export interface PointAnnotationFlowContainerProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetailsWithAttribution, audio?: { blob: Blob; durationMs: number }) => void;
  onCancel: () => void;
  doubles?: PointDetailsDoublesInfo;
  recordAceDirectly: () => void;
  confirmServerEffect: (effect?: string, direction?: string) => void;
  recordDirectServeError: (errorType: 'out' | 'net', step: 'first' | 'second') => void;
  hasFirstServeError: boolean;
  serveStep: 'none' | 'second';
}

const HOW_TO_TIPO: Record<string, RallyTipo> = { WINNER: 'winner', ERRO_FORCADO: 'erro_forcado', ERRO_NAO_FORCADO: 'erro_nao_forcado' };
const WHERE_TO_SITUACAO: Record<string, RallySituacao> = { devolvendo: 'devolucao', fundo: 'fundo', voleio: 'rede', passando: 'passada' };

export function PointAnnotationFlowContainer(props: PointAnnotationFlowContainerProps) {
  const {
    winnerPlayerSide, currentServer, player1Name, player2Name, fontScale,
    onConfirm, onCancel, doubles, recordAceDirectly, confirmServerEffect,
    hasFirstServeError, serveStep,
  } = props;

  const {
    flow, selectHowEnded, selectWhereWinner, selectWinner, backToHowEnded,
    isHowEnded, isAceDetails, isWhereWinner, isSelectWinner,
  } = usePointAnnotationFlow(winnerPlayerSide);

  const handleHowEndedSelect = (option: string) => {
    if (option === 'ACE') return recordAceDirectly();
    if (option === 'SERVE_FAULT') return selectHowEnded('SERVE_FAULT');
    selectHowEnded(option as any);
  };

  const preFilledSituacao = flow.whereWinner ? WHERE_TO_SITUACAO[flow.whereWinner] : undefined;
  const preFilledTipo = flow.howEnded && HOW_TO_TIPO[flow.howEnded] ? HOW_TO_TIPO[flow.howEnded] : undefined;

  return (
    <div data-testid="point-details-modal">
      <HowPointEndedModal
        isOpen={isHowEnded}
        onSelect={handleHowEndedSelect}
        onAce={(isAce) => { if (isAce) selectHowEnded('ACE'); }}
        firstServeErrorRegistered={hasFirstServeError}
      />
      <AceDetailsModal
        isOpen={isAceDetails}
        serveStep={serveStep}
        onConfirm={(effect, direction) => confirmServerEffect(effect, direction)}
        onCancel={backToHowEnded}
      />
      <WhereWinnerModal
        isOpen={isWhereWinner}
        onSelect={(opt) => selectWhereWinner(opt as any)}
        onBack={backToHowEnded}
      />
      <SelectPointWinnerModal
        isOpen={isSelectWinner}
        winner={flow.winner}
        player1Name={player1Name}
        player2Name={player2Name}
        onSelectWinner={selectWinner}
        onBack={backToHowEnded}
      />
      {flow.winner && preFilledSituacao && preFilledTipo && (
        <PointDetailsModal
          winnerPlayerSide={flow.winner}
          currentServer={currentServer}
          player1Name={player1Name}
          player2Name={player2Name}
          fontScale={fontScale}
          onConfirm={onConfirm}
          onCancel={onCancel}
          doubles={doubles}
          howEnded={preFilledTipo}
          whereWinner={preFilledSituacao}
        />
      )}
    </div>
  );
}
