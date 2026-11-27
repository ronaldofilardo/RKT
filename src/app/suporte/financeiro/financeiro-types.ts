export type FinanceiroSubtab = 'visao-geral' | 'usuarios' | 'cobrancas' | 'planos';

export interface FinancialUserItem {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role: string;
  createdAt: string;
  clubName: string | null;
  status: string;
  planTier: string | null;
  planName: string;
  cycle: 'MONTHLY' | 'YEARLY' | null;
  billingType: string | null;
  monthlyFee: number;
  dueDate: string | null;
  matchesUsed: number;
  matchesLimit: number | null;
  daysRemaining: number | null;
  canCreateMatch: boolean;
  message: string;
}

export interface FinancialOverviewData {
  inTrial: number;
  active: number;
  pastDue: number;
  suspended: number;
  estimatedMrr: number;
  totalPaidRevenue: number;
}

export interface FinancialInvoiceItem {
  id: string;
  subscriptionId: string;
  asaasPaymentId: string | null;
  value: number;
  dueDate: string;
  status: string;
  billingType: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixCopiaECola: string | null;
  paidAt: string | null;
  createdAt: string;
  planTier: string;
  payerName: string;
  payerEmail: string | null;
}
