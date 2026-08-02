import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes do Tailwind de forma inteligente, removendo duplicatas
 * e resolvendo conflitos de forma determinística.
 * 
 * @example
 * cn('btn', 'btn-primary', { 'btn-disabled': disabled })
 * cn('flex', className) // Tailwind classes substituem as padrão
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para o padrão brasileiro
 * 
 * @example
 * formatDate(new Date()) // "20/07/2026"
 * formatDate(new Date(), 'en-US') // "07/20/2026"
 */
export function formatDate(date: Date | string | null | undefined, locale = 'pt-BR'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return '';
  }
}

/**
 * Formata uma data com hora
 * 
 * @example
 * formatDateTime(new Date()) // "20/07/2026 às 14:30"
 */
export function formatDateTime(date: Date | string | null | undefined, locale = 'pt-BR'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '';
  }
}

/**
 * Formata um valor como moeda brasileira (BRL)
 * 
 * @example
 * formatCurrency(100) // "R$ 100,00"
 * formatCurrency(100.5) // "R$ 100,50"
 */
export function formatCurrency(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número com separadores de milhar
 * 
 * @example
 * formatNumber(1000000) // "1.000.000"
 */
export function formatNumber(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formata um número como porcentagem
 * 
 * @example
 * formatPercent(0.75) // "75%"
 * formatPercent(0.756, 1) // "75,6%"
 */
export function formatPercent(value: number, fractionDigits = 0, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Trunca um texto com reticências
 * 
 * @example
 * truncate('Texto muito longo', 10) // "Texto m..."
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitaliza a primeira letra de cada palavra
 * 
 * @example
 * capitalize('joão da silva') // "João Da Silva"
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gera classes condicionais baseadas em condições
 * 
 * @example
 * conditionalClasses({
 *   'btn-disabled': disabled,
 *   'btn-loading': loading,
 * })
 */
export function conditionalClasses(classes: Record<string, boolean>): string {
  return Object.entries(classes)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(' ');
}