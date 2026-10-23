import type { PointDetailsForm, Action } from './point-details.types';

export const initialForm: PointDetailsForm = {
  situacao: null,
  tipo: null,
  golpe: null,
  subtipo1: null,
  subtipo2: null,
  efeito: null,
  duracao: null,
  direcao: null,
  golpeEsp: null,
  hitterId: null,
  receiverId: null,
};

export function formReducer(state: PointDetailsForm, action: Action): PointDetailsForm {
  switch (action.type) {
    case 'SET_SITUACAO':
      return { ...initialForm, situacao: action.value, receiverId: state.receiverId, hitterId: state.hitterId };
    case 'SET_TIPO':
      return { ...state, tipo: action.value, golpe: null, subtipo1: null, subtipo2: null, efeito: null, duracao: null, direcao: null, golpeEsp: null };
    case 'SET_GOLPE':
      return { ...state, golpe: action.value, subtipo1: null, subtipo2: null, efeito: null, duracao: null, direcao: null, golpeEsp: null };
    case 'SET_DURACAO':
      return { ...state, duracao: action.value };
    case 'SET_SUBTIPO1':
      // BUG FIX (Duração fantasma): o ponto terminou na devolução do saque —
      // se o usuário voltar e trocar o subtipo1 para devolucao_saque depois de
      // ter escolhido uma duração, o valor ficava stale no form e era enviado
      // no payload mesmo com a seção escondida.
      return {
        ...state,
        subtipo1: action.value,
        subtipo2: null,
        efeito: null,
        direcao: null,
        golpeEsp: null,
        duracao: action.value === 'devolucao_saque' ? null : state.duracao,
      };
    case 'SET_SUBTIPO2':
      return { ...state, subtipo2: action.value, efeito: null, direcao: null, golpeEsp: null };
    case 'SET_EFEITO':
      return { ...state, efeito: action.value, direcao: null, golpeEsp: null };
    case 'SET_DIRECAO':
      return { ...state, direcao: action.value, golpeEsp: null };
    case 'SET_GOLPE_ESP':
      return { ...state, golpeEsp: action.value };
    case 'SET_HITTER':
      return { ...state, hitterId: action.value };
    case 'SET_RECEIVER':
      return { ...state, receiverId: action.value };
    case 'RESET':
      return initialForm;
    default:
      return state;
  }
}
