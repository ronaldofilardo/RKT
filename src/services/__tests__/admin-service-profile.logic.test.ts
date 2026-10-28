import {
  deriveUserProfile,
  deriveUserClub,
  formatAdminUser,
} from '../admin-service-profile.logic';

describe('admin-service-profile.logic', () => {
  it('identifica Administrador do Sistema', () => {
    const admin = {
      id: '1',
      name: 'Administrador do Sistema',
      email: 'admin@rkt.com',
      cpf: '87545772920',
      role: 'ADMIN',
      club: 'Administração Geral',
      isActive: true,
      createdAt: new Date(),
    };
    expect(deriveUserProfile(admin)).toBe('ADMIN');
    expect(deriveUserClub(admin)).toBe('Administração Geral');
  });

  it('identifica Responsável/gestor de clube', () => {
    const gestor = {
      id: '2',
      name: 'Eduardo',
      email: 'eduardo@rkt.com',
      cpf: '53051173991',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      memberships: [
        {
          kind: 'GESTOR',
          status: 'ACTIVE',
          ct: { name: 'TENNIS' },
        },
      ],
    };
    expect(deriveUserProfile(gestor)).toBe('Responsavel/gestor de clube');
    expect(deriveUserClub(gestor)).toBe('TENNIS');
  });

  it('identifica Suporte da plataforma', () => {
    const suporte = {
      id: '3',
      name: 'Suporte RKT',
      email: 'suporte@rkt.com',
      cpf: '00000000000',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      memberships: [
        {
          kind: 'PLATAFORMA',
          preset: 'SUPORTE',
          status: 'ACTIVE',
        },
      ],
    };
    expect(deriveUserProfile(suporte)).toBe('Suporte');
    expect(deriveUserClub(suporte)).toBe('-');
  });

  it('identifica Atleta vinculado a clube', () => {
    const atletaClube = {
      id: '4',
      name: 'Peterson',
      email: 'roeoe@rkt.com',
      cpf: '12345679801',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      athleteProfile: {
        id: 'p1',
        playerCts: [
          {
            status: 'ACTIVE',
            ct: { name: 'TENNIS' },
          },
        ],
      },
    };
    expect(deriveUserProfile(atletaClube)).toBe('Atleta vinculado a clube');
    expect(deriveUserClub(atletaClube)).toBe('TENNIS');
  });

  it('identifica Atleta avulso', () => {
    const atletaAvulso = {
      id: '5',
      name: 'Anotador de Teste',
      email: 'anotador@rkt.com',
      cpf: '12345678901',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      athleteProfile: {
        id: 'p2',
        playerCts: [],
      },
    };
    expect(deriveUserProfile(atletaAvulso)).toBe('Atleta avulso');
    expect(deriveUserClub(atletaAvulso)).toBe('-');
  });

  it('identifica Treinador de clube e Treinador avulso', () => {
    const coachCt = {
      id: '6',
      name: 'Treinador Clube',
      email: 'coach@rkt.com',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      memberships: [{ kind: 'TREINADOR', status: 'ACTIVE', ct: { name: 'TENNIS' } }],
    };
    expect(deriveUserProfile(coachCt)).toBe('Treinador de clube');
    expect(deriveUserClub(coachCt)).toBe('TENNIS');

    const coachAvulso = {
      id: '7',
      name: 'Treinador Avulso',
      email: 'coach2@rkt.com',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date(),
      memberships: [{ kind: 'TREINADOR', status: 'ACTIVE' }],
    };
    expect(deriveUserProfile(coachAvulso)).toBe('Treinador avulso');
    expect(deriveUserClub(coachAvulso)).toBe('-');
  });

  it('formata objeto completo para exibição no admin', () => {
    const formatted = formatAdminUser({
      id: 'u1',
      name: 'Peterson',
      email: 'roeoe@rkt.com',
      cpf: '12345679801',
      role: 'ANNOTATOR',
      isActive: true,
      createdAt: new Date('2026-10-27T10:00:00Z'),
      athleteProfile: {
        id: 'p1',
        playerCts: [{ status: 'ACTIVE', ct: { name: 'TENNIS' } }],
      },
    });
    expect(formatted).toEqual({
      id: 'u1',
      name: 'Peterson',
      email: 'roeoe@rkt.com',
      cpf: '12345679801',
      role: 'ANNOTATOR',
      profile: 'Atleta vinculado a clube',
      club: 'TENNIS',
      isActive: true,
      createdAt: '2026-10-27T10:00:00.000Z',
    });
  });
});

