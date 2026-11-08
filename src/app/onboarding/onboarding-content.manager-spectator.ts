import type { OnboardingProfileContent } from './onboarding-content.types';

export const GESTOR_CONTENT: OnboardingProfileContent = {
  label: 'Gestor',
  icon: '🏛️',
  steps: [
    {
      title: 'Visão do painel executivo do seu CT',
      description: 'O painel do gestor concentra equipe, atletas e partidas do seu centro de treinamento.',
      highlights: [
        'Acompanhe o status do clube e das licenças',
        'Veja treinadores e atletas vinculados em um só lugar',
        'Use os atalhos para cadastrar membros e organizar a operação',
      ],
    },
    {
      title: 'Gestão de licenças, treinadores e atletas',
      description: 'Mantenha a comissão técnica atualizada e controle quem pode inserir atletas.',
      highlights: [
        'Gere links de senha provisória com validade de 7 dias',
        'Ative ou desative a permissão de cadastro por treinador',
        'Edite dados cadastrais sem sair da tabela',
      ],
    },
    {
      title: 'Enviar os primeiros convites para sua equipe',
      description: 'Convide treinadores e atletas para acessar o CT com segurança.',
      highlights: [
        'Cada convite gera um link de uso único',
        'O membro define a própria senha no primeiro acesso',
        'Acompanhe quem ainda está com senha pendente',
      ],
    },
  ],
};

export const ESPECTADOR_CONTENT: OnboardingProfileContent = {
  label: 'Espectador',
  icon: '👀',
  steps: [
    {
      title: 'Acompanhamento e placar ao vivo',
      description: 'Siga partidas em tempo real e acompanhe o placar ponto a ponto.',
      highlights: [
        'Partidas em andamento aparecem no seu painel',
        'O placar é atualizado a cada ponto registrado',
        'Você pode solicitar o link de transmissão ao organizador',
      ],
    },
    {
      title: 'Como funciona o placar ponto a ponto',
      description: 'Cada ponto registrado atualiza o placar, o momentum e as estatísticas da partida.',
      highlights: [
        'O placar respeita o formato escolhido para o jogo',
        'O histórico mostra a sequência completa de pontos',
        'Os gráficos são liberados ao final da partida',
      ],
    },
    {
      title: 'Iniciar sua primeira anotação avulsa',
      description: 'Anote uma partida por conta própria para experimentar a telemetria.',
      highlights: [
        'Use Nova Partida para abrir a mesa de anotação',
        'Você pode anotar sem vínculo com clube ou treinador',
        'A partida fica salva no seu histórico',
      ],
    },
  ],
};
