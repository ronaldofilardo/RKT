import type {
  RallyDirecao,
  RallyEfeito,
  RallyGolpe,
  RallyGolpeEsp,
  RallySituacao,
  RallySubtipo2,
  RallyTipo,
} from '@/core/scoring/types';
import type { Vencedor } from './point-details-logic';

const GROUND_STROKES: RallyGolpe[] = ['fh', 'bh'];
const VOLLEY_STROKES: RallyGolpe[] = ['vfh', 'vbh', 'smash'];
const BASIC_SPECIAL: RallyGolpeEsp[] = ['drop_shot', 'bate_pronto', 'swing_volley'];
const FULL_SPECIAL: RallyGolpeEsp[] = ['lob', ...BASIC_SPECIAL];
const DIRECTIONS: RallyDirecao[] = ['cruzada', 'paralela', 'centro'];

export function resolveGolpeOptions(
  _vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
): RallyGolpe[] {
  if (situacao === 'fundo' || situacao === 'devolucao') return GROUND_STROKES;
  if (situacao === 'passada') return tipo === 'winner' ? GROUND_STROKES : VOLLEY_STROKES;
  if (situacao === 'rede') return tipo === 'winner' ? VOLLEY_STROKES : GROUND_STROKES;
  return GROUND_STROKES;
}

function isVolley(golpe: RallyGolpe): boolean {
  return golpe === 'vbh' || golpe === 'vfh';
}

function canUseBasicVolleySpecial(
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  subtipo2: RallySubtipo2 | null,
  direcao: RallyDirecao | null,
): boolean {
  if (vencedor === 'devolvedor') return true;
  const validSubtipo = subtipo2 === 'out' || subtipo2 === 'net';
  const validDirection = direcao !== null && DIRECTIONS.includes(direcao);
  const fromVolleyContext = validSubtipo && validDirection;
  const fromSituation =
    (situacao === 'rede' && tipo === 'winner') ||
    (situacao === 'passada' && tipo !== 'winner');
  return fromVolleyContext || fromSituation;
}

function resolveVolleySpecial(
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  subtipo2: RallySubtipo2 | null,
  direcao: RallyDirecao | null,
): RallyGolpeEsp[] {
  if (vencedor === 'devolvedor') return BASIC_SPECIAL;
  return canUseBasicVolleySpecial(vencedor, situacao, tipo, subtipo2, direcao)
    ? (situacao === 'rede' && tipo === 'winner' || situacao === 'passada' && tipo !== 'winner' ? FULL_SPECIAL : BASIC_SPECIAL)
    : [];
}

function resolveTopspinSpecial(
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
): RallyGolpeEsp[] {
  if (vencedor === 'devolvedor' && situacao === 'fundo') return [];
  if (tipo === 'winner') return ['lob'];
  if (vencedor === 'sacador' && situacao === 'rede') return ['lob'];
  if (vencedor === 'sacador' && situacao === 'fundo') return ['lob', 'bate_pronto'];
  return [];
}

export function resolveGolpeEspOptions(
  golpe: RallyGolpe,
  efeito: RallyEfeito | null,
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  subtipo2: RallySubtipo2 | null,
  direcao: RallyDirecao | null,
): RallyGolpeEsp[] {
  if (golpe === 'smash' || efeito === 'flat') return [];
  if (efeito === 'slice') return ['lob', 'drop_shot'];
  if (isVolley(golpe) && !efeito) {
    return resolveVolleySpecial(vencedor, situacao, tipo, subtipo2, direcao);
  }
  if (efeito === 'topspin') return resolveTopspinSpecial(vencedor, situacao, tipo);
  return [];
}
