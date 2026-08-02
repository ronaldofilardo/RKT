'use client';

import { logger } from '@/lib/logger';
import DashboardPage from '@/app/dashboard/page';

export default function DadosPessoaisPage() {
  logger.info("[DadosPessoaisPage] mount");
  return <DashboardPage />;
}
