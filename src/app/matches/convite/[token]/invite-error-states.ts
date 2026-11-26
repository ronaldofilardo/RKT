export type InviteErrorCode =
  | 'SPECTATOR_LIMIT'
  | 'ACCESS_EXPIRED'
  | 'MINOR_BROADCAST_NOT_CONSENTED'
  | 'MATCH_PRIVATE'
  | 'CIRCLE_ACCOUNT_REQUIRED'
  | 'NOT_IN_CIRCLE'
  | 'INVITE_INVALID';

/** Estados de erro do redeem de convite de espectador (fora de SPECTATOR_LIMIT). */
export const ERROR_STATES: Record<
  Exclude<InviteErrorCode, 'SPECTATOR_LIMIT'>,
  { icon: 'link-off' | 'users' | 'lock'; title: string; description: string; actionText: string; actionHref: string }
> = {
  ACCESS_EXPIRED: {
    icon: 'link-off',
    title: 'Convite expirado',
    description: 'O prazo de 7 dias para acompanhar esta partida encerrada já terminou.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  MINOR_BROADCAST_NOT_CONSENTED: {
    icon: 'lock',
    title: 'Compartilhamento aguardando consentimento',
    description: 'Esta partida envolve menor de idade e exige autorização do responsável legal (ECA Digital / LGPD).',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  MATCH_PRIVATE: {
    icon: 'lock',
    title: 'Partida privada',
    description: 'O criador alterou esta partida para Privada e ela não está mais disponível por link.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  CIRCLE_ACCOUNT_REQUIRED: {
    icon: 'lock',
    title: 'Entre com sua conta',
    description: 'Esta partida é restrita aos envolvidos diretos (atletas, responsáveis, treinadores e gestor). Faça login para continuar.',
    actionText: 'Entrar na conta',
    actionHref: '/login',
  },
  NOT_IN_CIRCLE: {
    icon: 'lock',
    title: 'Acesso restrito ao círculo',
    description: 'Apenas atletas, responsáveis, treinadores e gestor vinculados a esta partida podem acompanhá-la.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  INVITE_INVALID: {
    icon: 'link-off',
    title: 'Convite inválido ou expirado',
    description: 'Confira o link ou peça um novo ao dono da partida.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
};
