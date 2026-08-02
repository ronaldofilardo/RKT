'use client';

import { logger } from '@/lib/logger';
import DashboardPage from '@/app/dashboard/page';

export default function HistoricoPage() {
  logger.info("[HistoricoPage] mount");
  return <DashboardPage />;
}
