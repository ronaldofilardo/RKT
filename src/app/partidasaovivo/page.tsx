'use client';

import { logger } from '@/lib/logger';
import DashboardPage from '@/app/dashboard/page';

export default function PartidasAoVivoPage() {
  logger.info("[PartidasAoVivoPage] mount");
  return <DashboardPage />;
}
