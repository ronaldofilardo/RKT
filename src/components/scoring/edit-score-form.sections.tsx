import { useEffect, useRef } from 'react';
import { GAME_POINTS } from '@/core/scoring/point-utils';
import type { SetInputFormProps } from './edit-score-form';

export function MatchClosedNotice() {
  return (
    <div className="space-y-3 rounded-lg bg-gray-750 border border-white/5 p-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Partida Encerrada</p>
      <p className="text-xs text-gray-500">A partida já foi finalizada. Não é possível adicionar novos sets.</p>
    </div>
  );
}

export function SetHeading({ props }: { props: SetInputFormProps }) {
  const { isMatchTiebreakSet, isPotentialMTSet, totalEditedSets } = props;
  if (isMatchTiebreakSet) {
    return <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Set {totalEditedSets + 1} — Match Tiebreak</p>;
  }
  if (isPotentialMTSet) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Set {totalEditedSets + 1}</p>
        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Pode virar MT em 6-6</span>
      </div>
    );
  }
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Set {totalEditedSets + 1}</p>;
}

export function ScoreInputs({ props }: { props: SetInputFormProps }) {
  const { matchFormat, playerNames, p1Input, p2Input, p1Val, p2Val, isMatchTiebreakSet, onP1InputChange, onP2InputChange } = props;
  const p1InputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { p1InputRef.current?.focus(); }, []);
  const max = isMatchTiebreakSet ? 30 : matchFormat === 'PRO_SET_8' ? 9 : 7;
  const p1Border = p1Input && p2Input && p1Val > p2Val ? 'border-green-500/50' : 'border-white/10';
  const p2Border = p1Input && p2Input && p2Val > p1Val ? 'border-green-500/50' : 'border-white/10';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16 truncate">{playerNames.p1}</span>
      <input type="number" className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${p1Border}`} value={p1Input} onChange={(e) => onP1InputChange(e.target.value)} placeholder="0" ref={p1InputRef} max={max} />
      <span className="text-gray-500 text-xs">×</span>
      <input type="number" className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${p2Border}`} value={p2Input} onChange={(e) => onP2InputChange(e.target.value)} placeholder="0" max={max} />
      <span className="text-xs text-gray-400 w-16 truncate text-right">{playerNames.p2}</span>
    </div>
  );
}

function TiebreakInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input type="number" className="w-16 text-center bg-gray-700 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" value={value} onChange={(e) => { const parsed = parseInt(e.target.value, 10); if (!Number.isNaN(parsed) && parsed >= 0) onChange(String(parsed)); else if (e.target.value === '') onChange(''); }} min={0} max={20} placeholder="0" />;
}

function isTiebreakRequired(props: SetInputFormProps): boolean {
  const { isMatchTiebreakSet, hasTiebreak, p1Input, p2Input, p1Val, p2Val, matchFormat } = props;
  const standardTiebreak = p1Val === 6 && p2Val === 6;
  const shortTiebreak = matchFormat === 'SHORT_SET_2V2_NO_AD' && p1Val === 4 && p2Val === 4;
  return !isMatchTiebreakSet && hasTiebreak && Boolean(p1Input && p2Input) && (standardTiebreak || shortTiebreak);
}

export function TiebreakSection({ props }: { props: SetInputFormProps }) {
  const { playerNames, tiebreakP1, tiebreakP2, tiebreakComplete, onTiebreakP1Change, onTiebreakP2Change } = props;
  const setTiebreak = !props.isMatchTiebreakSet && props.hasTiebreak && props.p1Val === 6 && props.p2Val === 6;
  if (!isTiebreakRequired(props) || setTiebreak) return null;
  return (
    <div className="space-y-1 pt-1">
      <p className="text-xs font-semibold text-gray-400">Tie-Break</p>
      <div className="flex items-center gap-2"><span className="text-xs text-gray-400 w-16 truncate">{playerNames.p1}</span><TiebreakInput value={tiebreakP1} onChange={onTiebreakP1Change} /><span className="text-gray-500 text-xs">×</span><TiebreakInput value={tiebreakP2} onChange={onTiebreakP2Change} /><span className="text-xs text-gray-400 w-16 truncate text-right">{playerNames.p2}</span></div>
      {!tiebreakComplete && <p className="text-xs text-gray-500 mt-1">Informe o placar do tiebreak (ex.: 7x5).</p>}
    </div>
  );
}

function getStatusMessage(props: SetInputFormProps): string | null {
  const { p1Input, p2Input, isSetTrulyCompleted, isMatchTiebreakSet, totalEditedSets, playerNames, p1Val, p2Val } = props;
  if (!p1Input || !p2Input) return null;
  const winner = p1Val > p2Val ? playerNames.p1 : playerNames.p2;
  if (isMatchTiebreakSet) return isSetTrulyCompleted ? `${winner} venceu o match tiebreak — partida encerrada` : null;
  return isSetTrulyCompleted ? `${winner} venceu o set` : `Set ${totalEditedSets + 1} em andamento — informe os games`;
}

export function StatusMessages({ props }: { props: SetInputFormProps }) {
  const { floorValidationError, hasTiebreak, p1Input, p2Input, isSetTrulyCompleted, tiebreakComplete } = props;
  if (floorValidationError) return <p className="text-xs text-red-400">{floorValidationError}</p>;
  if (hasTiebreak && p1Input && p2Input && isSetTrulyCompleted && !tiebreakComplete) return <p className="text-xs text-amber-400">Tiebreak necessário - informe os pontos para completar o set</p>;
  const message = getStatusMessage(props);
  if (!message) return null;
  return <p className={`text-xs ${isSetTrulyCompleted ? 'text-green-400' : 'text-amber-400'}`}>{message}</p>;
}

type ConfirmationProps = SetInputFormProps & { isMatchOver: boolean };

export function ConfirmationSection({ props }: { props: ConfirmationProps }) {
  const { isSetTrulyCompleted, matchWouldEnd, isMatchOver, canConfirmSet, onConfirmSet, totalEditedSets, playerNames, p1Val, p2Val, p1SetsWon, p2SetsWon } = props;
  if (isSetTrulyCompleted && !matchWouldEnd && !isMatchOver) return <button type="button" onClick={onConfirmSet} disabled={!canConfirmSet} className="w-full mt-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm">Confirmar Set {totalEditedSets + 1}</button>;
  if (!isSetTrulyCompleted || !matchWouldEnd) return null;
  return <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-3 mt-2"><p className="text-sm font-semibold text-green-300">Partida encerrada — confirmar para finalizar</p><p className="text-xs text-green-400 mt-1">{p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu por {p1SetsWon}-{p2SetsWon} sets</p></div>;
}

export function FloorWarning({ props }: { props: SetInputFormProps }) {
  const { partial, floorCurrentSets, p1Val, p2Val } = props;
  if (!partial || !floorCurrentSets || (p1Val >= floorCurrentSets.player1 && p2Val >= floorCurrentSets.player2)) return null;
  return <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-2"><p className="text-xs text-amber-300">Ponto de parada: {floorCurrentSets.player1}x{floorCurrentSets.player2} — placar não pode ser inferior a este valor.</p></div>;
}

export function GamePointsSection({ props }: { props: SetInputFormProps }) {
  const { partial, showGamePointsAtZero, isMatchTiebreakSet, hasTiebreak, p1Val, p2Val, playerNames, p1Points, p2Points, tiebreakP1, tiebreakP2, onP1PointsChange, onP2PointsChange, onTiebreakP1Change, onTiebreakP2Change } = props;
  const setTiebreak = !isMatchTiebreakSet && hasTiebreak && p1Val === 6 && p2Val === 6;
  if ((!partial && !showGamePointsAtZero && !setTiebreak) || isMatchTiebreakSet) return null;
  const options = setTiebreak ? Array.from({ length: 31 }, (_, index) => <option key={index} value={index}>{index}</option>) : <>{GAME_POINTS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}{p2Points === '40' && <><option value="DEUCE">Deuce</option><option value="AD">Adv.</option></>}</>;
  const p1Value = setTiebreak ? tiebreakP1 : p1Points;
  const p2Value = setTiebreak ? tiebreakP2 : p2Points;
  const updateP1 = setTiebreak ? onTiebreakP1Change : onP1PointsChange;
  const updateP2 = setTiebreak ? onTiebreakP2Change : onP2PointsChange;
  return <div className="space-y-1 pt-1"><p className="text-xs font-semibold text-gray-400">{setTiebreak ? 'Pontos no Game Atual — Tiebreak' : 'Pontos no Game Atual'}</p><div className="flex items-center gap-2"><span className="text-xs text-gray-400 w-16 truncate">{playerNames.p1}</span><select className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono" value={p1Value} onChange={(e) => updateP1(e.target.value)}><option value="">Selecione...</option>{options}</select><span className="text-gray-500 text-xs">×</span><select className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono" value={p2Value} onChange={(e) => updateP2(e.target.value)}><option value="">Selecione...</option>{options}</select><span className="text-xs text-gray-400 w-16 truncate text-right">{playerNames.p2}</span></div></div>;
}

export function SetInputFormContent({ props }: { props: SetInputFormProps }) {
  const { totalEditedSets, maxSets, matchAlreadyOver } = props;
  const isMatchOver = matchAlreadyOver || totalEditedSets >= maxSets;
  if (isMatchOver) return <MatchClosedNotice />;
  return <div className="space-y-3 rounded-lg bg-gray-750 border border-white/5 p-3"><SetHeading props={props} /><ScoreInputs props={props} /><TiebreakSection props={props} /><StatusMessages props={props} /><ConfirmationSection props={{ ...props, isMatchOver }} /><FloorWarning props={props} /><GamePointsSection props={props} /></div>;
}
