import type { Metadata } from 'next';
import { HelpReferenciaPage } from '../referencia-page';

export const metadata: Metadata = { title: 'Perguntas frequentes' };

export default function FaqPage() {
  return <HelpReferenciaPage slug="faq" />;
}
