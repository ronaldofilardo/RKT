'use client';

import { logger } from '@/lib/logger';
import DashboardPage from '@/app/dashboard/page';

export default function RelatoriosPage() {
  logger.info("[RelatoriosPage] mount");
  return <DashboardPage />;
}

