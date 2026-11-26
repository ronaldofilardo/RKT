import type { Metadata } from 'next';
import { HelpReferenciaPage } from '../referencia-page';

export const metadata: Metadata = { title: 'Glosário' };

export default function GlosarioPage() {
  return <HelpReferenciaPage slug="glosario" />;
}
