import type { OnboardingProfileContent } from './onboarding-content.types';

export const ATLETA_CONTENT: OnboardingProfileContent = {
  label: 'Atleta',
  icon: '🎾',
  steps: [
    {
      title: 'O que é o RKT e a telemetria de tênis',
      description: 'O RKT registra cada ponto e transforma a partida em dados de desempenho, sem planilhas manuais.',
      highlights: [
        'Cada ponto alimenta índices de pressão, saque e momentum',
        'Seu histórico fica disponível em qualquer dispositivo',
        'Você pode registrar partidas próprias ou vinculadas a um treinador',
      ],
    },
    {
      title: 'Como ler seus gráficos de momentum e saque',
      description: 'Os gráficos mostram quem controla o jogo e em que momento o rendimento muda.',
      highlights: [
        'Momentum indica a sequência de pontos dominantes',
        'Saque mostra eficiência por game e por tipo de quadra',
        'Compare partidas para encontrar padrões no seu jogo',
      ],
    },
    {
      title: 'Crie ou busque sua primeira partida',
      description: 'Comece registrando um jogo novo ou localize uma partida em que você já participou.',
      highlights: [
        'Use Nova Partida para iniciar uma anotação',
        'Partidas vinculadas aparecem automaticamente no histórico',
        'Cada partida concluída atualiza seus indicadores',
      ],
    },
  ],
};

export const TREINADOR_CONTENT: OnboardingProfileContent = {
  label: 'Treinador',
  icon: '📋',
  steps: [
    {
      title: 'Visão geral da gestão da sua equipe',
      description: 'Acompanhe atletas, partidas e anotações em um único painel de trabalho.',
      highlights: [
        'Veja rapidamente quem está em quadra e quem aguarda anotação',
        'Organize seus atletas por clube ou como treinador particular',
        'Consulte o histórico técnico antes de montar o próximo treino',
      ],
    },
    {
      title: 'Como cadastrar atletas e organizar categorias',
      description: 'Cadastre seus atletas e mantenha a base pronta para receber partidas e relatórios.',
      highlights: [
        'Use Cadastrar Atleta para criar o vínculo com o treinador',
        'Categorias ajudam a comparar desempenho com critério',
        'Atletas vinculados aparecem no seu dashboard automaticamente',
      ],
    },
    {
      title: 'Iniciar uma anotação de treino ou torneio',
      description: 'Registre o jogo ponto a ponto para gerar telemetria imediata.',
      highlights: [
        'Escolha o formato da partida antes de começar',
        'A anotação funciona mesmo com conexão instável',
        'Ao finalizar, os gráficos ficam disponíveis para o atleta',
      ],
    },
  ],
};
