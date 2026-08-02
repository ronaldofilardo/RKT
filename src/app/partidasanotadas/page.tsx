'use client';

import { logger } from '@/lib/logger';
import DashboardPage from '@/app/dashboard/page';

export default function PartidasAnotadasPage() {
  logger.info("[PartidasAnotadasPage] mount");
  return <DashboardPage />;
}
