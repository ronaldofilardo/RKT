import type { RallyDetails } from './types';

/**
 * Estrutura mínima vinda do `prisma.pointLog.findMany` usada na reconstrução
 * do relatório. Mantida aqui (em vez de importar o tipo Prisma) para isolar a
 * rota de tipos de schema e facilitar testes.
 */
export interface PointLogRow {
  id: string;
  winnerId: string;
  type: string;
  serverId: string;
  timestamp: Date;
  sequenceNumber: number | null;
  clientEventId: string | null;
  receiverId?: string | null;
  courtSide?: 'deuce' | 'ad' | null;
  hitterId?: string | null;
  annotations:
    | {
        rallyDetails?: RallyDetails | null;
        rallyLength?: number;
        isFirstServe?: boolean;
        isSecondServe?: boolean;
        firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
        note?: string;
        zone?: string;
        stroke?: string;
        receiverId?: string;
        courtSide?: 'deuce' | 'ad';
        hitterId?: string;
        serverId?: string;
      }
    | null;
  hasAudioNote?: boolean;
  audioNoteDuration: number | null;
  audioNoteMime?: string | null;
}
